FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_DISABLE_FIREBASE
ARG VITE_FORCE_MAINTENANCE
ARG VITE_BACKEND_URL
ENV VITE_DISABLE_FIREBASE=${VITE_DISABLE_FIREBASE}
ENV VITE_FORCE_MAINTENANCE=${VITE_FORCE_MAINTENANCE}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
