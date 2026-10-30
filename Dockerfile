FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY src ./src
COPY server ./server
COPY vendor ./vendor
COPY 얼음땡.html ./얼음땡.html
ENV NODE_ENV=production
ENV PORT=8767
EXPOSE 8767
CMD ["node", "server/game-server.cjs"]
