import { Instagram, Youtube, Facebook, Twitter, MessageCircle } from 'lucide-react';

// TODO: заменить на реальные ссылки бренда
const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    url: 'https://instagram.com/yourbrand',
    icon: Instagram,
    color: 'bg-pink-500',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@yourbrand',
    icon: Youtube,
    color: 'bg-red-500',
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/yourbrand',
    icon: Facebook,
    color: 'bg-blue-600',
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/yourbrand',
    icon: Twitter,
    color: 'bg-sky-500',
  },
  {
    name: 'Telegram',
    url: 'https://t.me/yourbrand',
    icon: MessageCircle,
    color: 'bg-blue-500',
  },
];

export default function Social() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold mb-2">Мы в соцсетях</h1>
        <p className="text-sm opacity-90">
          Подписывайтесь, чтобы не пропустить новости и акции
        </p>
      </div>

      <div className="px-4 space-y-3">
        {SOCIAL_LINKS.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`${social.color} p-3 rounded-xl`}>
                  <Icon className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{social.name}</h3>
                  <p className="text-sm text-gray-500">{social.url}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="px-4 py-8 text-center text-gray-500 text-sm">
        <p>TODO: заменить ссылки на реальные аккаунты бренда</p>
      </div>
    </div>
  );
}
