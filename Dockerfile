FROM node:22-alpine
WORKDIR /app
COPY package.json server.js alerts.js ./
COPY public ./public
ENV DATA_DIR=/data PORT=3000 NODE_ENV=production
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://127.0.0.1:3000/api/ping || exit 1
CMD ["node", "server.js"]
