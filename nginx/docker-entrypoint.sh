#!/bin/sh
set -e

# 환경 변수 기본값 설정
SERVER_DOMAIN=${SERVER_DOMAIN:-localhost}
USE_SELF_SIGNED=${USE_SELF_SIGNED:-true}

# nginx.conf에서 SERVER_DOMAIN 치환
sed -i "s/SERVER_DOMAIN/${SERVER_DOMAIN}/g" /etc/nginx/nginx.conf

# SSL 인증서 디렉토리 생성
mkdir -p /etc/letsencrypt/live/${SERVER_DOMAIN}

# 인증서 확인 및 생성
if [ ! -f "/etc/letsencrypt/live/${SERVER_DOMAIN}/fullchain.pem" ]; then
    if [ "$USE_SELF_SIGNED" = "true" ]; then
        echo "Generating self-signed certificate for ${SERVER_DOMAIN}..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/letsencrypt/live/${SERVER_DOMAIN}/privkey.pem \
            -out /etc/letsencrypt/live/${SERVER_DOMAIN}/fullchain.pem \
            -subj "/CN=${SERVER_DOMAIN}" 2>/dev/null
        echo "Self-signed certificate generated successfully."
    else
        echo "ERROR: SSL certificate not found and USE_SELF_SIGNED is false."
        echo "Please mount Let's Encrypt certificates to /etc/letsencrypt"
        exit 1
    fi
else
    echo "Using existing SSL certificate for ${SERVER_DOMAIN}"
fi

# Certbot 디렉토리 생성
mkdir -p /var/www/certbot

echo "Starting nginx with domain: ${SERVER_DOMAIN}"

# nginx 실행
exec nginx -g "daemon off;"
