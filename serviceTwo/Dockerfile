FROM node:18.17.0-alpine

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 5000

CMD [ "node", "app-two.js" ]