FROM node:22-alpine
WORKDIR /app
COPY package.json README.md ./
COPY server ./server
COPY src ./src
COPY vendor ./vendor
COPY 얼음땡.html ./얼음땡.html
ENV PORT=8767
EXPOSE 8767
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]
USER node
CMD ["node", "server/game-server.cjs"]
