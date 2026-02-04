FROM nginx:alpine

# openssl, dos2unix 설치
RUN apk add --no-cache openssl dos2unix

# 스크립트 복사 및 CRLF -> LF 변환
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN dos2unix /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
