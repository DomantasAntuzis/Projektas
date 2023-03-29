FROM node:18-alpine
WORKDIR /client
COPY package.json ./
COPY package-lock.json ./
COPY . .
RUN npm install
CMD ["npm", "start"]
EXPOSE 3000