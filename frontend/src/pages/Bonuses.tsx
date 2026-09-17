import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../api/client';
import { TrendingUp, TrendingDown, Gift } from 'lucide-react';

export default function Bonuses() {
  const [userData, setUserData] = useState<any>(null);
  const [bonusHistory, setBonusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, history] = await Promise.all([
        client.getMe(),
        client.getBonuses(),
      ]);
      setUserData(user);
      setBonusHistory(history);
    } catch (error) {
      console.error('Failed to load bonus data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  const tierColors = {
    bronze: 'bg-loyalty-bronze',
    silver: 'bg-loyalty-silver',
    gold: 'bg-loyalty-gold',
  };

  const tierLabels = {
    bronze: 'Бронза',
    silver: 'Серебро',
    gold: 'Золото',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold mb-4">Мои бонусы</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="text-sm opacity-90 mb-1">Баланс бонусов</div>
          <div className="text-4xl font-bold">{userData?.bonus_balance || 0}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors[userData?.loyalty_tier as keyof typeof tierColors]} text-white`}>
            {tierLabels[userData?.loyalty_tier as keyof typeof tierLabels]}
          </span>
          <span className="text-sm opacity-90">Кэшбэк {userData?.cashback_percent}%</span>
        </div>

        {userData?.tier_progress && userData.tier_progress.next_tier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>До уровня {tierLabels[userData.tier_progress.next_tier as keyof typeof tierLabels]}</span>
              <span>{userData.tier_progress.current_sum} / {userData.tier_progress.next_threshold} ₽</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-brand-accent h-2 rounded-full transition-all"
                style={{ width: `${userData.tier_progress.progress_percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4">
        <Link
          to="/referral"
          className="block bg-gradient-to-r from-brand-accent to-orange-500 text-white p-4 rounded-2xl shadow-lg mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1">Пригласи друзей</h3>
              <p className="text-sm opacity-90">Получай бонусы за каждого друга</p>
            </div>
            <Gift size={32} />
          </div>
        </Link>

        <h2 className="text-lg font-bold mb-3">История</h2>

        {bonusHistory.length === 0 && (
          <p className="text-gray-500 text-center py-8">История пуста</p>
        )}

        <div className="space-y-3">
          {bonusHistory.map((event) => (
            <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {event.amount > 0 ? (
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                ) : (
                  <div className="bg-red-100 p-2 rounded-full">
                    <TrendingDown className="text-red-600" size={20} />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{event.reason}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span
                className={`font-bold ${
                  event.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {event.amount > 0 ? '+' : ''}{event.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
