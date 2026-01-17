# MermGraph

Mermaid記法をリアルタイムでプレビューし、PNG/SVGとしてエクスポートできるデスクトップアプリケーション。

## 技術スタック

- **Desktop**: Tauri v2 (Rust)
- **Frontend**: React + TypeScript + Vite
- **Editor**: Monaco Editor
- **Preview**: mermaid.js
- **Backend**: Hono + Bun + Puppeteer

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)

### インストール

```bash
# フロントエンドの依存関係をインストール
npm install

# バックエンドの依存関係をインストール
cd backend
npm install
cd ..
```

### 開発

```bash
# バックエンドを起動（別ターミナルで）
cd backend
npm run dev

# Tauriアプリを起動
npm run tauri dev
```

### ビルド

```bash
# プロダクションビルド
npm run tauri build
```

## 使い方

1. 左側のエディタでMermaid記法を入力
2. 右側にリアルタイムでダイアグラムがプレビューされます
3. ヘッダーの「SVG」または「PNG」ボタンでエクスポート

## ライセンス

MIT
