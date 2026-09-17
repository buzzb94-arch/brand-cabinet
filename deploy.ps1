# Запуск деплоя на GitHub из Windows (PowerShell).
#
# Использование:
#   1. Откройте PowerShell в папке проекта
#      (Shift + правый клик по папке -> "Открыть окно PowerShell здесь")
#   2. При необходимости разрешите запуск скриптов:
#        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   3. Запустите:
#        .\deploy.ps1 https://github.com/ВАШ-ЛОГИН/brand-cabinet.git
#
# Токен нигде не хранится — git спросит его при push.
# Вместо пароля нужен Personal Access Token (скоуп repo).

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$RepoUrl
)

$ErrorActionPreference = "Stop"

Write-Host "==> Проверяю git..." -ForegroundColor Cyan
git --version

if (-not (Test-Path ".git")) {
    Write-Host "==> Инициализирую репозиторий..." -ForegroundColor Cyan
    git init

    git config user.email "dev@brand-cabinet.local"
    git config user.name "Brand Cabinet Dev"
}

git add -A

$staged = git diff --cached --stat
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "==> Нет изменений для коммита" -ForegroundColor Yellow
} else {
    git commit -m "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

git branch -M main

$remotes = git remote
if ($remotes -contains "origin") {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

Write-Host "==> Отправляю на GitHub..." -ForegroundColor Cyan
Write-Host "    Если спросит пароль — вставьте Personal Access Token (не пароль от GitHub)" -ForegroundColor DarkGray
git push -u origin main

Write-Host ""
Write-Host "Готово! Дальше:" -ForegroundColor Green
Write-Host "  1. railway.app -> New Project -> Deploy from GitHub repo"
Write-Host "  2. Добавьте PostgreSQL: New -> Database -> Add PostgreSQL"
Write-Host "  3. Backend-сервис:  Settings -> Root Directory = backend"
Write-Host "  4. Frontend-сервис: Settings -> Root Directory = frontend"
Write-Host "  5. Переменные окружения — см. README.md"
