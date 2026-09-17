from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .models import OrderStatus, ReviewStatus


# Client schemas
class ClientRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    referral_code: Optional[str] = None


class ClientLogin(BaseModel):
    email: EmailStr
    password: str


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    bonus_balance: int
    loyalty_tier: str
    referral_code: str
    cashback_percent: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Product schemas
class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    collection: Optional[str] = None
    image_url: Optional[str] = None
    in_stock: bool = True


class ProductResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price: float
    collection: Optional[str]
    image_url: Optional[str]
    in_stock: bool
    avg_rating: float
    reviews_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Order schemas
class OrderCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)
    comment: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    client_id: int
    product_id: int
    quantity: int
    status: OrderStatus
    comment: Optional[str]
    created_at: datetime
    product: ProductResponse
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# Bonus schemas
class BonusEventResponse(BaseModel):
    id: int
    amount: int
    reason: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Review schemas
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    text: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    client_id: int
    product_id: int
    order_id: int
    rating: int
    text: Optional[str]
    photo_url: Optional[str]
    status: ReviewStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewStatusUpdate(BaseModel):
    status: ReviewStatus


# Referral schemas
class ReferralStats(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int
    rewarded_referrals: int
    total_earned: int
