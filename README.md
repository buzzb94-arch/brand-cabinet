# Личный кабинет клиента бренда

Веб-приложение для интернет-магазина с программой лояльности. Клиенты могут оформлять заявки на товары, копить и тратить бонусы, расти по уровням программы лояльности, приглашать друзей за бонусы и оставлять отзывы с фото.

## Структура проекта

```
brand-cabinet/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py          # Главный файл приложения
│   │   ├── models.py        # SQLAlchemy модели
│   │   ├── schemas.py       # Pydantic схемы
│   │   ├── database.py      # Подключение к БД
│   │   ├── auth.py          # Аутентификация и JWT
│   │   ├── loyalty.py       # Логика уровней лояльности
│   │   ├── yandex_sync.py   # Синхронизация с Яндекс.Диском
│   │   └── config.py        # Настройки приложения
│   ├── requirements.txt     # Python зависимости
│   ├── railway.json         # Конфигурация для Railway
│   └── .env.example         # Пример переменных окружения
│
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/           # Страницы приложения
│   │   ├── components/      # React компоненты
│   │   ├── api/             # API клиент
│   │   ├── App.tsx          # Главный компонент
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Node зависимости
│   ├── railway.json         # Конфигурация для Railway
│   └── .env.example         # Пример переменных окружения
│
└── README.md                # Эта документация
```

## Технологии

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL (продакшн) / SQLite (разработка)
- JWT авторизация (python-jose)
- Bcrypt хеширование паролей
- Yandex Disk REST API для синхронизации данных

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Lucide React (иконки)

## Деплой на Railway

### Шаг 1: Подготовка репозитория

1. Создайте новый GitHub репозиторий
2. Залейте весь код проекта в репозиторий.

**Windows (PowerShell)** — самый простой вариант, из папки проекта:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1 https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
```

Или вручную:

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
git push -u origin main
```

Пароль при push — это Personal Access Token, а не пароль от GitHub
(GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic), скоуп `repo`).

**macOS / Linux:**

```bash
cd brand-cabinet
./deploy.sh https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
```

Или вручную:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
git push -u origin main
```

**Важно для Windows:** если путь содержит кириллицу (`C:\Users\Иван\...`), git иногда ломается.
Перенесите папку в `C:\projects\brand-cabinet`.

### Шаг 2: Создание проекта на Railway

1. Зайдите на [railway.app](https://railway.app) и войдите через GitHub
2. Создайте новый проект: **New Project** → **Deploy from GitHub repo**
3. Выберите ваш репозиторий `brand-cabinet`

### Шаг 3: Добавление PostgreSQL

1. В проекте нажмите **New** → **Database** → **Add PostgreSQL**
2. Railway автоматически создаст базу данных и переменную `DATABASE_URL`

### Шаг 4: Настройка Backend сервиса

1. В проекте нажмите **New** → **GitHub Repo** → выберите ваш репозиторий
2. В настройках сервиса:
   - **Root Directory:** `backend`
   - **Start Command:** (Railway сам подхватит из `railway.json`)
3. Добавьте переменные окружения в разделе **Variables**:

```bash
# Database (из PostgreSQL сервиса)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security (генерируйте случайные строки)
SECRET_KEY=your-random-secret-key-here-min-32-chars
ADMIN_KEY=your-random-admin-key-here

# Yandex Disk (получите токен на oauth.yandex.ru)
YANDEX_DISK_TOKEN=your-yandex-disk-oauth-token
```

**Как получить Yandex Disk токен:**
1. Перейдите на https://oauth.yandex.ru/
2. Зарегистрируйте новое приложение
3. Укажите права: "Запись в любом месте на Диске"
4. Получите OAuth токен
5. Скопируйте токен в переменную `YANDEX_DISK_TOKEN`

### Шаг 5: Настройка Frontend сервиса

1. В проекте нажмите **New** → **GitHub Repo** → выберите тот же репозиторий
2. В настройках сервиса:
   - **Root Directory:** `frontend`
   - **Start Command:** (Railway сам подхватит из `railway.json`)
3. Добавьте переменные окружения:

```bash
# API URL (публичный домен backend сервиса)
VITE_API_URL=https://your-backend-service.railway.app
```

**Важно:** После деплоя backend скопируйте его публичный URL (например `https://brand-cabinet-backend-production.up.railway.app`) и вставьте в `VITE_API_URL`

### Шаг 6: Генерация доменов

1. Каждый сервис получит свой домен вида `*.up.railway.app`
2. Backend домен укажите в `VITE_API_URL` фронтенда
3. Frontend домен — это адрес вашего приложения для клиентов
4. Также обновите `referral_link` в backend/app/main.py:286 на реальный домен фронтенда

### Шаг 7: Проверка

1. Откройте URL фронтенда в браузере
2. Зарегистрируйте тестового пользователя
3. Проверьте, что бонусы начислились
4. Для администрирования используйте API с `?admin_key=ваш_ADMIN_KEY`

## Локальная разработка

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Создайте .env из .env.example
cp .env.example .env

