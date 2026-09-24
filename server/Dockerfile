FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Run as non-root user
USER node

EXPOSE 3000

CMD ["node", "server.js"]
