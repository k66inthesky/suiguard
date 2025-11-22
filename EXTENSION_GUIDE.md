# SuiGuard VS Code Extension 開發指南

## 🎯 專案概述

SuiGuard VS Code 擴展是一個專為 Sui 區塊鏈智能合約安全審計設計的工具，具備以下核心功能：

### 🔐 會員登入系統 (zkLogin 整合)
- **多重 OAuth 支援**: Google、GitHub、Sui Wallet
- **零知識證明**: 使用 Sui 的 zkLogin 技術
- **安全會話管理**: JWT 令牌和狀態持久化

### 🔍 AI 代碼審計功能
- **選中代碼分析**: 選擇任意代碼段進行深度安全分析
- **快速風險檢查**: 即時檢測常見的安全漏洞模式
- **詳細審計報告**: 包含漏洞詳情、風險等級和修復建議
- **本地+雲端分析**: 結合本地規則和後端 AI 分析

## 📁 專案結構

```
/home/k66/suiguard/
├── vscode-extension/           # VS Code 擴展主要代碼
│   ├── src/
│   │   ├── extension.ts        # 擴展入口點
│   │   ├── zklogin/
│   │   │   └── zkLoginProvider.ts  # zkLogin 整合服務
│   │   ├── analyzer/
│   │   │   └── codeAnalyzer.ts     # 代碼分析引擎
│   │   └── views/
│   │       ├── loginViewProvider.ts    # 登入界面提供者
│   │       └── auditViewProvider.ts    # 審計界面提供者
│   ├── out/                    # 編譯輸出
│   ├── package.json           # 擴展配置和依賴
│   └── tsconfig.json          # TypeScript 配置
├── zklogin-integration/        # zkLogin 整合服務
│   ├── src/
│   │   └── zklogin-service.js  # Node.js 服務
│   ├── package.json           # 服務依賴
│   └── README.md              # 服務說明
├── backend/                   # 現有的後端 API
├── .vscode/                   # VS Code 配置
├── start-dev.sh              # 開發環境啟動腳本
└── stop-services.sh          # 服務停止腳本
```

## 🚀 快速開始

### 1. 啟動開發環境

```bash
cd /home/k66/suiguard
./start-dev.sh
```

這將會：
- ✅ 檢查環境依賴 (Node.js, Python3)
- 📦 安裝必要的 npm 依賴
- 🔨 編譯 VS Code 擴展
- 🌐 啟動 zkLogin 整合服務 (port 3000)
- 🔍 檢查後端 API 服務狀態 (port 8080)

### 2. 開啟 VS Code 擴展開發

1. **在 VS Code 中打開專案資料夾**:
   ```bash
   code /home/k66/suiguard
   ```

2. **啟動擴展開發環境**:
   - 按 `F5` 或
   - 使用 `Ctrl+Shift+P` → "Debug: Start Debugging"

3. **在新的 VS Code 視窗中測試**:
   - 新視窗會自動載入 SuiGuard 擴展
   - 左側活動欄會出現 🛡️ SuiGuard 圖示

## 🔧 功能使用指南

### 會員登入功能

1. **啟動登入流程**:
   - 點擊側邊欄的 SuiGuard 圖示
   - 在「會員登入」區域點擊「🔐 會員登入」
   - 選擇登入方式：Google/GitHub/Sui Wallet

2. **完成身份驗證**:
   - 系統會開啟對應的 OAuth 流程
   - 完成驗證後會顯示登入成功訊息
   - 側邊欄會切換到「代碼審計」模式

### 代碼審計功能

#### 方法 1: 右鍵選單審計
1. **選中代碼**:
   - 在編輯器中選中要分析的代碼（例如第 24-28 行）
   - 右鍵開啟上下文選單

2. **選擇審計類型**:
   - 🔍 **AI 審計選中代碼**: 完整的深度分析
   - ⚡ **快速審計**: 快速風險評估

3. **查看結果**:
   - 深度分析會在新面板中顯示詳細報告
   - 快速審計會在通知中顯示結果摘要

#### 方法 2: 快捷鍵審計
- 選中代碼後按 `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`)
- 直接觸發 AI 代碼分析

