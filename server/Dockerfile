FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY src ./src
COPY db ./db
EXPOSE 3000
CMD ["node", "src/index.js"]
