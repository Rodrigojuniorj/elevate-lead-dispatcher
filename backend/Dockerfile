FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

ENV YARN_NODE_LINKER=node-modules

COPY package.json yarn.lock ./
RUN yarn install --immutable

COPY prisma ./prisma
RUN yarn prisma:generate

CMD ["sh", "-c", "yarn prisma migrate deploy && yarn prisma:seed:if-empty"]
