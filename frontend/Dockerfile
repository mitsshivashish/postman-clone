# --- Stage 1: Build Environment ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency descriptors
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for compiling)
RUN npm ci

# Copy the rest of the source files
COPY . .

# Declare build argument for API URL (baked into the frontend static build)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Compile Next.js build
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and minimum necessary dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose Next.js default port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
