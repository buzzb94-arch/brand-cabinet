import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, FileText, Gift, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Главная' },
    { path: '/catalog', icon: ShoppingBag, label: 'Каталог' },
    { path: '/orders', icon: FileText, label: 'Заявки' },
    { path: '/bonuses', icon: Gift, label: 'Бонусы' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-brand-accent' : 'text-gray-500'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
