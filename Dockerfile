# syntax=docker/dockerfile:1

# -------------------------
# 依赖阶段：只装 npm 依赖，最大化利用 layer 缓存
# -------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# 只复制 lockfile 相关文件，源码改动不会让这一层失效。
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

# -------------------------
# 构建阶段：编译 Vite 应用
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 复用 deps 阶段安装好的 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite 的环境变量必须以 VITE_ 开头，构建期注入到浏览器端代码。
# 当前项目暂时没有，先占位；后续如需调用 API 把默认值改成新后端地址。
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# -------------------------
# 运行阶段：纯静态文件，用 nginx 直接服务
# （Next.js 是 Node 服务，要用 node:22-alpine；Vite 是静态产物，nginx 更合适）
# -------------------------
FROM nginx:alpine AS runner

# SPA fallback 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite 默认产物目录是 dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
