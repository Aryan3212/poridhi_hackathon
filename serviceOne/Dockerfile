FROM node:18.17.0-alpine

WORKDIR /app

COPY package*.json ./

USER node

RUN npm install --force

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "node", "app-one.js" ]
