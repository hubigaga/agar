FROM node:10.19

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./Server/package*.json /usr/src/app/
RUN npm install

# Bundle app source
COPY ./Server/ /usr/src/app/

COPY ./Client /usr/src/Client

RUN ls -l /usr/src/

EXPOSE 8080

CMD [ "node", "src/index.js" ]