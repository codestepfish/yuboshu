FROM node:lts-alpine3.15

ENV MYSQL_HOST=mysql
ENV MYSQL_PORT=3306
ENV MYSQL_USERNAME=root
ENV MYSQL_PASSWORD=root
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

WORKDIR /data

COPY . /data

RUN yarn install && yarn build

EXPOSE 80

CMD ["node", "dist/main.js"]

