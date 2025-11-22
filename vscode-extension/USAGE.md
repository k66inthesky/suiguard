# SuiAudit VS Code Extension 使用指南

## 🚀 即時漏洞分析功能

### 功能說明
這個功能可以即時分析您的 Move 智能合約代碼，檢測潛在的安全漏洞和風險。

### 使用方法

#### 方法 1：使用側邊欄按鈕
1. 打開 VS Code
2. 點擊左側的 SuiAudit 圖標
3. 在"程式碼審計"部分，點擊 "🚀 即時漏洞分析" 按鈕
4. 系統會分析當前打開的 Move 文件（或選中的代碼）

#### 方法 2：使用右鍵菜單
1. 打開一個 `.move` 文件
2. 右鍵點擊編輯器
3. 選擇 "SuiAudit: 🚀 即時漏洞分析"

#### 方法 3：使用編輯器標題欄按鈕
1. 打開一個 `.move` 文件
2. 點擊編輯器右上角的 SuiAudit 圖標
3. 選擇 "即時漏洞分析"

### 分析範圍
- **未選中代碼**：分析整個文件
- **已選中代碼**：只分析選中的部分

### 後端服務設置

#### 啟動後端服務
```bash
cd /home/k66/suiguard/backend
python main.py
```

#### 配置後端地址
在 VS Code 設置中修改 `suiguard.backendUrl`：
- 本地開發：`http://localhost:8080`
- 生產環境：`https://your-backend-url.com`

### 分析結果
分析完成後，會在新標籤頁中顯示：
- **風險等級**：LOW / MEDIUM / HIGH / CRITICAL
- **風險分數**：0-100
- **漏洞列表**：發現的安全漏洞
- **安全問題**：潛在的安全問題
- **修復建議**：具體的改進建議
- **分析詳情**：ML 模型版本、處理時間等

### API 端點
- **端點**：`/api/real-time-analyze`
- **方法**：POST
- **請求格式**：
  ```json
  {
    "source_code": "module example::test { ... }",
    "file_name": "test.move"
  }
  ```

### 常見問題

#### Q: 提示"無法連接到後端服務"
A: 請確認後端服務是否正在運行：
```bash
cd backend
python main.py
```

#### Q: 分析時間過長
A: 大文件可能需要較長時間，建議先選中部分代碼進行分析

#### Q: 如何修改後端地址？
A: 
1. 打開 VS Code 設置（Ctrl/Cmd + ,）
2. 搜索 "suiguard"
3. 修改 "Backend Url" 配置項

### 其他功能

#### 快速安全檢查
- 快捷鍵：選中代碼後點擊側邊欄的 "⚡ 快速安全檢查"
- 功能：快速檢測選中代碼的風險等級

#### 深度分析
- 快捷鍵：`Ctrl+Shift+A` (Windows/Linux) 或 `Cmd+Shift+A` (Mac)
- 功能：對選中代碼進行詳細的安全分析

## 技術支持
如有問題，請聯繫 SuiAudit 團隊或查看項目文檔。
