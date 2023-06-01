# Copied from: https://dev.to/guha/dockerize-a-react-app-and-deploy-it-on-an-aws-ec2-instance-2knm
# Edited based on: https://pnpm.io/cli/fetch

# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app

RUN apk --no-cache add curl

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY ./ /app

RUN pnpm fetch  

RUN pnpm install --offline
RUN pnpm build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
