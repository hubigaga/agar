FROM node:alpine3.11

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./Server/package*.json /usr/src/app/
RUN npm install

# Bundle app source
COPY ./Server/ /usr/src/app/

COPY ./Client/ /usr/src/Client/


EXPOSE 88 8080 9000

CMD [ "node", "src/index.js" ]