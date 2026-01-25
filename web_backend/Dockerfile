#select os/enviroment
FROM node:22-alpine

#choose working directory inside docker
WORKDIR /app

#copy package.json to install npm packages inside docker
#copy source destination
COPY package*.json ./

#Running shell command
RUN npm install
##copy rest of the application
COPY . .

#port exposoure
EXPOSE 5050

#Entry point
CMD ["node","server.js"]