import { Sparkles } from 'lucide-react';

// TODO: заменить на реальный контент бренда
const CONTENT_ITEMS = [
  {
    id: 1,
    title: 'Новая коллекция весна 2024',
    description: 'Встречайте нашу весеннюю коллекцию с яркими цветами и свежими дизайнами',
    image: 'https://via.placeholder.com/400x300?text=Spring+Collection',
    link: '#',
  },
  {
    id: 2,
    title: 'Советы по уходу за продукцией',
    description: 'Как правильно ухаживать за нашими товарами, чтобы они служили дольше',
    image: 'https://via.placeholder.com/400x300?text=Care+Tips',
    link: '#',
  },
  {
    id: 3,
    title: 'История бренда',
    description: 'Узнайте, как начиналась наша история и какие ценности мы несём',
    image: 'https://via.placeholder.com/400x300?text=Our+Story',
    link: '#',
  },
  {
    id: 4,
    title: 'Эксклюзивное интервью',
    description: 'Наш основатель рассказывает о планах на будущее и новых проектах',
    image: 'https://via.placeholder.com/400x300?text=Interview',
    link: '#',
  },
];

export default function Content() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={28} />
          <h1 className="text-2xl font-bold">Контент бренда</h1>
        </div>
        <p className="text-sm opacity-90">
          Новости, статьи и эксклюзивные материалы
        </p>
      </div>

      <div className="px-4 space-y-4">
        {CONTENT_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.link}
            className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="px-4 py-8 text-center text-gray-500 text-sm">
        <p>TODO: подключить реальный контент из CMS или API</p>
      </div>
    </div>
  );
}
