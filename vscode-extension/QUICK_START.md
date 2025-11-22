# 🚀 SuiAudit 擴展快速使用指南

## 📍 您現在的位置
您已經在 Extension Development Host 窗口中，並打開了一個 `.move` 文件。

## 🔘 如何找到並使用分析按鈕

### 方法 1：使用命令面板（最快）
1. **按 `Ctrl+Shift+P`** (Windows/Linux) 或 **`Cmd+Shift+P`** (Mac)
2. 輸入 **"SuiAudit"**
3. 選擇 **"SuiAudit: 🚀 即時漏洞分析""
4. 等待分析完成，結果會在新標籤頁顯示

### 方法 2：使用右鍵菜單
1. 在 `.move` 文件編輯器中 **右鍵點擊**
2. 找到 **"SuiAudit: 🚀 即時漏洞分析"** 選項
3. 點擊執行分析

### 方法 3：使用編輯器標題欄按鈕
1. 查看編輯器右上角的工具欄
2. 應該會看到 SuiAudit 圖標按鈕
3. 點擊即可分析

### 方法 4：使用側邊欄（需要啟用）
1. 點擊左側活動欄的 **SuiAudit 圖標**（如果看不到，可能需要重新加載擴展）
2. 在側邊欄中點擊 **"🚀 即時漏洞分析"**

## ⚠️ 重要提醒

### 確保後端服務正在運行
在執行分析前，必須啟動後端服務：

```bash
# 在另一個終端執行
cd /home/k66/suiguard/backend
source venv/bin/activate
python main.py
```

後端應該顯示：
```
INFO:     Uvicorn running on http://0.0.0.0:8080
```

## 🔧 如果看不到按鈕

### 步驟 1：重新加載擴展
在 Extension Development Host 窗口中：
- **按 `Ctrl+R`** (Windows/Linux) 或 **`Cmd+R`** (Mac)
- 或者點擊 **View > Command Palette** > 輸入 **"Reload Window"**

### 步驟 2：檢查擴展是否已激活
1. 按 **`Ctrl+Shift+P`** 打開命令面板
2. 輸入 **"Developer: Show Running Extensions"**
3. 查找 **"SuiAudit Security Auditor""
4. 確認狀態為 **"Activated"**

### 步驟 3：查看控制台日誌
1. 在原始的 VS Code 窗口（不是 Extension Development Host）
2. 打開 **View > Output**
3. 選擇 **"Extension Host"**
4. 查看是否有錯誤信息

## 📝 測試流程

### 完整測試步驟：

1. **確認後端運行**：
   ```bash
   curl http://localhost:8080
   ```
   應該返回 JSON 響應

2. **在 Extension Development Host 窗口**：
   - 確保打開了 `.move` 文件
   - 按 `Ctrl+Shift+P`
   - 輸入 "SuiAudit"
   - 選擇 "🚀 即時漏洞分析"

3. **查看分析結果**：
   - 會顯示進度提示
   - 完成後在新標籤頁顯示結果
   - 包含風險等級、漏洞、建議等

## 🎯 快捷鍵

- **即時分析**: `Ctrl+Shift+P` → 輸入 "real" → Enter
- **快速檢查**: `Ctrl+Shift+A` (需要先選中代碼)

## 🐛 故障排除

### 問題：提示"無法連接到後端服務"
**解決**：
```bash
# 檢查後端是否運行
curl http://localhost:8080
# 如果失敗，啟動後端
cd /home/k66/suiguard/backend
source venv/bin/activate
python main.py
```

### 問題：命令面板中找不到 SuiAudit 命令
**解決**：
1. 在 Extension Development Host 按 `Ctrl+R` 重新加載
2. 或在原始 VS Code 窗口重新按 `F5`

### 問題：分析沒有反應
**解決**：
1. 打開 **View > Output** > 選擇 **"Extension Host"**
2. 查看錯誤信息
3. 確認 `.move` 文件有內容

## 📊 預期結果

分析完成後，您會看到：
- ✅ **風險等級**: LOW/MEDIUM/HIGH/CRITICAL
- 📊 **風險分數**: 0-100
- 🚨 **漏洞列表**: 發現的安全問題
- 💡 **修復建議**: 具體改進方案
- 📈 **分析詳情**: ML 模型信息

---

**現在就試試吧！** 按 `Ctrl+Shift+P` 然後輸入 "SuiAudit" 🚀
