FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./

RUN npm install --prefer-offline --no-audit

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package.json package-lock.json* yarn.lock* ./

RUN npm install --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force

COPY --from=builder /app/.next ./.next

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