# Запустите сервер (будет использовать SQLite локально)
uvicorn app.main:app --reload
```

**Windows (PowerShell) — те же шаги:**

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # если блокирует: Set-ExecutionPolicy -Scope Process Bypass
pip install -r requirements.txt

Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Backend будет доступен на http://localhost:8000

### Frontend

```bash
cd frontend
npm install

# Создайте .env из .env.example
cp .env.example .env
# В .env укажите VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend будет доступен на http://localhost:5173

## Логика программы лояльности

### Уровни лояльности

Определяются по сумме всех завершённых заказов (статус `done`):

- **Бронза:** от 0 ₽ — кэшбэк 5%
- **Серебро:** от 10 000 ₽ — кэшбэк 7%
- **Золото:** от 30 000 ₽ — кэшбэк 10%

Настраиваются в `backend/app/config.py`:

```python
LOYALTY_THRESHOLDS = {
    "bronze": 0,
    "silver": 10000,
    "gold": 30000
}

LOYALTY_CASHBACK = {
    "bronze": 0.05,  # 5%
    "silver": 0.07,  # 7%
    "gold": 0.10     # 10%
}
```

Уровень пересчитывается автоматически при каждом переводе заказа в статус `done`.

### Начисление бонусов

- **Приветственный бонус:** 100 бонусов при регистрации (`WELCOME_BONUS`)
- **Кэшбэк за заказ:** процент от суммы заказа по текущему уровню лояльности
- **Бонус за отзыв с фото:** 30 бонусов (`REVIEW_PHOTO_BONUS`)
- **Реферальный бонус рефереру:** 150 бонусов (`REFERRAL_BONUS_REFERRER`)
- **Реферальный бонус приглашённому:** 100 бонусов (`REFERRAL_BONUS_REFERRED`)

Все константы настраиваются в `backend/app/config.py`.

### Реферальная программа

1. При регистрации каждый клиент получает уникальный реферальный код
2. Новый клиент может зарегистрироваться по реферальному коду
3. Когда приглашённый клиент делает первый заказ (статус `done`):
   - Рефереру начисляется 150 бонусов
   - Приглашённому начисляется 100 бонусов
   - Реферальная связь помечается как `rewarded`

## Административные функции

Все административные эндпоинты требуют параметр `?admin_key=ваш_ADMIN_KEY`:

- `GET /admin/orders?admin_key=...` — список всех заявок
- `PATCH /admin/orders/{id}/status?admin_key=...` — смена статуса заказа
- `POST /admin/products?admin_key=...` — добавление товара
- `PATCH /admin/reviews/{id}/status?admin_key=...` — скрытие отзыва
- `POST /admin/sync-all?admin_key=...` — полная пересинхронизация с Яндекс.Диском

## Синхронизация с Яндекс.Диском

При наличии `YANDEX_DISK_TOKEN` приложение автоматически синхронизирует данные в Excel-файлы:

- `/brand-cabinet/orders.xlsx` — все заявки
- `/brand-cabinet/bonuses.xlsx` — все бонусные события
- `/brand-cabinet/referrals.xlsx` — все реферальные связи
- `/brand-cabinet/reviews/` — фото отзывов

Синхронизация происходит автоматически при создании/изменении данных. Для ручной пересинхронизации используйте `/admin/sync-all`.

## Что настроить перед запуском

### TODO в коде (пометки для донастройки)

**Backend:**
- `backend/app/config.py` — пороги уровней лояльности, размеры бонусов
- `backend/app/main.py:286` — реальный домен фронтенда для реферальной ссылки
- CORS настройки — сузить до конкретного домена фронтенда

**Frontend:**
- `frontend/tailwind.config.js` — реальные цвета бренда вместо плейсхолдеров
- `frontend/src/pages/Content.tsx` — реальный контент вместо заглушек
- `frontend/src/pages/Social.tsx` — реальные ссылки на соцсети бренда
- `frontend/src/pages/Dashboard.tsx` — текст баннера акции

## Что дальше (идеи для улучшения)

- **Подписочная модель "коробка месяца":** регулярная доставка товаров по подписке
- **Геймификация:** бейджи и достижения за количество заказов, отзывов, приглашённых друзей
- **Push-уведомления через Telegram-бот:** уведомления о смене статуса заказа, начислении бонусов
- **Мультитенантность:** поддержка нескольких брендов в одном приложении
- **Списание бонусов:** возможность оплатить часть заказа бонусами
- **История изменений уровня лояльности:** трекинг роста клиента
- **Персонализированные рекомендации товаров** на основе истории заказов
- **Интеграция с платёжными системами** для реальной оплаты

## Поддержка

При возникновении проблем:
1. Проверьте переменные окружения на Railway
2. Проверьте логи сервисов в Railway Dashboard
3. Убедитесь, что `DATABASE_URL` правильно прокинут из PostgreSQL в backend
4. Убедитесь, что `VITE_API_URL` фронтенда указывает на публичный URL backend

---

**Создано:** сентябрь 2024  
**Стек:** FastAPI + React + PostgreSQL + Railway
