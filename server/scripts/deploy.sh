#!/bin/bash
# 饭饭香后续更新部署脚本
# 在 ECS /opt/fanxiangxiang 目录下执行：bash server/scripts/deploy.sh
set -e

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="$REPO_DIR/server"
CLIENT_DIR="$REPO_DIR/client"
STATIC_DIR="/var/www/fanxiangxiang"

echo "=== 拉取最新代码 ==="
cd "$REPO_DIR"
git pull

echo "=== 安装后端依赖 ==="
cd "$SERVER_DIR"
npm install

echo "=== 重启后端服务 ==="
pm2 restart fanfou-server || pm2 start ecosystem.config.cjs

echo "=== 构建前端 ==="
cd "$REPO_DIR"
npm run build --workspace=client

echo "=== 部署前端静态文件 ==="
cp -r "$CLIENT_DIR/dist/." "$STATIC_DIR/"

echo "✅ 部署完成"
pm2 status
