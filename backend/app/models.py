from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


class OrderStatus(str, enum.Enum):
    new = "new"
    processing = "processing"
    confirmed = "confirmed"
    shipped = "shipped"
    done = "done"
    cancelled = "cancelled"


class ReviewStatus(str, enum.Enum):
    published = "published"
    hidden = "hidden"


class ReferralStatus(str, enum.Enum):
    pending = "pending"
    rewarded = "rewarded"


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    bonus_balance = Column(Integer, default=0)
    loyalty_tier = Column(String(20), default="bronze")
    referral_code = Column(String(20), unique=True, nullable=False, index=True)
    referred_by_client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    orders = relationship("Order", back_populates="client")
    bonus_events = relationship("BonusEvent", back_populates="client")
    reviews = relationship("Review", back_populates="client")
    referrals_made = relationship("Referral", foreign_keys="Referral.referrer_client_id", back_populates="referrer")
    referrals_received = relationship("Referral", foreign_keys="Referral.referred_client_id", back_populates="referred")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    collection = Column(String(100), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    in_stock = Column(Boolean, default=True)
    avg_rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    orders = relationship("Order", back_populates="product")
    reviews = relationship("Review", back_populates="product")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(Enum(OrderStatus), default=OrderStatus.new)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    client = relationship("Client", back_populates="orders")
    product = relationship("Product", back_populates="orders")
    reviews = relationship("Review", back_populates="order")


class BonusEvent(Base):
    __tablename__ = "bonus_events"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # может быть отрицательным при списании
    reason = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    client = relationship("Client", back_populates="bonus_events")


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    text = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.published)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    client = relationship("Client", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
    order = relationship("Order", back_populates="reviews")


class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    referrer_client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    referred_client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    status = Column(Enum(ReferralStatus), default=ReferralStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    referrer = relationship("Client", foreign_keys=[referrer_client_id], back_populates="referrals_made")
    referred = relationship("Client", foreign_keys=[referred_client_id], back_populates="referrals_received")
