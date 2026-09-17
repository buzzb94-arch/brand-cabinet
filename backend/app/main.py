from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from .database import engine, get_db, Base
from .models import (
    Client, Product, Order, BonusEvent, Review, Referral,
    OrderStatus, ReviewStatus, ReferralStatus
)
from .schemas import (
    ClientRegister, ClientLogin, ClientUpdate, ClientResponse, Token,
    ProductCreate, ProductResponse, OrderCreate, OrderResponse, OrderStatusUpdate,
    BonusEventResponse, ReviewCreate, ReviewResponse, ReviewStatusUpdate, ReferralStats
)
from .auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_client, verify_admin_key, generate_referral_code
)
from .loyalty import update_client_loyalty_tier, get_cashback_percent, get_progress_to_next_tier
from .config import settings
from .yandex_sync import sync_to_yandex_disk, upload_review_photo, sync_all_data

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Brand Cabinet API", version="1.0.0")

# CORS - TODO: перед продакшеном сузить до конкретного домена фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ AUTH ============

@app.post("/auth/register", response_model=Token)
async def register(client_data: ClientRegister, db: Session = Depends(get_db)):
    # Проверка существующего email
    existing_client = db.query(Client).filter(Client.email == client_data.email).first()
    if existing_client:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Генерация уникального реферального кода
    referral_code = generate_referral_code()
    while db.query(Client).filter(Client.referral_code == referral_code).first():
        referral_code = generate_referral_code()
    
    # Проверка реферального кода пригласившего
    referrer_client = None
    if client_data.referral_code:
        referrer_client = db.query(Client).filter(
            Client.referral_code == client_data.referral_code
        ).first()
    
    # Создание клиента
    new_client = Client(
        name=client_data.name,
        email=client_data.email,
        phone=client_data.phone,
        hashed_password=get_password_hash(client_data.password),
        referral_code=referral_code,
        referred_by_client_id=referrer_client.id if referrer_client else None,
        bonus_balance=settings.WELCOME_BONUS
    )
    
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    
    # Приветственный бонус
    welcome_bonus = BonusEvent(
        client_id=new_client.id,
        amount=settings.WELCOME_BONUS,
        reason="Приветственный бонус"
    )
    db.add(welcome_bonus)
    db.commit()
    
    # Синхронизация с Яндекс.Диском
    try:
        await sync_to_yandex_disk(
            "bonuses.xlsx",
            ["ID", "Client ID", "Amount", "Reason", "Created At"],
            [welcome_bonus.id, new_client.id, welcome_bonus.amount, welcome_bonus.reason, str(welcome_bonus.created_at)]
        )
    except Exception as e:
        logger.error(f"Failed to sync welcome bonus: {e}")
    
    # Создание реферальной связи
    if referrer_client:
        referral = Referral(
            referrer_client_id=referrer_client.id,
            referred_client_id=new_client.id,
            status=ReferralStatus.pending
        )
        db.add(referral)
        db.commit()
        
        try:
            await sync_to_yandex_disk(
                "referrals.xlsx",
                ["ID", "Referrer Client ID", "Referred Client ID", "Status", "Created At"],
                [referral.id, referral.referrer_client_id, referral.referred_client_id, referral.status.value, str(referral.created_at)]
            )
        except Exception as e:
            logger.error(f"Failed to sync referral: {e}")
    
    # Генерация токена
    access_token = create_access_token(data={"sub": str(new_client.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/login", response_model=Token)
def login(credentials: ClientLogin, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == credentials.email).first()
    if not client or not verify_password(credentials.password, client.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(client.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# ============ CLIENT ============

@app.get("/me")
async def get_me(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    # Получаем прогресс до следующего уровня
    total_sum = db.query(func.sum(Order.quantity * Product.price)).select_from(Order).join(
        Product, Order.product_id == Product.id
    ).filter(
        Order.client_id == current_client.id,
        Order.status == OrderStatus.done
    ).scalar() or 0.0
    
    progress = get_progress_to_next_tier(total_sum)
    cashback_percent = int(get_cashback_percent(current_client.loyalty_tier) * 100)
    
    return {
        "id": current_client.id,
        "name": current_client.name,
        "email": current_client.email,
        "phone": current_client.phone,
        "bonus_balance": current_client.bonus_balance,
        "loyalty_tier": current_client.loyalty_tier,
        "referral_code": current_client.referral_code,
        "cashback_percent": cashback_percent,
        "created_at": current_client.created_at,
        "tier_progress": progress
    }


@app.patch("/me", response_model=ClientResponse)
def update_me(
    client_update: ClientUpdate,
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    if client_update.name is not None:
        current_client.name = client_update.name
    if client_update.phone is not None:
        current_client.phone = client_update.phone
    
    db.commit()
    db.refresh(current_client)
    
    cashback_percent = int(get_cashback_percent(current_client.loyalty_tier) * 100)
    
    return ClientResponse(
        id=current_client.id,
        name=current_client.name,
        email=current_client.email,
        phone=current_client.phone,
        bonus_balance=current_client.bonus_balance,
        loyalty_tier=current_client.loyalty_tier,
        referral_code=current_client.referral_code,
        cashback_percent=cashback_percent,
        created_at=current_client.created_at
    )


@app.get("/me/bonuses", response_model=List[BonusEventResponse])
def get_my_bonuses(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    events = db.query(BonusEvent).filter(
        BonusEvent.client_id == current_client.id
    ).order_by(BonusEvent.created_at.desc()).all()
    return events


@app.get("/me/orders", response_model=List[OrderResponse])
def get_my_orders(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(
        Order.client_id == current_client.id
    ).order_by(Order.created_at.desc()).all()
    return orders


@app.get("/me/referral", response_model=ReferralStats)
def get_my_referral_stats(
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    # Подсчитываем статистику
    referrals = db.query(Referral).filter(
        Referral.referrer_client_id == current_client.id
    ).all()
    
    total_referrals = len(referrals)
    rewarded_referrals = len([r for r in referrals if r.status == ReferralStatus.rewarded])
    total_earned = rewarded_referrals * settings.REFERRAL_BONUS_REFERRER
    
    # TODO: заменить на реальный домен фронтенда
    referral_link = f"https://yourdomain.com/register?referral_code={current_client.referral_code}"
    
    return ReferralStats(
        referral_code=current_client.referral_code,
        referral_link=referral_link,
        total_referrals=total_referrals,
        rewarded_referrals=rewarded_referrals,
        total_earned=total_earned
    )


# ============ PRODUCTS ============

@app.get("/products", response_model=List[ProductResponse])
def get_products(
    collection: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if collection:
        query = query.filter(Product.collection == collection)
    
    products = query.filter(Product.in_stock == True).all()
    return products


@app.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.status == ReviewStatus.published
    ).order_by(Review.created_at.desc()).all()
    return reviews


@app.post("/products/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(
    product_id: int,
    rating: int = Form(..., ge=1, le=5),
    text: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    # Проверяем, что у клиента есть завершённый заказ этого товара
    completed_order = db.query(Order).filter(
        Order.client_id == current_client.id,
        Order.product_id == product_id,
        Order.status == OrderStatus.done
    ).first()
    
    if not completed_order:
        raise HTTPException(
            status_code=403,
            detail="You can only review products from completed orders"
        )
    
    # Проверяем, что отзыв ещё не оставлен
    existing_review = db.query(Review).filter(
        Review.client_id == current_client.id,
        Review.order_id == completed_order.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this order")
    
    # Загрузка фото, если есть
    photo_url = None
    photo_bonus_given = False
    
    if photo:
        photo_data = await photo.read()
        filename = f"review_{current_client.id}_{product_id}_{completed_order.id}.jpg"
        photo_url = await upload_review_photo(photo_data, filename)
        
        # Начисляем бонус за фото, если загрузка успешна
        if photo_url:
            bonus_event = BonusEvent(
                client_id=current_client.id,
                amount=settings.REVIEW_PHOTO_BONUS,
                reason="Бонус за отзыв с фото"
            )
            current_client.bonus_balance += settings.REVIEW_PHOTO_BONUS
            db.add(bonus_event)
            photo_bonus_given = True
            
            try:
                await sync_to_yandex_disk(
                    "bonuses.xlsx",
                    ["ID", "Client ID", "Amount", "Reason", "Created At"],
                    [bonus_event.id, current_client.id, bonus_event.amount, bonus_event.reason, str(bonus_event.created_at)]
                )
            except Exception as e:
                logger.error(f"Failed to sync photo bonus: {e}")
    
    # Создаём отзыв
    review = Review(
        client_id=current_client.id,
        product_id=product_id,
        order_id=completed_order.id,
        rating=rating,
        text=text,
        photo_url=photo_url,
        status=ReviewStatus.published
    )
    db.add(review)
    db.flush()  # чтобы новый отзыв попал в агрегатный запрос ниже
    
    # Обновляем рейтинг товара
    product = db.query(Product).filter(Product.id == product_id).first()
    all_reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.status == ReviewStatus.published
    ).all()
    
    product.reviews_count = len(all_reviews)
    if product.reviews_count > 0:
        product.avg_rating = sum(r.rating for r in all_reviews) / product.reviews_count
    
    db.commit()
    db.refresh(review)
    
    return review


# ============ ORDERS ============

@app.post("/orders", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    # Проверяем существование товара
    product = db.query(Product).filter(Product.id == order_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.in_stock:
        raise HTTPException(status_code=400, detail="Product is out of stock")
    
    # Создаём заказ
    order = Order(
        client_id=current_client.id,
        product_id=order_data.product_id,
        quantity=order_data.quantity,
        comment=order_data.comment,
        status=OrderStatus.new
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Синхронизация с Яндекс.Диском
    try:
        await sync_to_yandex_disk(
            "orders.xlsx",
            ["ID", "Client ID", "Product ID", "Quantity", "Status", "Comment", "Created At"],
            [order.id, order.client_id, order.product_id, order.quantity, order.status.value, order.comment, str(order.created_at)]
        )
    except Exception as e:
        logger.error(f"Failed to sync order: {e}")
    
    return order


# ============ ADMIN ============

@app.get("/admin/orders", response_model=List[OrderResponse])
def get_all_orders(
    admin_key: str = Query(...),
    db: Session = Depends(get_db)
):
    verify_admin_key(admin_key)
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders


@app.patch("/admin/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    admin_key: str = Query(...),
    db: Session = Depends(get_db)
):
    verify_admin_key(admin_key)
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    order.status = status_update.status
    # Коммитим новый статус сразу: иначе агрегаты (уровень, кэшбэк,
    # реферальные условия) посчитаются без учёта текущего заказа
    db.commit()
    db.refresh(order)
    
    # Если заказ переводится в статус done
    if status_update.status == OrderStatus.done and old_status != OrderStatus.done:
        client = order.client
        product = order.product
        
        # Пересчитываем уровень лояльности
        update_client_loyalty_tier(db, client)
        db.refresh(client)
        
        # Начисляем кэшбэк по текущему уровню
        cashback_amount = int(product.price * order.quantity * get_cashback_percent(client.loyalty_tier))
        
        cashback_event = BonusEvent(
            client_id=client.id,
            amount=cashback_amount,
            reason=f"Кэшбэк за заказ #{order.id}"
        )
        client.bonus_balance += cashback_amount
        db.add(cashback_event)
        
        try:
            await sync_to_yandex_disk(
                "bonuses.xlsx",
                ["ID", "Client ID", "Amount", "Reason", "Created At"],
                [cashback_event.id, client.id, cashback_event.amount, cashback_event.reason, str(cashback_event.created_at)]
            )
        except Exception as e:
            logger.error(f"Failed to sync cashback: {e}")
        
        # Обрабатываем реферальную программу
        if client.referred_by_client_id:
            # Проверяем, первый ли это заказ приглашённого клиента
            first_done_order = db.query(Order).filter(
                Order.client_id == client.id,
                Order.status == OrderStatus.done
            ).count() == 1
            
            if first_done_order:
                # Ищем связанную реферальную запись
                referral = db.query(Referral).filter(
                    Referral.referred_client_id == client.id,
                    Referral.status == ReferralStatus.pending
                ).first()
                
                if referral:
                    # Начисляем бонусы обеим сторонам
                    referrer = db.query(Client).filter(Client.id == referral.referrer_client_id).first()
                    
                    # Бонус рефереру
                    referrer_bonus = BonusEvent(
                        client_id=referrer.id,
                        amount=settings.REFERRAL_BONUS_REFERRER,
                        reason="Реферальный бонус за приглашённого друга"
                    )
                    referrer.bonus_balance += settings.REFERRAL_BONUS_REFERRER
                    db.add(referrer_bonus)
                    
                    # Бонус приглашённому
                    referred_bonus = BonusEvent(
                        client_id=client.id,
                        amount=settings.REFERRAL_BONUS_REFERRED,
                        reason="Бонус за регистрацию по приглашению"
                    )
                    client.bonus_balance += settings.REFERRAL_BONUS_REFERRED
                    db.add(referred_bonus)
                    
                    # Обновляем статус реферала
                    referral.status = ReferralStatus.rewarded
                    
                    try:
                        await sync_to_yandex_disk(
                            "bonuses.xlsx",
                            ["ID", "Client ID", "Amount", "Reason", "Created At"],
                            [referrer_bonus.id, referrer.id, referrer_bonus.amount, referrer_bonus.reason, str(referrer_bonus.created_at)]
                        )
                        await sync_to_yandex_disk(
                            "bonuses.xlsx",
                            ["ID", "Client ID", "Amount", "Reason", "Created At"],
                            [referred_bonus.id, client.id, referred_bonus.amount, referred_bonus.reason, str(referred_bonus.created_at)]
                        )
                        await sync_to_yandex_disk(
                            "referrals.xlsx",
                            ["ID", "Referrer Client ID", "Referred Client ID", "Status", "Created At"],
                            [referral.id, referral.referrer_client_id, referral.referred_client_id, referral.status.value, str(referral.created_at)]
                        )
                    except Exception as e:
                        logger.error(f"Failed to sync referral bonuses: {e}")
    
    db.commit()
    db.refresh(order)
    return order


@app.post("/admin/products", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    admin_key: str = Query(...),
    db: Session = Depends(get_db)
):
    verify_admin_key(admin_key)
    
    product = Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.patch("/admin/reviews/{review_id}/status", response_model=ReviewResponse)
def update_review_status(
    review_id: int,
    status_update: ReviewStatusUpdate,
    admin_key: str = Query(...),
    db: Session = Depends(get_db)
):
    verify_admin_key(admin_key)
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    old_status = review.status
    review.status = status_update.status
    db.commit()
    db.refresh(review)
    
    # Если отзыв скрывается, пересчитываем рейтинг товара
    if status_update.status == ReviewStatus.hidden and old_status == ReviewStatus.published:
        product = review.product
        published_reviews = db.query(Review).filter(
            Review.product_id == product.id,
            Review.status == ReviewStatus.published
        ).all()
        
        product.reviews_count = len(published_reviews)
        if product.reviews_count > 0:
            product.avg_rating = sum(r.rating for r in published_reviews) / product.reviews_count
        else:
            product.avg_rating = 0.0
    
    # Если отзыв публикуется обратно, также пересчитываем
    if status_update.status == ReviewStatus.published and old_status == ReviewStatus.hidden:
        product = review.product
        published_reviews = db.query(Review).filter(
            Review.product_id == product.id,
            Review.status == ReviewStatus.published
        ).all()
        
        product.reviews_count = len(published_reviews)
        product.avg_rating = sum(r.rating for r in published_reviews) / product.reviews_count
    
    db.commit()
    db.refresh(review)
    return review


@app.post("/admin/sync-all")
async def sync_all(
    admin_key: str = Query(...),
    db: Session = Depends(get_db)
):
    verify_admin_key(admin_key)
    
    await sync_all_data(db)
    
    return {"message": "Full sync completed"}


@app.get("/")
def root():
    return {"message": "Brand Cabinet API", "version": "1.0.0"}
