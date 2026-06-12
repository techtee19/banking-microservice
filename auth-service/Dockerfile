FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Copy pnpm-lock if it exists
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Remove .env from container (use docker-compose environment instead)
RUN rm -f .env

EXPOSE 3001

CMD ["node", "server.js"]