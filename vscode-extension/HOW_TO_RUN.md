# 如何執行 SuiAudit VS Code Extension

## 📋 前置要求

1. **Node.js** 和 **npm** 已安裝
2. **VS Code** 已安裝
3. **TypeScript** 編譯器

## 🚀 執行步驟

### 步驟 1：安裝依賴
```bash
cd /home/k66/suiguard/vscode-extension
npm install
```

### 步驟 2：編譯 TypeScript
```bash
npm run compile
```

### 步驟 3：在 VS Code 中打開擴展項目
```bash
code /home/k66/suiguard/vscode-extension
```

### 步驟 4：啟動調試
1. 在 VS Code 中，按 `F5` 或點擊 `Run > Start Debugging`
2. 這會打開一個新的 VS Code 窗口（Extension Development Host）
3. 在新窗口中，您的擴展已經加載

### 步驟 5：啟動後端服務
在另一個終端中：
```bash
cd /home/k66/suiguard/backend
source venv/bin/activate  # 或 . venv/bin/activate
python main.py
```

## 🧪 測試擴展

### 方法 1：使用側邊欄
1. 在 Extension Development Host 窗口中，點擊左側活動欄的 SuiAudit 圖標
2. 點擊 "🚀 即時漏洞分析" 按鈕

### 方法 2：使用命令面板
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
2. 輸入 "SuiAudit"
3. 選擇 "SuiAudit: 🚀 即時漏洞分析"

### 方法 3：打開 Move 文件測試
1. 創建或打開一個 `.move` 文件
2. 右鍵點擊編輯器
3. 選擇 "SuiAudit: 🚀 即時漏洞分析"

## 📦 打包擴展（可選）

如果要打包成 `.vsix` 文件：

```bash
# 安裝 vsce 工具
npm install -g @vscode/vsce

# 打包擴展
cd /home/k66/suiguard/vscode-extension
vsce package
```

這會生成 `suiguard-vscode-extension-0.0.1.vsix` 文件，可以安裝到 VS Code：
```bash
code --install-extension suiguard-vscode-extension-0.0.1.vsix
```

## 🔧 常見問題

### Q: npm install 失敗
**A:** 確認 Node.js 版本：
```bash
node --version  # 應該 >= 16.x
npm --version
```

### Q: 編譯錯誤
**A:** 清理並重新編譯：
```bash
rm -rf node_modules out
npm install
npm run compile
```

### Q: 擴展無法連接後端
**A:** 
1. 確認後端正在運行：`curl http://localhost:8080`
2. 檢查 VS Code 設置中的 `suiguard.backendUrl`

### Q: 如何查看調試日誌？
**A:** 
1. 在 Extension Development Host 窗口中
2. 打開 `View > Output`
3. 選擇 "Extension Host" 或 "SuiAudit"

## 📁 項目結構

```
vscode-extension/
├── package.json          # 擴展配置和依賴
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── extension.ts      # 主入口文件
│   ├── analyzer/
│   │   └── codeAnalyzer.ts   # 代碼分析邏輯
│   ├── views/
│   │   ├── auditViewProvider.ts   # 審計視圖
│   │   └── loginViewProvider.ts   # 登入視圖
│   └── zklogin/
│       └── zkLoginProvider.ts     # zkLogin 提供者
├── assets/              # 圖標資源
└── out/                 # 編譯輸出（運行後生成）
```

## 🎯 快速開發流程

1. **修改代碼** → 保存文件
2. **重新編譯** → `npm run compile` 或使用 watch 模式：`npm run watch`
3. **重新加載擴展** → 在 Extension Development Host 窗口按 `Ctrl+R` (Windows/Linux) 或 `Cmd+R` (Mac)

## 📝 開發提示

- 使用 `npm run watch` 可以自動監視文件變更並重新編譯
- 修改 TypeScript 文件後，需要重新加載擴展窗口
- 查看 `package.json` 中的 `contributes` 部分了解命令和配置
- 使用 VS Code 的調試功能設置斷點

## 🔗 相關鏈接

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SuiAudit Backend API](../backend/README.md)
