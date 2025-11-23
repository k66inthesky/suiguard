#!/bin/bash

echo "========================================="
echo "   🎮 GPU 環境檢測工具"
echo "========================================="

# 進入虛擬環境
cd /home/k66/suiguard/backend
source venv/bin/activate

echo ""
echo "📊 系統資訊:"
echo "-----------------------------------"

# 1. GPU 硬體資訊
echo "🔍 GPU 硬體:"
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
else
    echo "  ❌ nvidia-smi 未安裝或無 GPU"
fi

echo ""
echo "🔍 CUDA 版本:"
if command -v nvcc &> /dev/null; then
    nvcc --version | grep "release" | awk '{print "  " $5 $6}'
else
    if command -v nvidia-smi &> /dev/null; then
        echo "  ✅ CUDA $(nvidia-smi | grep "CUDA Version" | awk '{print $9}')"
    else
        echo "  ❌ CUDA 未安裝"
    fi
fi

echo ""
echo "🔍 PyTorch 環境:"
python << 'PYEOF'
import torch
import sys

print(f"  • PyTorch 版本: {torch.__version__}")
print(f"  • Python 版本: {sys.version.split()[0]}")

if torch.cuda.is_available():
    print(f"  • CUDA 可用: ✅ YES")
    print(f"  • CUDA 版本: {torch.version.cuda}")
    print(f"  • GPU 數量: {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        props = torch.cuda.get_device_properties(i)
        print(f"  • GPU {i}: {torch.cuda.get_device_name(i)}")
        print(f"    - VRAM: {props.total_memory / 1024**3:.1f} GB")
        print(f"    - 計算能力: {props.major}.{props.minor}")
else:
    print(f"  • CUDA 可用: ❌ NO (將使用 CPU)")
PYEOF

echo ""
echo "========================================="
echo "📊 當前 GPU 使用情況:"
echo "========================================="
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv
fi

echo ""
echo "========================================="
echo "🧪 快速測試 GPU 運算:"
echo "========================================="
python << 'PYEOF'
import torch
import time

if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"✅ 使用設備: {device}")
    
    # 簡單的張量運算測試
    print("🔄 執行 GPU 運算測試...")
    x = torch.randn(1000, 1000).to(device)
    y = torch.randn(1000, 1000).to(device)
    
    start = time.time()
    z = torch.matmul(x, y)
    torch.cuda.synchronize()
    elapsed = time.time() - start
    
    print(f"✅ 矩陣乘法測試完成 ({elapsed*1000:.2f} ms)")
    print(f"📊 GPU 記憶體: {torch.cuda.memory_allocated()/1024**2:.1f} MB")
else:
    device = torch.device("cpu")
    print(f"⚠️ 使用設備: {device}")
    print("💡 無 GPU 可用，將使用 CPU 模式")
PYEOF

echo ""
echo "========================================="
echo "✅ 檢測完成"
echo "========================================="
