import { useEffect, useState } from 'react';
import { client } from '../api/client';
import { Package } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  processing: 'В обработке',
  confirmed: 'Подтверждена',
  shipped: 'Отправлена',
  done: 'Завершена',
  cancelled: 'Отменена',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await client.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка заявок...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold">Мои заявки</h1>
      </div>

      {orders.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <Package className="mx-auto mb-4 text-gray-400" size={64} />
          <p>У вас пока нет заявок</p>
        </div>
      )}

      <div className="px-4 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{order.product?.title || 'Товар'}</h3>
                <p className="text-sm text-gray-600">
                  Количество: {order.quantity}
                </p>
                {order.comment && (
                  <p className="text-sm text-gray-600 mt-1">
                    Комментарий: {order.comment}
                  </p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_COLORS[order.status]
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
              {order.product && (
                <span className="font-semibold text-brand">
                  {order.product.price * order.quantity} ₽
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
