import logging
import httpx
from io import BytesIO
from openpyxl import Workbook, load_workbook
from typing import List, Dict, Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

YANDEX_API_BASE = "https://cloud-api.yandex.net/v1/disk"
FOLDER_PATH = "/brand-cabinet"


async def ensure_folder_exists():
    """Создаёт папку на Яндекс.Диске, если её ещё нет"""
    if not settings.YANDEX_DISK_TOKEN:
        return
    
    headers = {"Authorization": f"OAuth {settings.YANDEX_DISK_TOKEN}"}
    
    try:
        async with httpx.AsyncClient() as client:
            # Проверяем существование папки
            response = await client.get(
                f"{YANDEX_API_BASE}/resources",
                headers=headers,
                params={"path": FOLDER_PATH}
            )
            
            if response.status_code == 404:
                # Создаём папку
                await client.put(
                    f"{YANDEX_API_BASE}/resources",
                    headers=headers,
                    params={"path": FOLDER_PATH}
                )
                logger.info(f"Created folder {FOLDER_PATH} on Yandex Disk")
    except Exception as e:
        logger.error(f"Error ensuring folder exists: {e}")


async def sync_to_yandex_disk(filename: str, headers: List[str], row_data: List[Any]):
    """
    Синхронизирует данные с Яндекс.Диском
    - Скачивает существующий файл (или создаёт новый с заголовками)
    - Добавляет новую строку
    - Заливает обратно
    """
    if not settings.YANDEX_DISK_TOKEN:
        return
    
    try:
        await ensure_folder_exists()
        
        file_path = f"{FOLDER_PATH}/{filename}"
        auth_headers = {"Authorization": f"OAuth {settings.YANDEX_DISK_TOKEN}"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Пытаемся получить ссылку на скачивание
            response = await client.get(
                f"{YANDEX_API_BASE}/resources/download",
                headers=auth_headers,
                params={"path": file_path}
            )
            
            if response.status_code == 200:
                # Файл существует, скачиваем его
                download_url = response.json()["href"]
                file_response = await client.get(download_url)
                wb = load_workbook(BytesIO(file_response.content))
                ws = wb.active
            else:
                # Файл не существует, создаём новый
                wb = Workbook()
                ws = wb.active
                ws.append(headers)
            
            # Добавляем новую строку
            ws.append(row_data)
            
            # Сохраняем в память
            output = BytesIO()
            wb.save(output)
            output.seek(0)
            
            # Получаем ссылку на загрузку
            upload_response = await client.get(
                f"{YANDEX_API_BASE}/resources/upload",
                headers=auth_headers,
                params={"path": file_path, "overwrite": "true"}
            )
            
            if upload_response.status_code == 200:
                upload_url = upload_response.json()["href"]
                
                # Загружаем файл
                await client.put(
                    upload_url,
                    content=output.getvalue(),
                    headers={"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
                )
                
                logger.info(f"Synced data to {filename}")
            else:
                logger.error(f"Failed to get upload URL: {upload_response.status_code}")
                
    except Exception as e:
        logger.error(f"Error syncing to Yandex Disk: {e}")


async def upload_review_photo(photo_data: bytes, filename: str) -> Optional[str]:
    """
    Загружает фото отзыва на Яндекс.Диск и возвращает публичную ссылку
    """
    if not settings.YANDEX_DISK_TOKEN:
        return None
    
    try:
        await ensure_folder_exists()
        
        reviews_folder = f"{FOLDER_PATH}/reviews"
        file_path = f"{reviews_folder}/{filename}"
        auth_headers = {"Authorization": f"OAuth {settings.YANDEX_DISK_TOKEN}"}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Создаём папку reviews, если её нет
            await client.put(
                f"{YANDEX_API_BASE}/resources",
                headers=auth_headers,
                params={"path": reviews_folder}
            )
            
            # Получаем ссылку на загрузку
            upload_response = await client.get(
                f"{YANDEX_API_BASE}/resources/upload",
                headers=auth_headers,
                params={"path": file_path, "overwrite": "true"}
            )
            
            if upload_response.status_code != 200:
                logger.error(f"Failed to get upload URL: {upload_response.status_code}")
                return None
            
            upload_url = upload_response.json()["href"]
            
            # Загружаем файл
            await client.put(upload_url, content=photo_data)
            
            # Публикуем файл
            publish_response = await client.put(
                f"{YANDEX_API_BASE}/resources/publish",
                headers=auth_headers,
                params={"path": file_path}
            )
            
            if publish_response.status_code == 200:
                # Получаем публичную ссылку
                meta_response = await client.get(
                    f"{YANDEX_API_BASE}/resources",
                    headers=auth_headers,
                    params={"path": file_path}
                )
                
                if meta_response.status_code == 200:
                    public_url = meta_response.json().get("public_url")
                    logger.info(f"Uploaded review photo: {public_url}")
                    return public_url
            
            return None
            
    except Exception as e:
        logger.error(f"Error uploading review photo: {e}")
        return None


async def sync_all_data(db):
    """Полная пересинхронизация всех данных из базы в таблицы"""
    if not settings.YANDEX_DISK_TOKEN:
        logger.warning("Yandex Disk token not set, skipping sync")
        return
    
    try:
        from .models import Order, BonusEvent, Referral
        
        # Синхронизация заказов
        orders = db.query(Order).all()
        for order in orders:
            await sync_to_yandex_disk(
                "orders.xlsx",
                ["ID", "Client ID", "Product ID", "Quantity", "Status", "Comment", "Created At"],
                [order.id, order.client_id, order.product_id, order.quantity, order.status.value, order.comment, str(order.created_at)]
            )
        
        # Синхронизация бонусов
        bonus_events = db.query(BonusEvent).all()
        for event in bonus_events:
            await sync_to_yandex_disk(
                "bonuses.xlsx",
                ["ID", "Client ID", "Amount", "Reason", "Created At"],
                [event.id, event.client_id, event.amount, event.reason, str(event.created_at)]
            )
        
        # Синхронизация рефералов
        referrals = db.query(Referral).all()
        for referral in referrals:
            await sync_to_yandex_disk(
                "referrals.xlsx",
                ["ID", "Referrer Client ID", "Referred Client ID", "Status", "Created At"],
                [referral.id, referral.referrer_client_id, referral.referred_client_id, referral.status.value, str(referral.created_at)]
            )
        
        logger.info("Full sync completed")
        
    except Exception as e:
        logger.error(f"Error in full sync: {e}")
