# syntax=docker/dockerfile:1

FROM node:24-alpine

# tzdata so the TZ env var from compose works on alpine
RUN apk add --no-cache tzdata

WORKDIR /app

# pnpm version matches devEngines.packageManager in package.json
RUN npm install -g pnpm@11.22.0

# Install dependencies first for better layer caching
# --prod: runtime only needs tsx (typescript/@types/node stay out of the image)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# App source
# secrets/ is deliberately NOT baked into the image — mount it at runtime:
#   docker run -v ./secrets:/app/secrets:ro vsllm-autoclaim
COPY tsconfig.json ./
COPY src ./src

USER node

CMD ["pnpm", "start"]
