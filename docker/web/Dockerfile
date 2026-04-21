FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Install deps layer — relies on package.json + pnpm-lock.yaml being bind-mounted
# at build time via build context. Dev image only.
COPY web/package.json web/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

EXPOSE 3000

ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "dev"]
