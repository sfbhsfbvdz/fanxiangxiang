#!/bin/bash
# 饭饭香 ECS 全自动初始化脚本（只需运行一次）
# 用法：bash full-setup.sh <GitHub仓库地址>
# 示例：bash full-setup.sh https://github.com/youruser/fanfou.git
set -e

REPO_URL="${1:-}"
APP_DIR="/opt/fanxiangxiang"
DB_NAME="fanfou"
DB_USER="fanfou"
DB_PASSWORD="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"

# 自动获取公网 IP（阿里云 ECS 元数据接口）
SERVER_IP=$(curl -s --connect-timeout 5 http://100.100.100.200/latest/meta-data/eipv4 2>/dev/null \
  || curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null \
  || hostname -I | awk '{print $1}')

if [ -z "$REPO_URL" ]; then
  echo "❌ 缺少 GitHub 仓库地址"
  echo "用法：bash full-setup.sh https://github.com/你的用户名/fanfou.git"
  exit 1
fi

echo "╔══════════════════════════════════════════╗"
echo "║     饭饭香 ECS 自动初始化开始            ║"
echo "╚══════════════════════════════════════════╝"
echo "  服务器 IP : $SERVER_IP"
echo "  代码仓库  : $REPO_URL"
echo ""

echo "=== [1/8] 安装系统依赖 ==="
apt-get update -y
apt-get install -y git curl openssl nginx mysql-server

echo "=== [2/8] 安装 Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

echo "=== [3/8] 配置 MySQL ==="
systemctl enable mysql && systemctl start mysql
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "✅ MySQL 配置完成"

echo "=== [4/8] 安装 PM2 ==="
npm install -g pm2 tsx --registry=https://registry.npmmirror.com

echo "=== [5/8] 克隆代码仓库 ==="
rm -rf "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"

echo "=== [6/8] 写入后端环境变量 ==="
cat > "$APP_DIR/server/.env" <<ENV
PORT=4000
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
CORS_ORIGIN=http://${SERVER_IP}
ENV

echo "=== [7/8] 安装依赖 / 构建前端 / 启动后端 ==="
cd "$APP_DIR"
npm install --registry=https://registry.npmmirror.com

# 构建前端（VITE_API_URL 为空 = 同域 Nginx 转发，不需要填 IP）
npm run build --workspace=client
mkdir -p /var/www/fanxiangxiang
cp -r "$APP_DIR/client/dist/." /var/www/fanxiangxiang/

# 启动后端
cd "$APP_DIR/server"
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo "=== [8/8] 配置 Nginx ==="
cat > /etc/nginx/sites-available/fanxiangxiang <<NGINX
server {
    listen 80;
    server_name ${SERVER_IP} _;

    root /var/www/fanxiangxiang;
    index index.html;

    # API 反向代理到 Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # SPA 路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/fanxiangxiang /etc/nginx/sites-enabled/fanxiangxiang
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 生成 GitHub Actions 部署密钥 ==="
ssh-keygen -t ed25519 -C "github-actions@fanxiangxiang" -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 打印结果
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ 初始化完成！                         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "🌐 立即访问：http://${SERVER_IP}"
echo ""
echo "━━━━━ 配置 GitHub Actions 自动部署（只需做一次） ━━━━━"
echo ""
echo "打开 GitHub 仓库 → Settings → Secrets and variables → Actions"
echo "添加以下 3 个 Repository Secret："
echo ""
echo "  名称: DEPLOY_HOST     值: ${SERVER_IP}"
echo "  名称: DEPLOY_USER     值: root"
echo "  名称: DEPLOY_SSH_KEY  值: 复制下方私钥（含 BEGIN/END 行）"
echo ""
echo "┌──────────── SSH 私钥（完整复制） ────────────┐"
cat /root/.ssh/github_deploy
echo "└──────────────────────────────────────────────┘"
echo ""
echo "配置完成后，每次 git push main 即可自动部署 🚀"
