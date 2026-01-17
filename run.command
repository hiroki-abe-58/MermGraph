#!/bin/bash

# MermGraph - Startup Script
# ダブルクリックで起動できます

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

echo "========================================"
echo "  MermGraph - Mermaid Editor"
echo "========================================"
echo ""

# 依存関係の確認とインストール
if [ ! -d "node_modules" ]; then
    echo "[INFO] フロントエンドの依存関係をインストール中..."
    npm install
    echo ""
fi

if [ ! -d "backend/node_modules" ]; then
    echo "[INFO] バックエンドの依存関係をインストール中..."
    cd backend && npm install && cd ..
    echo ""
fi

# 既存のプロセスを停止
echo "[INFO] 既存のプロセスを確認中..."
lsof -ti:1420 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# バックエンドを起動
echo "[INFO] バックエンドサーバーを起動中 (port 3001)..."
cd backend && npm run start &
BACKEND_PID=$!
cd ..

# 少し待ってからフロントエンドを起動
sleep 2

# フロントエンドを起動
echo "[INFO] フロントエンドサーバーを起動中 (port 1420)..."
npm run dev &
FRONTEND_PID=$!

# 少し待ってからブラウザを開く
sleep 3
echo ""
echo "[SUCCESS] サーバーが起動しました"
echo ""
echo "  Frontend: http://localhost:1420"
echo "  Backend:  http://localhost:3001"
echo ""
echo "[INFO] ブラウザを開いています..."
open http://localhost:1420

echo ""
echo "----------------------------------------"
echo "  終了するには Ctrl+C を押してください"
echo "----------------------------------------"
echo ""

# 終了時にプロセスをクリーンアップ
cleanup() {
    echo ""
    echo "[INFO] サーバーを停止中..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:1420 | xargs kill -9 2>/dev/null
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo "[INFO] 終了しました"
    exit 0
}

trap cleanup SIGINT SIGTERM

# プロセスが終了するまで待機
wait
