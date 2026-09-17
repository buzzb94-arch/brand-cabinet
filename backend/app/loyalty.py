from sqlalchemy import func
from sqlalchemy.orm import Session
from .models import Client, Order, OrderStatus, Product
from .config import settings


def calculate_loyalty_tier(total_orders_sum: float) -> str:
    """Определяет уровень лояльности по сумме заказов"""
    thresholds = settings.LOYALTY_THRESHOLDS
    
    if total_orders_sum >= thresholds["gold"]:
        return "gold"
    elif total_orders_sum >= thresholds["silver"]:
        return "silver"
    else:
        return "bronze"


def get_cashback_percent(tier: str) -> float:
    """Возвращает процент кэшбэка для уровня"""
    return settings.LOYALTY_CASHBACK.get(tier, 0.05)


def update_client_loyalty_tier(db: Session, client: Client):
    """Пересчитывает и обновляет уровень лояльности клиента"""
    # Считаем сумму всех завершённых заказов
    total_sum = db.query(func.sum(Order.quantity * Product.price)).select_from(Order).join(
        Product, Order.product_id == Product.id
    ).filter(
        Order.client_id == client.id,
        Order.status == OrderStatus.done
    ).scalar() or 0.0
    
    new_tier = calculate_loyalty_tier(total_sum)
    client.loyalty_tier = new_tier
    db.commit()
    return new_tier


def get_progress_to_next_tier(total_orders_sum: float) -> dict:
    """Возвращает прогресс до следующего уровня"""
    thresholds = settings.LOYALTY_THRESHOLDS
    current_tier = calculate_loyalty_tier(total_orders_sum)
    
    if current_tier == "gold":
        return {
            "current_tier": "gold",
            "next_tier": None,
            "current_sum": total_orders_sum,
            "next_threshold": None,
            "progress_percent": 100
        }
    elif current_tier == "silver":
        next_threshold = thresholds["gold"]
        return {
            "current_tier": "silver",
            "next_tier": "gold",
            "current_sum": total_orders_sum,
            "next_threshold": next_threshold,
            "progress_percent": int((total_orders_sum / next_threshold) * 100)
        }
    else:  # bronze
        next_threshold = thresholds["silver"]
        return {
            "current_tier": "bronze",
            "next_tier": "silver",
            "current_sum": total_orders_sum,
            "next_threshold": next_threshold,
            "progress_percent": int((total_orders_sum / next_threshold) * 100)
        }
