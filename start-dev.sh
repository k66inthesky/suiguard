#!/bin/bash

# SuiGuard VS Code Extension 開發環境啟動腳本

echo "🚀 啟動 SuiGuard 開發環境..."

# 設定顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安裝，請先安裝 Node.js${NC}"
    exit 1
fi

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安裝，請先安裝 Python3${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 環境檢查通過${NC}"

# 安裝 zklogin-integration 依賴
echo -e "${YELLOW}📦 安裝 zkLogin Integration 依賴...${NC}"
cd zklogin-integration
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 編譯 VS Code 擴展
echo -e "${YELLOW}🔨 編譯 VS Code 擴展...${NC}"
cd vscode-extension
npm run compile
cd ..

# 啟動 zkLogin 服務（背景執行）
echo -e "${YELLOW}🌐 啟動 zkLogin Integration 服務...${NC}"
cd zklogin-integration
nohup node src/zklogin-service.js > zklogin.log 2>&1 &
ZKLOGIN_PID=$!
echo "zkLogin 服務 PID: $ZKLOGIN_PID"
cd ..

# 檢查後端服務是否運行
echo -e "${YELLOW}🔍 檢查後端服務...${NC}"
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✅ 後端服務運行正常${NC}"
else
    echo -e "${YELLOW}⚠️  後端服務未運行，請手動啟動 backend/main.py${NC}"
fi

# 等待 zkLogin 服務啟動
sleep 3

# 檢查 zkLogin 服務
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ zkLogin 服務運行正常${NC}"
else
    echo -e "${RED}❌ zkLogin 服務啟動失敗${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SuiGuard 開發環境啟動完成！${NC}"
echo ""
echo -e "${YELLOW}📋 服務狀態:${NC}"
echo "   • zkLogin Integration: http://localhost:3000"
echo "   • 後端 API: http://localhost:8080"
echo "   • VS Code 擴展: 準備就緒"
echo ""
echo -e "${YELLOW}📝 下一步:${NC}"
echo "   1. 在 VS Code 中打開此專案資料夾"
echo "   2. 按 F5 啟動擴展開發環境"
echo "   3. 在新視窗中測試 SuiGuard 功能"
echo ""
echo -e "${YELLOW}🛑 停止服務:${NC}"
echo "   pkill -f zklogin-service.js"

# 建立停止腳本
cat > stop-services.sh << 'EOF'
#!/bin/bash
echo "🛑 停止 SuiGuard 服務..."
pkill -f zklogin-service.js
echo "✅ 服務已停止"
EOF

chmod +x stop-services.sh

echo "   或執行: ./stop-services.sh"