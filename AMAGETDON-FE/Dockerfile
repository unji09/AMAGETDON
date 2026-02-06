FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

# 빌드 시점에 환경변수 주입
ARG VITE_KAKAO_JS_KEY
ENV VITE_KAKAO_JS_KEY=$VITE_KAKAO_JS_KEY

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html