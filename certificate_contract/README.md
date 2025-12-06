# SuiGuard NFT Certificate 功能實作進度

## ✅ 已完成

### 1. 智能合約 (certificate.move)

- ✅ 修改合約結構，包含 package_id、risk_level、security_score 等字段
- ✅ 證書有效期設為 30 天
- ✅ 用戶支付 gas fee 鑄造 NFT
- ✅ 編譯成功
- ✅ 部署到 Sui Testnet
- **Package ID:** `0xc5bc1fa69949801087a87b623d08a00109d766323a349737e1344adac8373e4b`

### 2. 後端 API (main.py)

- ✅ 新增 `/api/request-certificate` 端點
- ✅ 接收 package_id 和 wallet_address
- ✅ 分析合約並計算安全分數
- ✅ 返回證書數據供前端使用
- ✅ 後端已啟動在 localhost:8080

### 3. 前端 AuditPage

- ✅ 修改 state 儲存 risk_level 和 security_score
- ✅ 新增「🎖️ 查看 NFT 證書」按鈕
- ✅ 實作 handleViewCertificate 函數開啟新分頁

### 4. 證書頁面檔案

- ✅ 建立 `/pages/certificate/` 資料夾結構
- ✅ 建立 `index.html`
- ✅ 建立 `src/index.tsx` 和 `index.css`
- ✅ 建立 `src/Certificate.tsx` (Wallet Provider 包裝器)
- ✅ 建立 `src/CertificatePage.tsx` (主要 UI 組件)
  - 顯示 package_id
  - 錢包連接 (ConnectButton)
  - 顯示證書數據 (風險等級、安全分數、建議等)
  - 「領取 NFT 證書」按鈕
  - 鑄造成功頁面

## 🚧 需要完成

### 5. 配置 Certificate 頁面的建置

需要在 Extension 項目中配置 certificate 頁面的編譯：

1. **修改 `/extension/pnpm-workspace.yaml`**

   ```yaml
   packages:
     - "chrome-extension"
     - "pages/*" # 已經包含，應該自動包括 certificate
     - "packages/*"
   ```

2. **建立 `/pages/certificate/package.json`**

3. **建立 `/pages/certificate/vite.config.mts`**

   ```typescript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react-swc";
   import { resolve } from "path";
   import { watchRebuildPlugin } from "@extension/hmr";

   const rootDir = resolve(__dirname);
   const outDir = resolve(rootDir, "../../dist/certificate");

   export default defineConfig({
     plugins: [react(), watchRebuildPlugin({ reload: true })],
     resolve: {
       alias: {
         "@src": resolve(rootDir, "src"),
       },
     },
     build: {
       outDir,
       rollupOptions: {
         input: {
           index: resolve(rootDir, "index.html"),
         },
         output: {
           entryFileNames: "assets/[name].js",
           chunkFileNames: "assets/[name].js",
           assetFileNames: "assets/[name].[ext]",
         },
       },
     },
   });
   ```

4. **建立 `/pages/certificate/tsconfig.json`**
   ```json
   {
     "extends": "@extension/tsconfig/react.json",
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@src/*": ["./src/*"]
       }
     },
     "include": ["src", "*.ts", "*.tsx"],
     "exclude": ["node_modules", "dist"]
   }
   ```

### 6. 更新 manifest.ts

在 `/extension/chrome-extension/manifest.ts` 中註冊 certificate.html：

```typescript
web_accessible_resources: [
  {
    resources: ["*.js", "*.css", "*.svg", "*.png", "certificate/*.html", "certificate/**/*.js"],
    matches: ["*://*/*"],
  },
],
```

### 7. 編譯和測試

```bash
cd /home/k66/suiguard/extension
pnpm install  # 安裝新的依賴
pnpm build    # 編譯整個項目，包括 certificate 頁面
```

編譯後應該在 `dist/certificate/` 看到：

- index.html
- assets/index.js
- assets/index.css

### 8. 測試流程

1. 在 Extension 的 Audit 頁面輸入 package_id
2. 點擊 Submit 進行分析
3. 分析完成後，點擊「🎖️ 查看 NFT 證書」按鈕
4. 開啟新分頁顯示證書頁面
5. 點擊 Connect Wallet 連接 Suiet Wallet
6. 查看證書數據（風險等級、安全分數等）
7. 點擊「🎖️ 領取 NFT 證書」按鈕
8. 簽署交易
9. NFT 鑄造成功，可在 Sui Explorer 查看

## 🐛 已知問題

1. **Chrome API 錯誤**: AuditPage.tsx 中 `chrome.tabs.create` 會報錯 - 需要添加 `@types/chrome` 或使用正確的類型
2. **依賴缺失**: certificate 頁面需要安裝 `@mysten/dapp-kit` 和相關依賴

## 💡 下一步行動

1. 按照上述步驟建立 certificate 頁面的配置檔
2. 運行 `pnpm install` 安裝依賴
3. 運行 `pnpm build` 編譯
4. 測試完整流程
5. 修復任何出現的錯誤

## 📦 核心檔案清單

### 智能合約

- `/certificate_contract/sources/certificate.move`
- Package ID: `0xc5bc1fa69949801087a87b623d08a00109d766323a349737e1344adac8373e4b`

### 後端

- `/backend/main.py` - API 端點

### 前端

- `/extension/pages/popup/src/components/pages/AuditPage.tsx` - 審計頁面 + 查看證書按鈕
- `/extension/pages/popup/src/constants.ts` - API URL 和合約配置
- `/extension/pages/certificate/` - 證書領取頁面 (新建)

## 🔑 重要配置

### API URL

```typescript
const API_URL = "http://localhost:8080";
```

### 合約配置

```typescript
const CERTIFICATE_CONTRACT = {
  PACKAGE_ID:
    "0xc5bc1fa69949801087a87b623d08a00109d766323a349737e1344adac8373e4b",
  MODULE: "certificate",
  FUNCTION: "issue_certificate",
};
```

### Clock Object (Sui 系統)

```typescript
const CLOCK_ID = "0x6";
```
