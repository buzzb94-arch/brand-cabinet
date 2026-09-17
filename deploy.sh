#!/usr/bin/env bash
# Скрипт для загрузки проекта на GitHub.
#
# Запускать ЛОКАЛЬНО на своей машине в папке проекта:
#   chmod +x deploy.sh
#   ./deploy.sh https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
#
# Токен НЕ хранится в этом файле — git спросит его при push.
# Вместо пароля используйте Personal Access Token (скоуп repo).

set -e

REPO_URL="$1"

if [ -z "$REPO_URL" ]; then
  echo "Использование: ./deploy.sh https://github.com/ВАШ-ЛОГИН/brand-cabinet.git"
  exit 1
fi

echo "==> Проверяю git..."
git --version

if [ ! -d .git ]; then
  echo "==> Инициализирую репозиторий..."
  git init
fi

git add -A

if git diff --cached --quiet; then
  echo "==> Нет изменений для коммита"
else
  git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
fi

git branch -M main

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "==> Отправляю на GitHub..."
git push -u origin main

echo ""
echo "Готово! Дальше:"
echo "  1. railway.app -> New Project -> Deploy from GitHub repo"
echo "  2. Добавьте PostgreSQL"
echo "  3. Backend-сервис: Root Directory = backend"
echo "  4. Frontend-сервис: Root Directory = frontend"
echo "  5. Переменные окружения — см. README.md"
