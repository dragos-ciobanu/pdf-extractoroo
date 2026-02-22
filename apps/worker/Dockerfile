FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV CI=true

FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "start:dev"]

FROM base AS prod
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["node", "dist/main.js"]