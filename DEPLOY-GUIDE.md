# 子域名部署新前端项目 · 全流程速查手册

> 场景：已有一台 AWS Lightsail 服务器，主域 `groundedglow.cc` 已通过 Cloudflare + Nginx + Let's Encrypt + Docker + GitHub Actions + ECR 跑起来。现在要新加一个子域名（如 `attention.groundedglow.cc`）指向一个**全新的前端项目**，不影响原有服务。
>
> 本文为本次部署 `know-your-attention` 的全过程复盘，下一个项目按此模板替换名字即可。

---

## 0. 整体架构（先建立心智模型）

```
浏览器 ───HTTPS───► Cloudflare ───►  Lightsail 服务器
                  (DNS + CDN)        │
                                     ├─ 宿主机 Nginx (443/80)
                                     │    ├─ groundedglow.cc          → 127.0.0.1:3000 → light-blog-fe 容器
                                     │    ├─ groundedglow.cc/api/     → 127.0.0.1:8081 → light-blog-api 容器
                                     │    └─ attention.groundedglow.cc → 127.0.0.1:8090 → attention-fe  容器  ← 新增
                                     │
                                     ├─ Docker 容器
                                     │    ├─ /home/ubuntu/light-blog/docker-compose.yml          (原有)
                                     │    └─ /home/ubuntu/know-your-attention/docker-compose.yml (新增)
                                     │
                                     └─ Certbot 自动续期证书 /etc/letsencrypt/live/...

GitHub 仓库 ───push main───► GitHub Actions
                              ├─ 1. docker build
                              ├─ 2. docker push → AWS ECR
                              └─ 3. SSH 到服务器 → docker compose pull + up
```

**4 个角色各自的职责（理解了下面才不会乱）：**

| 角色 | 负责什么 |
|---|---|
| **Cloudflare** | DNS 解析（把 `attention.xxx.cc` 解到服务器 IP）+ 可选 CDN |
| **宿主机 Nginx** | HTTPS 终止 + 按 `Host` 头分发到不同容器端口 |
| **Docker 容器（内层 Nginx）** | 服务静态文件 + SPA fallback |
| **GitHub Actions + ECR** | CI/CD：构建镜像、推到镜像仓库、远程触发服务器拉新镜像 |

> 关键认知：**宿主机 Nginx 才是"网关"**，所有外部请求都先经过它，再根据子域名转给某个容器端口。容器之间互不知道彼此存在。

---

## 1. 项目隔离策略

| 资源 | 命名规则 | 本次值 | 下个项目套用 |
|---|---|---|---|
| 子域名 | `<项目>.groundedglow.cc` | `attention.groundedglow.cc` | `xxx.groundedglow.cc` |
| 宿主机端口 | 从 8090 递增 | `8090` | `8091` `8092` ... |
| ECR 仓库 | `<项目>/<项目>-fe` | `know-your-attention/know-your-attention-fe` | 同 |
| 服务器部署目录 | `/home/ubuntu/<项目>` | `/home/ubuntu/know-your-attention` | 同 |
| Nginx vhost 文件 | `/etc/nginx/sites-available/<子域名>` | `/etc/nginx/sites-available/attention.groundedglow.cc` | 同 |
| 容器名 | `<项目>-fe` | `know-your-attention-fe` | 同 |

**核心原则：每个项目一个独立目录 + 独立 docker-compose.yml**。不要把多个项目的 service 混到同一份 compose 文件里，否则越加越乱。

---

## 2. 全流程步骤

### Step 1 · Cloudflare 加 DNS 记录

| 操作 | 值 |
|---|---|
| Type | `A` |
| Name | `attention`（不要写完整域名） |
| IPv4 | Lightsail 公网 IP |
| Proxy status | **先设为 DNS only（灰云）** ← 关键 |
| TTL | Auto |

**踩坑点**：如果一开始就开橙云代理，certbot 申请证书时 HTTP-01 校验可能失败。**先灰云签证书 → 切橙云**。

**验证**：`dig +short attention.groundedglow.cc` 应返回服务器 IP。

---

### Step 2 · 本地项目添加 4 个文件

在项目根目录新增：

#### 2.1 `Dockerfile`

三段式（deps / builder / runner），runtime 用 `nginx:alpine` 服务静态文件。

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> **Vite vs Next.js 注意**：Next.js 用 `output:'standalone'` 出 `server.js`，runtime 必须 Node；Vite 出纯静态 `dist/`，用 nginx 更小更快。**runtime 不能照搬**。

