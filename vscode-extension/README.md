# SuiGuard VS Code Extension

一個專為 Sui 區塊鏈智能合約安全審計設計的 VS Code 擴展，具備 zkLogin 會員登入和 AI 代碼分析功能。

## 注意
- 這是初版，功能簡陋，僅完成基本vscode extension可見左側擴件。

### 🔐 會員登入系統
- 支援 Sui Wallet zkLogin 整合
- 多種登入方式：Google、GitHub、Sui Wallet
- 安全的身份驗證和會員狀態管理

## 使用方法

### 安裝與配置

1. **安裝擴展**：
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```

2. **啟動後端服務**：
   ```bash
   cd ../backend
   python main.py
   ```

3. **在 VS Code 中安裝**：
   - 按 `F5` 開啟擴展開發環境
   - 或使用 `vsce package` 打包後安裝

### 會員登入

1. 在側邊欄找到 SuiGuard 圖示
2. 點擊「會員登入」
3. 選擇登入方式（Sui Wallet/Google/GitHub）
4. 完成 zkLogin 身份驗證流程

### 代碼審計

#### 方法一：右鍵選單
1. 選中要分析的代碼（如第24-28行）
2. 右鍵選擇「🔍 AI 審計選中代碼」
3. 查看詳細的審計報告

#### 方法二：快捷鍵
1. 選中代碼後按 `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`)
2. 獲得即時的風險評估

#### 方法三：命令面板
1. 按 `Ctrl+Shift+P` 開啟命令面板
2. 輸入 \"SuiGuard\" 找到相關命令
3. 執行代碼分析

## 技術架構

```
vscode-extension/
├── src/
│   ├── extension.ts          # 主擴展入口
│   ├── zklogin/
│   │   └── zkLoginProvider.ts # zkLogin 整合
│   ├── analyzer/
│   │   └── codeAnalyzer.ts   # 代碼分析引擎
│   └── views/
│       ├── loginViewProvider.ts  # 登入界面
│       └── auditViewProvider.ts  # 審計界面
├── package.json              # 擴展配置
└── tsconfig.json            # TypeScript 配置
```

## 後端整合

擴展會調用 `../backend/main.py` 的 `/api/analyze-connection` 端點進行代碼分析：

```typescript
// 發送到後端的請求格式
{
  code: string,           // 選中的代碼
  fileName: string,       // 文件名
  startLine: number,      // 起始行號
  endLine: number,        // 結束行號
  language: string,       // 程式語言
  analysisType: 'full' | 'quick'
}
```

## zkLogin 整合

擴展與 `../zklogin-integration/` 資料夾中的服務整合，提供：
- OAuth 流程處理
- JWT 令牌驗證
- Sui 地址生成
- 會員狀態持久化

## 設定選項

在 VS Code 設定中配置：

```json
{
  \"suiguard.backendUrl\": \"http://localhost:8080\",
  \"suiguard.autoAnalysis\": true,
  \"suiguard.riskThreshold\": \"medium\"
}
```

## 開發指南

### 新增分析規則

在 `codeAnalyzer.ts` 中新增本地分析規則：

```typescript
const customRiskPatterns = [
  /your_pattern_here/gi,
  // 更多模式...
];
```

### 自訂 UI 組件

修改 `views/` 資料夾中的提供者來自訂側邊欄界面。

## 問題排解

### 常見問題

1. **無法連接到後端**：確認 `backend/main.py` 正在運行
2. **zkLogin 失敗**：檢查網絡連接和 `zklogin-integration` 服務
3. **分析超時**：調整後端服務的超時設定

### 除錯模式

按 `F5` 啟動擴展開發環境，使用 VS Code 開發者工具進行除錯。

## 授權

本專案採用與主專案相同的授權條款。