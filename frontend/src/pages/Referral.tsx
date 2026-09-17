import { useEffect, useState } from 'react';
import { client } from '../api/client';
import { Copy, Share2, CheckCircle, Users, Gift } from 'lucide-react';

export default function Referral() {
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await client.getReferralStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (stats) {
      navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTelegram = () => {
    if (stats) {
      const text = encodeURIComponent(
        `Присоединяйся и получи бонусы! ${stats.referral_link}`
      );
      window.open(`https://t.me/share/url?url=${text}`, '_blank');
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  if (!stats) {
    return <div className="p-4">Ошибка загрузки данных</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold mb-2">Пригласи друзей</h1>
        <p className="text-sm opacity-90">
          За каждого друга вы оба получите бонусы после его первого заказа
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <Users className="mx-auto mb-2 text-brand-accent" size={32} />
            <div className="text-2xl font-bold">{stats.total_referrals}</div>
            <div className="text-xs text-gray-600">Приглашено</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
            <div className="text-2xl font-bold">{stats.rewarded_referrals}</div>
            <div className="text-xs text-gray-600">С заказами</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <Gift className="mx-auto mb-2 text-brand-accent" size={32} />
            <div className="text-2xl font-bold">{stats.total_earned}</div>
            <div className="text-xs text-gray-600">Заработано</div>
          </div>
        </div>

        {/* Реферальный код */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-2">Твой реферальный код</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
            <span className="text-2xl font-bold text-brand">{stats.referral_code}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Твоя реферальная ссылка:
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-xs break-all mb-4">
            {stats.referral_link}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl hover:opacity-90"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              {copied ? 'Скопировано!' : 'Скопировать ссылку'}
            </button>
            <button
              onClick={shareToTelegram}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:opacity-90"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Как это работает */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-4">Как это работает</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Поделись своей реферальной ссылкой с друзьями</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Твой друг регистрируется по твоей ссылке и получает приветственные бонусы</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Когда друг делает первый заказ, вы оба получаете дополнительные бонусы</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
