from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ADMIN_KEY: str = "dev-admin-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Yandex Disk
    YANDEX_DISK_TOKEN: Optional[str] = None
    
    # Loyalty and bonuses (константы для настройки)
    WELCOME_BONUS: int = 100
    REVIEW_PHOTO_BONUS: int = 30
    REFERRAL_BONUS_REFERRER: int = 150
    REFERRAL_BONUS_REFERRED: int = 100
    
    # Loyalty tiers thresholds (в рублях)
    LOYALTY_THRESHOLDS: dict = {
        "bronze": 0,
        "silver": 10000,
        "gold": 30000
    }
    
    # Cashback percentages by tier
    LOYALTY_CASHBACK: dict = {
        "bronze": 0.05,  # 5%
        "silver": 0.07,  # 7%
        "gold": 0.10     # 10%
    }
    
    class Config:
        env_file = ".env"


settings = Settings()
