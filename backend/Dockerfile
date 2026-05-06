# Stage 1: Build
FROM node:20-alpine AS builder

# Install OpenSSL required by Prisma on Alpine
RUN apk update && apk add --no-cache openssl

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install OpenSSL required by Prisma on Alpine
RUN apk update && apk add --no-cache openssl

# Set working directory
WORKDIR /usr/src/app

# Set environment variable to production
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma client
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /usr/src/app/dist ./dist

# Create a non-root user for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
    && chown -R nodeapp:nodeapp /usr/src/app
USER nodeapp

# Expose the application port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
