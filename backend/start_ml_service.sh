#!/bin/bash
# ML 服務啟動腳本
# 用於啟動獨立的 ML 模型服務

# 設置顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SuiGuard ML Service Launcher${NC}"
echo -e "${BLUE}========================================${NC}"

# 檢查當前目錄
if [ ! -f "ml_service.py" ]; then
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

# 檢查是否已有 ML 服務運行
ML_PORT=${ML_SERVICE_PORT:-8081}
if lsof -Pi :$ML_PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  ML 服務已在端口 $ML_PORT 運行${NC}"
    read -p "是否要停止現有服務並重新啟動? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🛑 停止現有 ML 服務...${NC}"
        pkill -f "python.*ml_service.py"
        sleep 2
    else
        echo -e "${BLUE}ℹ️  保持現有服務運行${NC}"
        exit 0
    fi
fi

# 檢查 LoRA 模型
LORA_PATH=${LORA_MODEL_PATH:-./lora_models}
if [ ! -d "$LORA_PATH" ]; then
    echo -e "${YELLOW}⚠️  未找到 LoRA 模型: $LORA_PATH${NC}"
    echo -e "${YELLOW}   模型將在首次請求時載入基礎配置${NC}"
fi

# 啟動 ML 服務
echo -e "${GREEN}🚀 啟動 ML 服務 (端口: $ML_PORT)...${NC}"
echo -e "${BLUE}========================================${NC}"

# 在背景執行 ML 服務
nohup python ml_service.py > ml_service.log 2>&1 &
ML_PID=$!

# 等待服務啟動
echo -e "${YELLOW}⏳ 等待服務啟動...${NC}"
sleep 3

# 檢查服務是否運行
if ps -p $ML_PID > /dev/null; then
    echo -e "${GREEN}✅ ML 服務已成功啟動!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}📊 服務信息:${NC}"
    echo -e "  • PID: $ML_PID"
    echo -e "  • 端口: $ML_PORT"
    echo -e "  • 日誌: $(pwd)/ml_service.log"
    echo -e "  • 健康檢查: http://localhost:$ML_PORT/health"
    echo -e "  • API 文檔: http://localhost:$ML_PORT/docs"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "  • 查看日誌: tail -f ml_service.log"
    echo -e "  • 停止服務: pkill -f 'python.*ml_service.py'"
    echo -e "  • 檢查狀態: ps aux | grep ml_service.py"
    echo -e "${BLUE}========================================${NC}"
    
    # 保存 PID
    echo $ML_PID > ml_service.pid
    echo -e "${GREEN}✅ PID 已保存至 ml_service.pid${NC}"
else
    echo -e "${RED}❌ ML 服務啟動失敗${NC}"
    echo -e "${YELLOW}請檢查日誌: tail -f ml_service.log${NC}"
    exit 1
fi
