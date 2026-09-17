import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { products, orders } from '../api/client';
import { ShoppingCart, Star, Filter } from 'lucide-react';

export default function Catalog() {
  const [productList, setProductList] = useState<any[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [orderModal, setOrderModal] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({ quantity: 1, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [selectedCollection]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await products.getAll(selectedCollection || undefined);
      setProductList(data);
      
      // Извлекаем уникальные коллекции
      const uniqueCollections = Array.from(new Set(data.map((p: any) => p.collection).filter(Boolean)));
      setCollections(uniqueCollections as string[]);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (product: any) => {
    setOrderModal(product);
    setOrderForm({ quantity: 1, comment: '' });
  };

  const submitOrder = async () => {
    if (!orderModal) return;
    
    setSubmitting(true);
    try {
      await orders.create({
        product_id: orderModal.id,
        quantity: orderForm.quantity,
        comment: orderForm.comment || undefined,
      });
      
      setOrderModal(null);
      alert('Заявка успешно создана!');
    } catch (error: any) {
      alert(error.message || 'Ошибка создания заявки');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Загрузка каталога...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold">Каталог товаров</h1>
      </div>

      {/* Фильтр по коллекциям */}
      {collections.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Коллекции</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCollection('')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCollection === '' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'
              }`}
            >
              Все
            </button>
            {collections.map((collection) => (
              <button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedCollection === collection ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Товары */}
      <div className="px-4 grid grid-cols-2 gap-4">
        {productList.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-40 object-cover"
              />
            )}
            {!product.image_url && (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                <ShoppingCart className="text-gray-400" size={48} />
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.title}</h3>
              <div className="flex items-center gap-1 mb-2">
                {renderStars(Math.round(product.avg_rating))}
                <span className="text-xs text-gray-500">({product.reviews_count})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand">{product.price} ₽</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrderClick(product);
                  }}
                  className="bg-brand-accent text-white px-3 py-1 rounded-lg text-sm hover:opacity-90"
                >
                  Заказать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {productList.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Товары не найдены
        </div>
      )}

      {/* Модалка заказа */}
      {orderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setOrderModal(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{orderModal.title}</h3>
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
                  Комментарий (необязательно)
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
                  onClick={() => setOrderModal(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700"
                >
                  Отмена
                </button>
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Отправка...' : 'Оформить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
