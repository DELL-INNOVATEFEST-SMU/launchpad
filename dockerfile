# Use official Node.js LTS image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the necessary built files from the GitHub Action build step
COPY package*.json ./
COPY node_modules ./node_modules
COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]