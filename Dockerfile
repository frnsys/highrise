FROM nodesource/wheezy:6.3.1

ADD package.json package.json

RUN npm install 

RUN npm install --only=dev

ADD . .

CMD ["npm", "start"]
