FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN rm -f .env
EXPOSE 3008
CMD ["node", "server.js"]