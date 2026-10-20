# -------------------------
# 构建阶段：装依赖 + 编译 Vite 应用
# 合并 deps/builder 两步，避免 COPY --from=deps 跨阶段时
# .bin 软链丢失导致 tsc/vite 等 CLI 找不到的问题。
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 lockfile 和 .npmrc，让依赖层在源码改动时仍能命中缓存。
# .npmrc 指定 registry 镜像和重试策略，避免 npm ci 在 CI 环境因网络问题静默失败。
COPY package.json package-lock.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

COPY . .

# Vite 的环境变量必须以 VITE_ 开头，构建期注入到浏览器端代码。
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# -------------------------
# 运行阶段：纯静态文件，用 nginx 直接服务
# -------------------------
FROM nginx:alpine AS runner

# SPA fallback 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite 默认产物目录是 dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
