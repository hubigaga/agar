FROM node:alpine3.11 as build

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./Admin/package.json /usr/src/app/package.json
COPY ./Admin/yarn.lock /usr/src/app/yarn.lock

RUN yarn install
COPY ./Admin/ /usr/src/app/
RUN yarn build

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
COPY --from=build /usr/src/app/dist/ /usr/src/Client/admin/


EXPOSE 8080

CMD [ "node", "src/index.js" ]