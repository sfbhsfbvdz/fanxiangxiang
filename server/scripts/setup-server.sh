#!/bin/bash
# 饭饭香 ECS 一键初始化脚本
# 在全新 Ubuntu 22.04 ECS 上运行：bash setup-server.sh
set -e

echo "=== 1. 安装 Node.js 20 (nvm) ==="
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
node -v && npm -v

echo "=== 2. 安装 MySQL 8.0 ==="
apt-get update -y
apt-get install -y mysql-server

systemctl enable mysql
systemctl start mysql

# 读取 DB 配置（也可以在这里硬编码，或从环境变量中获取）
DB_USER="${DB_USER:-fanfou}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"
DB_NAME="${DB_NAME:-fanfou}"

echo "DB_PASSWORD for fanfou user: $DB_PASSWORD"
echo "⚠️  请保存以上密码，稍后填入 server/.env"

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ MySQL 配置完成"

echo "=== 3. 安装 PM2 ==="
npm install -g pm2 tsx
pm2 startup systemd -u "$USER" --hp "$HOME"

echo "=== 4. 安装 Nginx ==="
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

echo "=== 5. 配置 Nginx ==="
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')

cat > /etc/nginx/sites-available/fanfou <<NGINX
server {
    listen 80;
    server_name ${SERVER_IP} _;

    # 前端静态文件
    root /var/www/fanfou;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    # SPA 前端路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/fanfou /etc/nginx/sites-enabled/fanfou
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

mkdir -p /var/www/fanfou
echo "✅ Nginx 配置完成"

echo ""
echo "========================================="
echo "✅ 服务器初始化完成！"
echo ""
echo "下一步："
echo "1. 克隆仓库到 /opt/fanfou："
echo "   git clone <your-repo-url> /opt/fanfou"
echo "2. 创建 /opt/fanfou/server/.env（参考 .env.example）"
echo "   DB_PASSWORD=${DB_PASSWORD}"
echo "3. 安装依赖并启动："
echo "   cd /opt/fanfou/server && npm install && pm2 start ecosystem.config.cjs"
echo "4. 构建前端并部署："
echo "   cd /opt/fanfou && npm run build --workspace=client"
echo "   cp -r client/dist/* /var/www/fanfou/"
echo "========================================="
