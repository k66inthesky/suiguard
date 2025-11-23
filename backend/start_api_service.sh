#!/bin/bash
# 主 API 服務啟動腳本
# 用於啟動主要的 FastAPI 後端服務

# 設置顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SuiGuard API Service Launcher${NC}"
echo -e "${BLUE}========================================${NC}"

# 檢查當前目錄
if [ ! -f "main.py" ]; then
    echo -e "${RED}❌ 錯誤: 請在 backend 目錄下執行此腳本${NC}"
    exit 1
fi

# 載入環境變數
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ 載入 .env 文件${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  未找到 .env 文件，使用默認配置${NC}"
fi

# 檢查虛擬環境
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ 錯誤: 虛擬環境不存在${NC}"
    echo -e "${YELLOW}請先運行: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

# 啟動虛擬環境
echo -e "${GREEN}🔧 啟動虛擬環境...${NC}"
source venv/bin/activate

# 檢查 ML 服務是否啟用
ENABLE_ML=${ENABLE_ML_SERVICE:-true}
ML_PORT=${ML_SERVICE_PORT:-8081}

if [ "$ENABLE_ML" = "true" ]; then
    echo -e "${BLUE}🤖 檢查 ML 服務狀態...${NC}"
    if lsof -Pi :$ML_PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ ML 服務已運行 (端口: $ML_PORT)${NC}"
    else
        echo -e "${YELLOW}⚠️  ML 服務未運行${NC}"
        read -p "是否要啟動 ML 服務? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo -e "${GREEN}🚀 啟動 ML 服務...${NC}"
            bash start_ml_service.sh
            sleep 5
        else
            echo -e "${YELLOW}⚠️  將以禁用 ML 的模式運行主服務${NC}"
            export ENABLE_ML_SERVICE=false
        fi
    fi
else
    echo -e "${YELLOW}⚠️  ML 服務已禁用 (ENABLE_ML_SERVICE=false)${NC}"
fi

# 檢查 Package Monitor 配置
ENABLE_MONITOR=${ENABLE_PACKAGE_MONITOR:-false}
if [ "$ENABLE_MONITOR" = "true" ]; then
    echo -e "${GREEN}✅ Package Monitor 已啟用${NC}"
else
    echo -e "${YELLOW}⚠️  Package Monitor 已禁用 (ENABLE_PACKAGE_MONITOR=false)${NC}"
fi

# 檢查是否已有主服務運行
API_PORT=${PORT:-8080}
if lsof -Pi :$API_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  主服務已在端口 $API_PORT 運行${NC}"
    read -p "是否要停止現有服務並重新啟動? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🛑 停止現有主服務...${NC}"
        pkill -f "python.*main.py"
        sleep 2
    else
        echo -e "${BLUE}ℹ️  保持現有服務運行${NC}"
        exit 0
    fi
fi

# 啟動主服務
echo -e "${GREEN}🚀 啟動主服務 (端口: $API_PORT)...${NC}"
echo -e "${BLUE}========================================${NC}"

# 在背景執行主服務
nohup python main.py > backend.log 2>&1 &
API_PID=$!

# 等待服務啟動
echo -e "${YELLOW}⏳ 等待服務啟動...${NC}"
sleep 3

# 檢查服務是否運行
if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✅ 主服務已成功啟動!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}📊 服務信息:${NC}"
    echo -e "  • PID: $API_PID"
    echo -e "  • 端口: $API_PORT"
    echo -e "  • 日誌: $(pwd)/backend.log"
    echo -e "  • 健康檢查: http://localhost:$API_PORT/"
    echo -e "  • ML 服務: ${ENABLE_ML}"
    echo -e "  • Package Monitor: ${ENABLE_MONITOR}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "  • 查看日誌: tail -f backend.log"
    echo -e "  • 停止服務: pkill -f 'python.*main.py'"
    echo -e "  • 檢查狀態: ps aux | grep main.py"
    echo -e "${BLUE}========================================${NC}"
    
    # 保存 PID
    echo $API_PID > api_service.pid
    echo -e "${GREEN}✅ PID 已保存至 api_service.pid${NC}"
else
    echo -e "${RED}❌ 主服務啟動失敗${NC}"
    echo -e "${YELLOW}請檢查日誌: tail -f backend.log${NC}"
    exit 1
fi
