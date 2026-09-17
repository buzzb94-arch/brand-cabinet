import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../api/client';
import { LogOut, Edit2 } from 'lucide-react';

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await client.getMe();
      setUserData(data);
      setFormData({ name: data.name, phone: data.phone || '' });
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.updateMe({
        name: formData.name || undefined,
        phone: formData.phone || undefined,
      });
      await loadData();
      setEditing(false);
    } catch (error: any) {
      alert(error.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
        <h1 className="text-2xl font-bold">Профиль</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          {!editing ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">{userData?.name}</h2>
                  <p className="text-gray-600 text-sm">{userData?.email}</p>
                  {userData?.phone && (
                    <p className="text-gray-600 text-sm">{userData.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 size={20} className="text-brand-accent" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColors[userData?.loyalty_tier as keyof typeof tierColors]} text-white`}>
                  {tierLabels[userData?.loyalty_tier as keyof typeof tierLabels]}
                </span>
                <span className="text-sm text-gray-600">
                  Кэшбэк {userData?.cashback_percent}%
                </span>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({ name: userData?.name, phone: userData?.phone || '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <p className="text-sm text-gray-600 mb-2">
            Дата регистрации: {new Date(userData?.created_at).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl hover:opacity-90"
        >
          <LogOut size={20} />
          Выйти
        </button>
      </div>
    </div>
  );
}
