# Teyvat Index

原神のキャラクター情報をまとめたブラウザアプリです。

**https://hyoira.github.io/genshin-char-browser/**

---

## 機能

### キャラ一覧
全キャラクターをレアリティ・元素・実装バージョン・誕生日で並び替えて表示します。
右クリック（スマホは長押し）でアイコンや全身立ち絵のダウンロード・クリップボードコピーができます。

### 天賦クイズ
元素スキル / 元素爆発のアイコンを見てキャラクターを当てるクイズです。
1ゲーム10問、元素ヒントあり。

### 幻想シアター
各キャラクターが持つ幻想シアターポーズの一覧です。
ポーズあり / なしで絞り込めます。

---

## 開発

```bash
npm install
npm run dev
```

データ生成のみ実行する場合:

```bash
npm run generate-data
```

## 技術スタック

- React 19 + TypeScript + Vite
- [genshin-db](https://github.com/thehectorhua/genshin-db) でキャラクターデータを取得
- GitHub Pages 
