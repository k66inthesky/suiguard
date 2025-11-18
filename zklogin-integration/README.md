# zkLogin Integration Service

此服務為 SuiGuard VS Code 擴展提供 zkLogin 整合功能，支援多種 OAuth 提供商和 Sui 區塊鏈地址生成。

## 功能特色

### 🔐 多重 OAuth 支援
- **Google Login**: 使用 Google 帳戶進行 zkLogin
- **GitHub Login**: 使用 GitHub 帳戶進行 zkLogin
- **Sui Wallet**: 直接連接 Sui 錢包

### 🌐 zkLogin 流程
1. OAuth 身份驗證
2. JWT 令牌生成和驗證
3. 零知識證明產生
4. Sui 地址derivation
5. 會話管理

## 快速開始

### 安裝

```bash
cd zklogin-integration
npm install
```

### 環境設定

建立 `.env` 文件：

```env
# OAuth 應用程式設定
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT 簽名密鑰
JWT_SECRET=your_jwt_secret_key

# 服務設定
PORT=3000
SUI_NETWORK=devnet
```

### 啟動服務

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

服務將在 `http://localhost:3000` 啟動。

## API 端點

### POST /auth/initiate
初始化 OAuth 登入流程

**請求體:**
```json
{
  "provider": "google" | "github" | "sui-wallet"
}
```

**回應:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth2/v2/auth?..."
}
```

### GET /auth/callback
OAuth 回調處理端點

**查詢參數:**
- `code`: OAuth authorization code
- `state`: 狀態參數

**回應:**
```json
{
  "success": true,
  "token": "jwt_token",
  "suiAddress": "0x...",
  "userInfo": {
    "id": "12345",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /auth/verify
驗證 zkLogin 令牌

**請求體:**
```json
{
  "token": "jwt_token"
}
```

**回應:**
```json
{
  "success": true,
  "valid": true,
  "userData": {
    "sub": "12345",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### GET /user/profile
獲取用戶資訊（需要認證）

**請求標頭:**
```
Authorization: Bearer jwt_token
```

**回應:**
```json
{
  "success": true,
  "userInfo": {
    "sub": "12345",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

## VS Code 擴展整合

此服務設計為與 SuiGuard VS Code 擴展無縫整合：

```typescript
// VS Code 擴展中的使用範例
const response = await axios.post('http://localhost:3000/auth/initiate', {
  provider: 'google'
});

if (response.data.success) {
  // 開啟瀏覽器進行 OAuth 流程
  vscode.env.openExternal(vscode.Uri.parse(response.data.authUrl));
}
```

## 開發指南

### 目錄結構

```
zklogin-integration/
├── src/
│   ├── zklogin-service.js    # 主服務檔案
│   ├── oauth/                # OAuth 處理器
│   ├── sui/                  # Sui 相關功能
│   └── storage/              # 資料儲存
├── config/
│   └── config.json          # 配置檔案
├── tests/                   # 測試檔案
├── package.json
└── README.md
```

### 新增 OAuth 提供商

1. 在 `initiateOAuth` 方法中新增提供商 URL
2. 實作對應的令牌交換邏輯
3. 更新用戶資料處理流程

### 自定義 zkLogin 邏輯

修改 `generateSuiAddress` 方法來實作真正的 zkLogin proof 生成和地址derivation。

## 安全考量

- 使用環境變數儲存敏感資訊
- 實作適當的速率限制
- 驗證所有輸入參數
- 使用 HTTPS（生產環境）
- 定期輪替 JWT 簽名密鑰

## 故障排除

### 常見問題

1. **OAuth 回調失敗**
   - 檢查 redirect URI 是否正確註冊
   - 確認客戶端 ID 和密鑰設定正確

2. **JWT 驗證失敗**
   - 確認使用相同的簽名密鑰
   - 檢查令牌是否過期

3. **Sui 地址生成錯誤**
   - 驗證 Sui 網路連接
   - 檢查 zkLogin proof 格式

### 除錯模式

設定環境變數 `DEBUG=zklogin:*` 啟用詳細日誌：

```bash
DEBUG=zklogin:* npm run dev
```

## 授權

本專案採用 MIT 授權條款。