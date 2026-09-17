import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Users, ShoppingBag, Sparkles } from 'lucide-react';
import { client } from '../api/client';

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await client.getMe();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!userData) {
    return <div className="p-4">Ошибка загрузки данных</div>;
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
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Привет, {userData.name}!</h1>
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors[userData.loyalty_tier as keyof typeof tierColors]} text-white`}>
            {tierLabels[userData.loyalty_tier as keyof typeof tierLabels]}
          </span>
          <span className="text-sm opacity-90">Кэшбэк {userData.cashback_percent}%</span>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-sm opacity-90 mb-1">Баланс бонусов</div>
          <div className="text-4xl font-bold">{userData.bonus_balance}</div>
        </div>
        
        {userData.tier_progress && userData.tier_progress.next_tier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>До уровня {tierLabels[userData.tier_progress.next_tier as keyof typeof tierLabels]}</span>
              <span>{userData.tier_progress.progress_percent}%</span>
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

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/catalog"
            className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
          >
            <ShoppingBag className="text-brand-accent" size={32} />
            <span className="text-sm font-medium">Каталог</span>
          </Link>

          <Link
            to="/bonuses"
            className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
          >
            <Gift className="text-brand-accent" size={32} />
            <span className="text-sm font-medium">Мои бонусы</span>
          </Link>

          <Link
            to="/referral"
            className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
          >
            <Users className="text-brand-accent" size={32} />
            <span className="text-sm font-medium">Пригласить друзей</span>
          </Link>

          <Link
            to="/content"
            className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
          >
            <Sparkles className="text-brand-accent" size={32} />
            <span className="text-sm font-medium">Контент</span>
          </Link>
        </div>

        {/* TODO: Баннер акции */}
        <div className="bg-gradient-to-r from-brand-accent to-orange-500 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold mb-2">Специальное предложение!</h3>
          <p className="text-sm opacity-90">
            Закажите сейчас и получите двойной кэшбэк на первую покупку
          </p>
        </div>
      </div>
    </div>
  );
}