#### 方法 3: 命令面板
- 按 `Ctrl+Shift+P` 開啟命令面板
- 輸入 \"SuiGuard\" 找到相關命令
- 選擇對應的審計功能

## 🔄 服務整合架構

### 資料流程
```
VS Code 擴展 ←→ zkLogin 服務 (port 3000) ←→ OAuth 提供商
     ↓
後端 API (port 8080) ←→ AI 分析引擎
```

### API 端點

#### zkLogin Integration Service (port 3000)
- `POST /auth/initiate` - 初始化登入流程
- `GET /auth/callback` - OAuth 回調處理
- `POST /auth/verify` - 驗證 zkLogin 令牌
- `GET /user/profile` - 獲取用戶資訊

#### Backend API (port 8080)
- `POST /api/analyze-connection` - AI 代碼分析
- 其他現有的審計端點...

## 🛠️ 開發和自訂

### 新增分析規則

在 `vscode-extension/src/analyzer/codeAnalyzer.ts` 中修改：

```typescript
const customRiskPatterns = [
  /your_custom_pattern/gi,
  // 新增更多模式...
];
```

### 自訂 OAuth 提供商

在 `zklogin-integration/src/zklogin-service.js` 中新增：

```javascript
const authUrls = {
  // 現有提供商...
  'new-provider': 'https://new-provider.com/oauth/authorize?...'
};
```

### 擴展設定選項

使用者可在 VS Code 設定中配置：

```json
{
  \"suiguard.backendUrl\": \"http://localhost:8080\",
  \"suiguard.autoAnalysis\": true,
  \"suiguard.riskThreshold\": \"medium\",
  \"suiguard.zkloginServiceUrl\": \"http://localhost:3000\"
}
```

## 🧪 測試和除錯

### 本地測試

1. **測試 zkLogin 服務**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **測試後端 API**:
   ```bash
   curl -X POST http://localhost:8080/api/analyze-connection \
     -H \"Content-Type: application/json\" \
     -d '{\"code\": \"test code\", \"analysisType\": \"quick\"}'
   ```

3. **測試擴展功能**:
   - 在 VS Code 開發者工具中查看 Console 輸出
   - 使用 `console.log` 進行除錯

### 除錯模式

- **擴展除錯**: F5 啟動後在新視窗中測試
- **服務除錯**: 查看 `zklogin-integration/zklogin.log`
- **API 除錯**: 檢查後端服務的 log 輸出

## 📋 待辦事項和改進

### 高優先級
- [ ] 實作真正的 zkLogin proof 生成
- [ ] 整合真實的 Sui 網路
- [ ] 新增單元測試
- [ ] 改進錯誤處理機制

### 中優先級
- [ ] 支援更多程式語言的語法高亮
- [ ] 新增代碼分析歷史記錄
- [ ] 實作快取機制優化性能
- [ ] 新增設定頁面 UI

### 低優先級
- [ ] 支援暗色/亮色主題切換
- [ ] 新增多語言支援
- [ ] 整合更多 OAuth 提供商
- [ ] 新增分析報告匯出功能

## 🚫 停止服務

執行以下命令停止所有服務：

```bash
cd /home/k66/suiguard
./stop-services.sh
```

或手動停止：
```bash
pkill -f zklogin-service.js
# 手動停止後端服務 (Ctrl+C)
```

## 📞 故障排除

### 常見問題

1. **擴展無法載入**:
   - 檢查 TypeScript 編譯是否成功
   - 確認 `out/` 目錄存在編譯檔案

2. **zkLogin 服務無法啟動**:
   - 檢查 port 3000 是否被佔用
   - 確認 Node.js 依賴已正確安裝

3. **代碼分析失敗**:
   - 確認後端 API 服務運行正常
   - 檢查網路連接和防火牆設定

4. **OAuth 登入失敗**:
   - 檢查 OAuth 應用程式設定
   - 確認 redirect URI 配置正確

### 取得幫助

- 檢查 VS Code 開發者控制台的錯誤訊息
- 查看服務 log 檔案
- 確認所有依賴服務都正常運行

---

🎉 **恭喜！您已成功建立 SuiGuard VS Code 擴展開發環境！**

現在您可以開始開發和測試 zkLogin 整合和 AI 代碼審計功能了。