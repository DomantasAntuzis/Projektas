FROM node:18-alpine
WORKDIR /server
COPY package*.json ./
COPY package-lock.json ./
COPY . .
RUN npm install
CMD ["node", "app.mjs"]
EXPOSE 3001