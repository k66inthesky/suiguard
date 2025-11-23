#!/bin/bash
# 快速測試腳本 - 驗證方案 C 配置

echo "========================================"
echo "   SuiGuard 方案 C 配置測試"
echo "========================================"

# 檢查文件是否存在
echo ""
echo "📁 檢查文件..."
files=(
    "ml_service.py"
    "middleware/rate_limiter.py"
    "start_ml_service.sh"
    "start_api_service.sh"
    "stop_all_services.sh"
    "MEMORY_OPTIMIZATION_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
    fi
done

# 檢查腳本執行權限
echo ""
echo "🔐 檢查腳本權限..."
scripts=(
    "start_ml_service.sh"
    "start_api_service.sh"
    "stop_all_services.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        echo "  ✅ $script (可執行)"
    else
        echo "  ⚠️  $script (無執行權限)"
    fi
done

# 檢查環境變數
echo ""
echo "⚙️  檢查環境變數..."
if [ -f ".env" ]; then
    echo "  ✅ .env 文件存在"
    
    # 檢查關鍵配置
    configs=(
        "ENABLE_ML_SERVICE"
        "ML_SERVICE_URL"
        "ML_SERVICE_PORT"
        "MAX_CONCURRENT_ML_REQUESTS"
        "ENABLE_PACKAGE_MONITOR"
    )
    
    for config in "${configs[@]}"; do
        if grep -q "^${config}=" .env; then
            value=$(grep "^${config}=" .env | cut -d'=' -f2)
            echo "  ✅ $config=$value"
        else
            echo "  ❌ $config (未配置)"
        fi
    done
else
    echo "  ❌ .env 文件不存在"
fi

# 檢查虛擬環境
echo ""
echo "🐍 檢查 Python 虛擬環境..."
if [ -d "venv" ]; then
    echo "  ✅ venv/ 存在"
    if [ -f "venv/bin/python" ]; then
        echo "  ✅ Python 可執行文件存在"
        version=$(venv/bin/python --version 2>&1)
        echo "  📊 版本: $version"
    fi
else
    echo "  ❌ venv/ 不存在"
fi

# 檢查 LoRA 模型
echo ""
echo "🤖 檢查 LoRA 模型..."
if [ -d "lora_models" ]; then
    echo "  ✅ lora_models/ 存在"
    model_files=$(ls -la lora_models/ 2>/dev/null | wc -l)
    echo "  📊 包含 $model_files 個文件/目錄"
else
    echo "  ⚠️  lora_models/ 不存在 (將使用基礎配置)"
fi

# 檢查端口佔用
echo ""
echo "🔍 檢查端口狀態..."
ports=(8080 8081)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        process=$(ps -p $pid -o comm= 2>/dev/null)
        echo "  ⚠️  端口 $port 已被佔用 (PID: $pid, 進程: $process)"
    else
        echo "  ✅ 端口 $port 可用"
    fi
done

# 記憶體檢查
echo ""
echo "💾 記憶體狀態..."
total_mem=$(free -h | awk '/^Mem:/ {print $2}')
used_mem=$(free -h | awk '/^Mem:/ {print $3}')
free_mem=$(free -h | awk '/^Mem:/ {print $4}')
echo "  📊 總記憶體: $total_mem"
echo "  📊 已使用: $used_mem"
echo "  📊 可用: $free_mem"

# 檢查是否有足夠記憶體運行 ML 服務
free_gb=$(free -g | awk '/^Mem:/ {print $4}')
if [ $free_gb -ge 10 ]; then
    echo "  ✅ 記憶體充足，可運行 ML 服務"
elif [ $free_gb -ge 6 ]; then
    echo "  ⚠️  記憶體緊張，建議關閉其他程序"
else
    echo "  ❌ 記憶體不足，建議禁用 ML 服務"
fi

echo ""
echo "========================================"
echo "✅ 配置檢查完成"
echo "========================================"
echo ""
echo "💡 下一步:"
echo "  1. 啟動 ML 服務: ./start_ml_service.sh"
echo "  2. 啟動主服務: ./start_api_service.sh"
echo "  3. 查看文檔: cat MEMORY_OPTIMIZATION_GUIDE.md"
echo ""
