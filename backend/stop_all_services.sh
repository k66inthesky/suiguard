#!/bin/bash
# 停止所有 SuiGuard 服務

# 設置顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   停止 SuiGuard 服務${NC}"
echo -e "${BLUE}========================================${NC}"

# 停止 API 服務
if [ -f "api_service.pid" ]; then
    API_PID=$(cat api_service.pid)
    if ps -p $API_PID > /dev/null; then
        echo -e "${YELLOW}🛑 停止 API 服務 (PID: $API_PID)...${NC}"
        kill $API_PID
        sleep 2
        if ps -p $API_PID > /dev/null; then
            echo -e "${RED}⚠️  強制停止 API 服務...${NC}"
            kill -9 $API_PID
        fi
        echo -e "${GREEN}✅ API 服務已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  API 服務未運行 (PID: $API_PID)${NC}"
    fi
    rm api_service.pid
else
    echo -e "${YELLOW}⚠️  未找到 API 服務 PID 文件，嘗試直接停止...${NC}"
    pkill -f "python.*main.py"
fi

# 停止 ML 服務
if [ -f "ml_service.pid" ]; then
    ML_PID=$(cat ml_service.pid)
    if ps -p $ML_PID > /dev/null; then
        echo -e "${YELLOW}🛑 停止 ML 服務 (PID: $ML_PID)...${NC}"
        kill $ML_PID
        sleep 2
        if ps -p $ML_PID > /dev/null; then
            echo -e "${RED}⚠️  強制停止 ML 服務...${NC}"
            kill -9 $ML_PID
        fi
        echo -e "${GREEN}✅ ML 服務已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  ML 服務未運行 (PID: $ML_PID)${NC}"
    fi
    rm ml_service.pid
else
    echo -e "${YELLOW}⚠️  未找到 ML 服務 PID 文件，嘗試直接停止...${NC}"
    pkill -f "python.*ml_service.py"
fi

# 檢查是否還有殘留進程
echo -e "${BLUE}🔍 檢查殘留進程...${NC}"
REMAINING=$(ps aux | grep -E "python.*(main|ml_service).py" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo -e "${RED}⚠️  發現 $REMAINING 個殘留進程${NC}"
    ps aux | grep -E "python.*(main|ml_service).py" | grep -v grep
    read -p "是否強制停止所有殘留進程? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -9 -f "python.*main.py"
        pkill -9 -f "python.*ml_service.py"
        echo -e "${GREEN}✅ 所有進程已強制停止${NC}"
    fi
else
    echo -e "${GREEN}✅ 沒有殘留進程${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 服務停止完成${NC}"
echo -e "${BLUE}========================================${NC}"
