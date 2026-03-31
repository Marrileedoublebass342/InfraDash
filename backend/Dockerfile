FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma

# Generate Prisma client with explicit binary targets
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
