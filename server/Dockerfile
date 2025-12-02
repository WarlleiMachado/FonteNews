FROM node:20-alpine
WORKDIR /app
# Altere para copiar da raiz para o /app
COPY ../package.json ../package-lock.json* ./
RUN npm install --no-audit --no-fund
# Copia o código real da pasta 'server' para a app
COPY . ./
EXPOSE 3000
CMD ["node", "src/index.js"]
