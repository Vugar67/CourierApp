# CourierApp

Международная курьерская платформа — управление посылками, складами и доставкой.

## Стек

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL)

## Запуск

1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Создайте `.env.local` по образцу `.env.example`
4. Запустите: `npm run dev`

## Деплой на Vercel

1. Подключите репозиторий на vercel.com
2. Добавьте переменные окружения из `.env.example`
3. Deploy

## Структура

```
app/
  auth/         — страницы входа и регистрации
  dashboard/    — личный кабинет клиента
components/
  layout/       — сайдбар, хедер
  ui/           — переиспользуемые компоненты
lib/
  supabase/     — клиент, сервер, middleware
  types.ts      — TypeScript типы
  utils.ts      — утилиты
```