#### 2.2 `nginx.conf`（容器内）

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }   # SPA fallback
  location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

> 这是**容器内**的 nginx，和宿主机 nginx 是两层。SPA fallback 必须在这一层做，否则刷新 `/tasks` 等前端路由会 404。

#### 2.3 `.dockerignore`

```
node_modules
dist
.git
.github
*.log
.DS_Store
```

#### 2.4 `.github/workflows/deploy.yml`

两个 job：`build-push`（构建镜像推 ECR）→ `deploy`（SSH 触发服务器 `docker compose pull + up`）。

完整内容见仓库内同名文件。关键变量：

```yaml
env:
  AWS_REGION: ap-northeast-2
  ECR_REGISTRY: 115908659860.dkr.ecr.ap-northeast-2.amazonaws.com
  ECR_REPOSITORY: know-your-attention/know-your-attention-fe
  IMAGE_TAG: latest
```

---

### Step 3 · GitHub Secrets 配置

`Settings → Secrets and variables → Actions → Repository secrets`，**6 个**：

| Secret | 说明 |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key（长度 20） |
| `AWS_SECRET_ACCESS_KEY` | 对应 secret（长度 40，只显示一次） |
| `LIGHTSAIL_HOST` | 服务器 IP |
| `LIGHTSAIL_USER` | `ubuntu` |
| `LIGHTSAIL_SSH_KEY` | SSH 私钥**全文**（含 BEGIN/END） |
| `DEPLOY_DIR` | `/home/ubuntu/know-your-attention` |

**踩坑点：AWS Secret Key 不可回查**。AWS 控制台只在创建那一刻显示一次，之后任何地方都查不到。如果丢了 → IAM 里新建一对（一个 user 允许 2 个 active key，不影响旧的）。

**踩坑点：Credentials could not be loaded** → Secret 名字写错、设到了 Environment secrets / Variables、或私有仓库没继承 org secret。调试加一步打印长度（值会自动打码）：

```yaml
- name: Debug
  run: echo "len=${#AWS_ACCESS_KEY_ID}"
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
```

---

### Step 4 · AWS ECR 创建镜像仓库

控制台 → ECR → Create repository：

- Visibility: **Private**
- Repository name: `know-your-attention/know-your-attention-fe`（必须和 workflow 里的 `ECR_REPOSITORY` 完全一致）

**踩坑点：IAM 权限**。如果 IAM user 挂的是 managed policy `AmazonEC2ContainerRegistryFullAccess`，新仓库自动覆盖。如果是自定义 policy 且 `Resource` 写死了旧仓库 ARN，需要扩权。

---

### Step 5 · 服务器准备部署目录

SSH 到服务器：

```bash
sudo mkdir -p /home/ubuntu/know-your-attention
sudo chown ubuntu:ubuntu /home/ubuntu/know-your-attention
cd /home/ubuntu/know-your-attention

cat > docker-compose.yml <<'EOF'
name: know-your-attention
services:
  attention-fe:
    image: ${ECR_REGISTRY}/know-your-attention/know-your-attention-fe:latest
    container_name: know-your-attention-fe
    restart: unless-stopped
    ports:
      - "8090:80"
EOF

cat > .env <<'EOF'
ECR_REGISTRY=115908659860.dkr.ecr.ap-northeast-2.amazonaws.com
EOF
```

---

### Step 6 · 服务器加 Nginx vhost + 申请证书

这一步**两件事**：

1. 告诉宿主机 Nginx："看到 `attention.groundedglow.cc` 的请求，转给本机 8090 端口"
2. 用 certbot 申请 Let's Encrypt 证书让该域名可走 HTTPS（Cloudflare 是 Full strict，必须有源站证书）

**为什么不直接改主 nginx.conf？** Ubuntu 的 Nginx 默认 `include /etc/nginx/sites-enabled/*`，每个站点一个文件是官方约定：加项目=新文件、下线项目=删软链，零风险互不影响，certbot 也是按 vhost 文件定位续期。

**手工三步（最稳）**：

```bash
# 1. 写 vhost
sudo tee /etc/nginx/sites-available/attention.groundedglow.cc > /dev/null <<'EOF'
server {
    listen 80;
    server_name attention.groundedglow.cc;
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. 启用 + reload
sudo ln -sf /etc/nginx/sites-available/attention.groundedglow.cc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. 签证书（改成你邮箱）
sudo certbot --nginx -d attention.groundedglow.cc \
  --non-interactive --agree-tos --redirect \
  -m 你的邮箱@example.com
```

