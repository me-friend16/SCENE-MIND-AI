FROM php:8.2-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y git unzip libpq-dev libzip-dev zip zlib1g-dev libonig-dev && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_pgsql mbstring bcmath zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . /var/www/html
RUN composer install --no-dev --optimize-autoloader

COPY .env.example .env
RUN php artisan key:generate

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
