FROM node:20.17-alpine3.19 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.10.0

FROM base AS build
WORKDIR /app
# Install Python and build dependencies
RUN apk add --no-cache python3 make g++ 
COPY package.json pnpm-lock.yaml .pnpmfile.cjs ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile
COPY . .
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=16384
RUN pnpm run build

FROM base
COPY --from=build /app /app
WORKDIR /app
EXPOSE 8000
CMD [ "pnpm", "start" ]
