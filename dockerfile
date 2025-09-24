# Use official Node.js LTS image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

# Build Next.js app
RUN npm run build


# ---- Production image ----
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

COPY .env ./.env

# Expose Next.js default port
EXPOSE 3000

# Run the Next.js app
CMD ["npm", "run", "start"]
