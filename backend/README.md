# Backend – Laravel API

REST API for the Client Project Tracker. See the [root README](../README.md) for setup and the
API reference, and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for design notes.

```bash
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve
php artisan test
```
