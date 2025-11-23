# 🎮 GPU 加速設置指南

## ✅ 當前狀態（你的環境）

### GPU 資訊
- **GPU 型號**: NVIDIA GeForce RTX 3060
- **VRAM**: 12 GB
- **CUDA 版本**: 12.8
- **驅動版本**: 581.63
- **運行狀態**: ✅ GPU 加速已啟用

### 軟體環境
- **PyTorch**: 2.8.0+cu128 (CUDA 12.8 支援)
- **CUDA Toolkit**: 13.0
- **運行模式**: GPU (cuda) - 自動偵測

### 效能表現
- **模型載入**: ~23 秒
- **GPU 記憶體使用**: ~13.5 GB (Mistral-7B + LoRA)
- **推理速度**: ~30 秒/請求 (with LoRA)
- **並發處理**: 2 個同時請求

---

## 🚀 GPU/CPU 自動切換機制

系統已實現智能設備選擇，會自動：

### 有 GPU 環境 (你的情況)
```
🎮 偵測到 GPU: NVIDIA GeForce RTX 3060 (12.0 GB)
✅ 使用 GPU 加速 (CUDA 12.8)
💾 GPU 記憶體限制: 6GB
🧠 載入基礎模型 (GPU 模式)...
✅ ML 模型載入完成 (設備: cuda)
```

### 無 GPU 環境 (自動降級)
```
⚠️ 未偵測到 GPU，降級使用 CPU
💡 安裝 CUDA 版本的 PyTorch 以啟用 GPU 加速
🧠 載入基礎模型 (CPU 模式)...
✅ ML 模型載入完成 (設備: cpu)
```

---

## 📦 CUDA 相依套件安裝

### 1. 檢查 CUDA 是否可用
```bash
# 檢查 GPU
nvidia-smi

# 檢查 PyTorch CUDA 支援
cd /home/k66/suiguard/backend
source venv/bin/activate
python -c "import torch; print(f'CUDA可用: {torch.cuda.is_available()}')"
```

### 2. 安裝 CUDA 版本 PyTorch (如需要)

#### 選項 A: CUDA 12.x (推薦，適用於新 GPU)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

#### 選項 B: CUDA 11.x (適用於較舊 GPU)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 選項 C: CPU 版本 (無 GPU)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 3. 驗證安裝
```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"
```

---

## ⚙️ 環境變數配置

### `.env` 設定
```bash
# ML 服務配置
ML_MAX_MEMORY_GB=6              # GPU 記憶體限制 (GB)
MAX_CONCURRENT_ML_REQUESTS=2    # 最大並發請求數
MAX_ML_QUEUE_SIZE=10            # 請求隊列大小

# 模型配置
BASE_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2
LORA_MODEL_PATH=./lora_models

# 服務開關
ENABLE_ML_SERVICE=true
ENABLE_PACKAGE_MONITOR=false
```

### GPU 記憶體建議配置

| GPU VRAM | 推薦設定 | 並發數 |
|----------|---------|--------|
| 6-8 GB   | ML_MAX_MEMORY_GB=4  | 1 |
| 10-12 GB | ML_MAX_MEMORY_GB=6  | 2 |
| 16 GB+   | ML_MAX_MEMORY_GB=10 | 3-4 |

---

## 🔧 系統需求

### 最低要求 (CPU 模式)
- **RAM**: 16 GB+
- **CPU**: 8 核心+
- **磁碟**: 20 GB 可用空間
- **推理速度**: ~60-120 秒/請求

### 推薦配置 (GPU 模式)
- **GPU**: NVIDIA GPU with 8GB+ VRAM
- **CUDA**: 11.8+ 或 12.x
- **RAM**: 16 GB+
- **磁碟**: 20 GB 可用空間
- **推理速度**: ~10-30 秒/請求

### 你的配置 ✅
- **GPU**: RTX 3060 (12 GB) ✨
- **RAM**: 15 GB
- **CUDA**: 12.8 ✅
- **狀態**: **完美支援 GPU 加速**

---

## 📊 效能監控

### 查看 GPU 使用情況
```bash
# 即時監控
watch -n 1 nvidia-smi

# 記憶體使用
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

### 查看服務日誌
```bash
# ML 服務日誌
tail -f ml_service.log | grep -E "(GPU|CUDA|設備|記憶體)"

# 查看完整日誌
tail -100 ml_service.log
```

---

## 🐛 常見問題

### Q1: CUDA out of memory
**解決方案**:
```bash
# 降低記憶體限制
ML_MAX_MEMORY_GB=4

# 減少並發數
MAX_CONCURRENT_ML_REQUESTS=1
```

### Q2: RuntimeError: CUDA error
**解決方案**:
```bash
# 重啟服務
./stop_all_services.sh
./start_ml_service.sh
./start_api_service.sh
```

### Q3: 無法偵測 GPU
**檢查步驟**:
```bash
# 1. 檢查驅動
nvidia-smi

# 2. 檢查 CUDA
nvcc --version

# 3. 重新安裝 PyTorch
pip uninstall torch
pip install torch --index-url https://download.pytorch.org/whl/cu121
```

---

## 🎯 最佳實踐

### 1. GPU 模式優化
- ✅ 使用 FP16 (float16) 加速推理
- ✅ 設置合理的記憶體限制
- ✅ 啟用並發處理 (2-3 請求)
- ✅ 監控 GPU 使用率

### 2. CPU 模式優化
- ✅ 使用 FP32 (float32) 保證精度
- ✅ 減少並發數 (1 請求)
- ✅ 增加 RAM
- ✅ 考慮使用量化模型

### 3. 混合環境部署
- 開發環境：GPU 加速
- 測試環境：CPU 模式
- 生產環境：根據硬體自動選擇

---

## 📝 更新日誌

### 2025-11-23
- ✅ 實現 GPU/CPU 自動切換
- ✅ 支援 RTX 3060 GPU 加速
- ✅ CUDA 12.8 完整支援
- ✅ 智能設備偵測
- ✅ LoRA 模型 GPU 加速
- ✅ 並發請求處理 (2 請求)

---

## 🔗 相關資源

- [PyTorch CUDA 安裝](https://pytorch.org/get-started/locally/)
- [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)
- [Transformers GPU 支援](https://huggingface.co/docs/transformers/perf_hardware)
