#!/bin/bash

# SuiGuard VS Code Extension 一鍵啟動腳本

echo "🚀 啟動 SuiGuard VS Code Extension 開發環境..."

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

# 編譯 TypeScript
echo "🔨 編譯 TypeScript..."
npm run compile

# 檢查編譯是否成功
if [ $? -eq 0 ]; then
    echo "✅ 編譯完成！"
    echo ""
    echo "📝 接下來的步驟："
    echo "1. 在 VS Code 中打開此專案："
    echo "   code /home/k66/suiguard/vscode-extension"
    echo ""
    echo "2. 按 F5 啟動調試模式"
    echo ""
    echo "3. 在另一個終端啟動後端服務："
    echo "   cd /home/k66/suiguard/backend"
    echo "   source venv/bin/activate"
    echo "   python main.py"
    echo ""
    echo "4. 在 Extension Development Host 窗口中測試擴展功能"
    echo ""
    
    # 詢問是否要打開 VS Code
    read -p "是否現在打開 VS Code? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        code /home/k66/suiguard/vscode-extension
    fi
else
    echo "❌ 編譯失敗，請檢查錯誤信息"
    exit 1
fi
