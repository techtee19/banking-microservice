# Use official Node.js image
FROM node:22-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the source code
COPY . .

# Expose the service port
EXPOSE 3000

# Start the service
CMD ["node", "server.js"]