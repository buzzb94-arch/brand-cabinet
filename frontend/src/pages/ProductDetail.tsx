import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products, orders } from '../api/client';
import { ArrowLeft, Star, ShoppingCart, Camera } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ quantity: 1, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '', photo: null as File | null });
  const [canReview, setCanReview] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadReviews();
      checkCanReview();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const allProducts = await products.getAll();
      const found = allProducts.find((p: any) => p.id === parseInt(id!));
      setProduct(found);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await products.getReviews(parseInt(id!));
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const myOrders = await orders.getAll();
      const completedOrder = myOrders.find(
        (o: any) => o.product_id === parseInt(id!) && o.status === 'done'
      );
      
      if (completedOrder) {
        const hasReview = reviews.some((r: any) => r.order_id === completedOrder.id);
        setCanReview(!hasReview);
      }
    } catch (error) {
      // Not authenticated or error
    }
  };

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      await orders.create({
        product_id: parseInt(id!),
        quantity: orderForm.quantity,
        comment: orderForm.comment || undefined,
      });
      
      setOrderModal(false);
      alert('Заявка успешно создана!');
    } catch (error: any) {
      alert(error.message || 'Ошибка создания заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReviewForm({ ...reviewForm, photo: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rating', reviewForm.rating.toString());
      if (reviewForm.text) {
        formData.append('text', reviewForm.text);
      }
      if (reviewForm.photo) {
        formData.append('photo', reviewForm.photo);
      }
      
      await products.createReview(parseInt(id!), formData);
      
      setReviewModal(false);
      alert('Отзыв отправлен! Спасибо!');
      loadReviews();
      setCanReview(false);
    } catch (error: any) {
      alert(error.message || 'Ошибка отправки отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 32 : 16}
            className={`${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!product) {
    return <div className="p-4">Товар не найден</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-full shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>
        
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-80 object-cover" />
        ) : (
          <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
            <ShoppingCart className="text-gray-400" size={80} />
          </div>
        )}
      </div>

      <div className="px-4 py-4 bg-white rounded-t-3xl -mt-6 relative z-10">
        <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
        <div className="flex items-center gap-2 mb-3">
          {renderStars(Math.round(product.avg_rating))}
          <span className="text-sm text-gray-600">({product.reviews_count} отзывов)</span>
        </div>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-brand">{product.price} ₽</span>
          <button
            onClick={() => setOrderModal(true)}
            className="bg-brand-accent text-white px-6 py-3 rounded-xl hover:opacity-90"
          >
            Оформить заявку
          </button>
        </div>
      </div>

      {/* Отзывы */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Отзывы</h2>
          {canReview && (
            <button
              onClick={() => setReviewModal(true)}
              className="text-brand-accent text-sm font-medium"
            >
              Оставить отзыв
            </button>
          )}
        </div>

        {reviews.length === 0 && (
          <p className="text-gray-500 text-center py-8">Пока нет отзывов</p>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                {renderStars(review.rating)}
                <span className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.text && <p className="text-gray-700 mb-2">{review.text}</p>}
              {review.photo_url && (
                <img
                  src={review.photo_url}
                  alt="Фото отзыва"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Модалка заказа */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setOrderModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Оформление заявки</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  value={orderForm.comment}
                  onChange={(e) => setOrderForm({ ...orderForm, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-brand-accent text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Отправка...' : 'Оформить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка отзыва */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setReviewModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Оставить отзыв</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оценка
                </label>
                {renderStars(reviewForm.rating, true, (rating) => setReviewForm({ ...reviewForm, rating }))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текст отзыва
                </label>
                <textarea
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фото (необязательно, +30 бонусов)
                </label>
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-500">Загрузить фото</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-brand-accent text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
