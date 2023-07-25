FROM node:16
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY . /usr/src/app
RUN yarn
RUN yarn build
# RUN yarn migrate:prod
EXPOSE 80
CMD ["yarn", "prod"]