certbot 会自动把上面的 vhost 改写为带 `listen 443 ssl` + 证书路径 + 80→443 redirect 的完整版本，并配置自动续期（systemd timer）。

**踩坑点：heredoc 在脚本文件中失效**（`warning: here-document delimited by end-of-file`）。常见原因：
- 结束符前后有空格
- nano 保存时混入 CRLF（`cat -A file | grep -n EOF` 看到 `^M`）
- 解决：用 `dos2unix file` 转换；或干脆**不写脚本文件、直接命令行粘 heredoc**（交互式 shell 不会有解析问题）。

---

### Step 7 · 推代码触发部署

```bash
git add Dockerfile nginx.conf .dockerignore .github/
git commit -m "chore: add docker build & deploy workflow"
git push origin main
```

去 GitHub → Actions 看 workflow 跑完。

---

### Step 8 · 验证

```bash
# 服务器
cd /home/ubuntu/know-your-attention
sudo docker compose ps                              # 看到 attention-fe Up
sudo docker compose logs attention-fe --tail 30

# 浏览器
# https://attention.groundedglow.cc  → 看到新项目
# https://groundedglow.cc/           → 原项目仍正常
```

证书拿到后，回 Cloudflare 把 `attention` A 记录从灰云切回橙云（与主域保持一致）。

---

## 3. 下次部署新项目的极简清单

> 把所有 `attention` / `know-your-attention` / `8090` 全部替换成新项目的值。

- [ ] **Cloudflare**：A 记录 `<新项目>` → 服务器 IP（灰云）
- [ ] **项目根目录**：加 `Dockerfile` / `nginx.conf` / `.dockerignore` / `.github/workflows/deploy.yml`（只改 `ECR_REPOSITORY` 和镜像名）
- [ ] **GitHub Secrets**：只需新增 `DEPLOY_DIR=/home/ubuntu/<新项目>`（其他 5 个 Secret 可复用）
- [ ] **AWS ECR**：建仓库 `<新项目>/<新项目>-fe`
- [ ] **服务器**：`mkdir /home/ubuntu/<新项目>` + 放 `docker-compose.yml` + `.env`（端口排到 8091/8092…）
- [ ] **服务器**：写 vhost + `certbot --nginx -d <新子域名>`
- [ ] **本地**：`git push` 触发 Actions
- [ ] **验证**：浏览器访问新子域名 + `docker compose ps` 看容器状态
- [ ] **Cloudflare**：A 记录切回橙云

---

## 4. 常用排错命令

```bash
# 容器层
sudo docker compose ps                              # 看服务状态
sudo docker compose logs <service> --tail 50 -f     # 实时日志
sudo docker compose pull && sudo docker compose up -d   # 手动拉新镜像重启

# 宿主机 Nginx
sudo nginx -t                                       # 测语法
sudo systemctl reload nginx                         # 热加载
sudo tail -f /var/log/nginx/error.log               # 错误日志
ls -la /etc/nginx/sites-enabled/                    # 看启用的 vhost

# 证书
sudo certbot certificates                           # 列出所有证书 + 到期日
sudo certbot renew --dry-run                        # 测试续期
sudo systemctl list-timers | grep certbot           # 续期定时任务

# AWS / ECR
aws ecr describe-repositories --region ap-northeast-2
aws ecr get-login-password --region ap-northeast-2 | sudo docker login --username AWS --password-stdin 115908659860.dkr.ecr.ap-northeast-2.amazonaws.com

# 网络
dig +short <域名>                                   # DNS 解析
curl -I https://<域名>                              # HTTPS 探测
curl -sI -H "Host: <域名>" http://127.0.0.1/        # 绕过 DNS 直测宿主机 nginx
```

---

## 5. 关键文件位置总结

| 文件 | 位置 | 改了之后要做什么 |
|---|---|---|
| 项目 `Dockerfile` | 项目根 | git push 触发重新构建 |
| 项目内层 `nginx.conf` | 项目根 | git push 触发重新构建 |
| 项目 GitHub workflow | `.github/workflows/deploy.yml` | git push 自动生效 |
| 部署目录 `docker-compose.yml` | `/home/ubuntu/<项目>/` | `docker compose up -d` |
| 部署目录 `.env` | `/home/ubuntu/<项目>/` | `docker compose up -d` |
| 宿主机 vhost | `/etc/nginx/sites-available/<子域名>` | `nginx -t && systemctl reload nginx` |
| 证书 | `/etc/letsencrypt/live/<子域名>/` | certbot 自动续期 |

---

**至此完成。这套架构可无限水平扩展子域名项目，互不影响。**
