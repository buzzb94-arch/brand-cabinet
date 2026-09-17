"""
Скрипт для наполнения каталога тестовыми товарами.

Запуск:
    cd backend
    python seed.py

Если база пустая — добавит демо-товары, чтобы после деплоя каталог
не был пустым. Повторный запуск пропускает уже существующие товары.
"""

from app.database import SessionLocal, engine, Base
from app.models import Product

# TODO: заменить на реальные товары бренда
DEMO_PRODUCTS = [
    {
        "title": "Крем для рук питательный",
        "description": "Насыщенный крем с маслом ши и витамином E. Быстро впитывается, "
                       "восстанавливает сухую кожу рук. Объём 75 мл.",
        "price": 890,
        "collection": "Уход за кожей",
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
        "in_stock": True,
    },
    {
        "title": "Сыворотка с гиалуроновой кислотой",
        "description": "Интенсивное увлажнение и разглаживание мелких морщин. "
                       "Подходит для всех типов кожи. Объём 30 мл.",
        "price": 2400,
        "collection": "Уход за кожей",
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
        "in_stock": True,
    },
    {
        "title": "Скраб для тела кофейный",
        "description": "Натуральный скраб на основе молотого кофе и тростникового сахара. "
                       "Отшелушивает и тонизирует. Объём 200 мл.",
        "price": 1250,
        "collection": "Уход за телом",
        "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
        "in_stock": True,
    },
    {
        "title": "Масло для тела с лавандой",
        "description": "Расслабляющее масло для массажа и ухода за кожей. "
                       "Аромат лаванды успокаивает. Объём 150 мл.",
        "price": 1690,
        "collection": "Уход за телом",
        "image_url": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600",
        "in_stock": True,
    },
    {
        "title": "Свеча ароматическая «Сандал»",
        "description": "Соевый воск, хлопковый фитиль, время горения около 40 часов. "
                       "Тёплый древесный аромат. Вес 200 г.",
        "price": 1980,
        "collection": "Ароматы для дома",
        "image_url": "https://images.unsplash.com/photo-1602874801006-e26d3b3e30bc?w=600",
        "in_stock": True,
    },
    {
        "title": "Диффузор ароматический «Инжир»",
        "description": "Аромат спелого инжира и зелёного листа. "
                       "Комплект с палочками, хватает на 2–3 месяца. Объём 100 мл.",
        "price": 2200,
        "collection": "Ароматы для дома",
        "image_url": "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600",
        "in_stock": True,
    },
    {
        "title": "Гель для душа с алоэ",
        "description": "Мягкое очищение без сульфатов. Подходит для чувствительной кожи. "
                       "Объём 250 мл.",
        "price": 990,
        "collection": "Уход за телом",
        "image_url": "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=600",
        "in_stock": True,
    },
    {
        "title": "Маска для лица глиняная",
        "description": "Детокс-маска с белой глиной и зелёным чаем. "
                       "Сужает поры, матирует. Объём 100 мл.",
        "price": 1390,
        "collection": "Уход за кожей",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
        "in_stock": True,
    },
    {
        "title": "Подарочный набор «Ритуал»",
        "description": "Гель для душа, скраб и масло для тела в подарочной упаковке. "
                       "Готовый подарок для близкого человека.",
        "price": 4900,
        "collection": "Подарочные наборы",
        "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600",
        "in_stock": True,
    },
    {
        "title": "Набор мини-средств «В дорогу»",
        "description": "Четыре миниатюры базового ухода в удобном несессере. "
                       "Подходит для ручной клади.",
        "price": 2750,
        "collection": "Подарочные наборы",
        "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
        "in_stock": True,
    },
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        created = 0
        skipped = 0

        for item in DEMO_PRODUCTS:
            exists = db.query(Product).filter(Product.title == item["title"]).first()
            if exists:
                skipped += 1
                continue

            db.add(Product(**item))
            created += 1

        db.commit()
        print(f"Готово: добавлено {created}, пропущено {skipped} (уже были).")
        print(f"Всего товаров в базе: {db.query(Product).count()}")
    except Exception as exc:
        db.rollback()
        print(f"Ошибка: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
