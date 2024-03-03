FROM node:20.11.0-alpine3.18 AS builder

WORKDIR /app

COPY --chown=node:node . .

RUN rm -f *.env *.env.*

RUN apk --update add postgresql-client

RUN npm install

RUN npx prisma generate && rm -rf ./dist && npm run build

RUN mkdir temp temp/.prisma temp/@prisma temp/prisma && cp -r ./node_modules/.prisma/* ./temp/.prisma/ && cp -r ./node_modules/@prisma/* ./temp/@prisma/ && cp -r  ./node_modules/prisma/* ./temp/prisma/

RUN rm -rf node_modules

RUN npm install --omit=dev

RUN cp -r ./temp/* ./node_modules/ && rm -rf temp

RUN ls | grep -v node_modules | grep -v dist | grep -v my-initdb | xargs rm -rfv

RUN cp -r ./dist/* ./ && cp -r ./my-initdb/* ./ && rm -rf dist && rm -rf my-initdb

USER node

ENV APP_ENV=production

CMD ["node", "./main.js"]