# Stage 1 - the build process
FROM node:18.13.0 as build-deps
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
CMD ["yarn", "start"]