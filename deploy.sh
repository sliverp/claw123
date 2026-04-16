#!/bin/bash
set -e

# ========== 配置 ==========
APP_NAME="claw123"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3017
NODE_ENV="production"
# ==========================

cd "$APP_DIR"

echo "=============================="
echo " Deploying $APP_NAME"
echo " Dir: $APP_DIR"
echo "=============================="

# 1. 拉取最新代码
echo "[1/5] Pulling latest code..."
git checkout  . && git pull --rebase origin main || git pull --rebase origin master || echo "Git pull skipped (no remote or not a git repo)"

# 2. 安装依赖
echo "[2/5] Installing dependencies..."
npm install --production=false

# 3. 构建项目
echo "[3/5] Building..."
npm run build

# 4. 停止旧进程
echo "[4/5] Stopping old process..."
pm2 stop "$APP_NAME" 2>/dev/null || true
pm2 delete "$APP_NAME" 2>/dev/null || true

# 5. PM2 启动新进程
echo "[5/5] Starting with PM2..."
PORT=$PORT pm2 start npm --name "$APP_NAME" -- start -- --port "$PORT"

pm2 save

echo ""
echo "=============================="
echo " Deploy complete!"
echo " App:  $APP_NAME"
echo " Port: $PORT"
echo " Logs: pm2 logs $APP_NAME"
echo "=============================="
