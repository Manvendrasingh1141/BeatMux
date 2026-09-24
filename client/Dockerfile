FROM node:24-alpine as builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# We can serve it through Nginx
FROM nginx:stable-alpine
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose 80 inside the container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
