# ML Training Service - 使用說明

## 📋 概述

ML Training Service 是 SuiGuard 的機器學習訓練服務，用於訓練和測試 Sui 智能合約漏洞檢測模型。

## 🚀 快速開始

### 1. 命令行使用

#### 訓練模型
```bash
# 基本訓練（使用默認參數）
python ml_cli.py --train

# 自定義訓練參數
python ml_cli.py --train \
  --epochs 3 \
  --batch-size 2 \
  --learning-rate 3e-4 \
  --lora-r 8 \
  --lora-alpha 16

# 使用不同的基礎模型
python ml_cli.py --train \
  --model mistralai/Mistral-7B-Instruct-v0.2 \
  --dataset contract_bug_dataset.jsonl \
  --output ./output_lora_bug
```

#### 測試模型
```bash
# 測試訓練好的模型
python ml_cli.py --test

# 測試指定路徑的模型
python ml_cli.py --test --model-path ./output_lora_bug
```

#### 交叉驗證
```bash
# 3-fold 交叉驗證
python ml_cli.py --cross-validate --folds 3

# 5-fold 交叉驗證
python ml_cli.py --cross-validate --folds 5
```

### 2. Python 代碼使用

#### 方法一：使用便捷函數

```python
from services import train_vulnerability_detection_model, test_vulnerability_detection_model

# 訓練模型
train_stats = train_vulnerability_detection_model(
    base_model="mistralai/Mistral-7B-Instruct-v0.2",
    dataset_path="contract_bug_dataset.jsonl",
    output_dir="./output_lora_bug",
    num_epochs=3
)

# 測試模型
test_results = test_vulnerability_detection_model(
    model_path="./output_lora_bug",
    dataset_path="contract_bug_dataset.jsonl"
)

print(f"準確率: {test_results['summary']['accuracy']:.1f}%")
```

#### 方法二：使用服務類

```python
from services.ml_training_service import MLTrainingService

# 創建服務實例
service = MLTrainingService(
    base_model="mistralai/Mistral-7B-Instruct-v0.2",
    dataset_path="contract_bug_dataset.jsonl",
    output_dir="./output_lora_bug"
)

# 訓練模型
train_results = service.train_model(
    num_epochs=3,
    batch_size=2,
    learning_rate=3e-4,
    lora_r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    use_8bit=True
)

# 測試模型
test_results = service.test_model()

# 交叉驗證
cv_results = service.cross_validate(n_folds=3)
```

## 📊 數據集格式

數據集應為 JSONL 格式（每行一個 JSON 對象）：

```jsonl
{"instruction": "找出Sui smart contract的惡意漏洞，並判斷是哪種漏洞類型(5種漏洞(Resource Leak, Arithmetic Overflow, Unchecked Return, Cross-Module Pollution, Capability Leak)或未發現明顯漏洞)，用繁體中文回答", "input": "public fun withdraw(coin: Coin, amount: u64, ctx: &TxContext) { assert!(coin.balance >= amount, 0); coin.balance = coin.balance - amount; }", "output": "漏洞類型：Arithmetic Overflow，行數：第3行減法運算未做好下溢檢查"}
```

### 支持的漏洞類型

1. **Resource Leak** - 資源洩漏
2. **Arithmetic Overflow** - 算術溢位
3. **Unchecked Return** - 未檢查返回值
4. **Cross-Module Pollution** - 跨模組污染
5. **Capability Leak** - 權限洩漏
6. **未發現明顯漏洞** - 安全代碼

## 🎯 訓練參數說明

| 參數 | 默認值 | 說明 |
|------|--------|------|
| `--model` | Mistral-7B-Instruct-v0.2 | 基礎模型名稱 |
| `--dataset` | contract_bug_dataset.jsonl | 訓練數據集路徑 |
| `--output` | ./output_lora_bug | 模型輸出目錄 |
| `--epochs` | 3 | 訓練輪數 |
| `--batch-size` | 2 | 批次大小 |
| `--learning-rate` | 3e-4 | 學習率 |
| `--lora-r` | 8 | LoRA 秩 (rank) |
| `--lora-alpha` | 16 | LoRA alpha 參數 |
| `--lora-dropout` | 0.05 | LoRA dropout |
| `--no-8bit` | False | 不使用 8-bit 量化 |

## 📈 測試結果示例

```
================================================================================
  📊 測試結果總結
================================================================================
測試樣本數: 66
✅ 正確數量: 61
❌ 錯誤數量: 5
準確率: 92.4%
平均相似度: 81.1%
平均推理時間: 29.67 秒

================================================================================
  📋 按漏洞類型分析
================================================================================
Arithmetic Overflow: 11/11 (100.0%)
Capability Leak: 11/11 (100.0%)
Cross-Module Pollution: 11/11 (100.0%)
Resource Leak: 9/11 (81.8%)
Unchecked Return: 11/11 (100.0%)
未發現明顯漏洞: 8/11 (72.7%)
================================================================================
```

## 📁 輸出文件

訓練和測試會生成以下文件：

```
output_lora_bug/
├── adapter_config.json          # LoRA 配置
├── adapter_model.safetensors    # LoRA 權重
├── tokenizer.json               # 分詞器
├── tokenizer_config.json        # 分詞器配置
├── training_stats.json          # 訓練統計
├── test_results.json            # 測試結果
└── cross_validation_results.json # 交叉驗證結果（如有）
```

### training_stats.json 格式
```json
{
  "train_time": 3600.50,
  "train_samples": 66,
  "num_epochs": 3,
  "final_loss": 0.7435,
  "model_path": "./output_lora_bug",
  "timestamp": "2025-10-13T15:00:00"
}
```

### test_results.json 格式
```json
{
  "test_time": "2025-10-13T16:00:00",
  "model_path": "./output_lora_bug",
  "summary": {
    "total_samples": 66,
    "correct_count": 61,
    "accuracy": 92.4,
    "avg_similarity": 81.1,
    "avg_time": 29.67,
    "total_time": 1958.46
  },
  "vulnerability_stats": {
    "Arithmetic Overflow": {"total": 11, "correct": 11},
    "Capability Leak": {"total": 11, "correct": 11},
    ...
  },
  "results": [...]
}
```

## 🔧 進階使用

### 1. 整合到 FastAPI 後端

```python
from fastapi import FastAPI, BackgroundTasks
from services.ml_training_service import MLTrainingService

app = FastAPI()
ml_service = MLTrainingService()

@app.post("/api/ml/train")
async def train_model(background_tasks: BackgroundTasks):
    """後台訓練模型"""
    background_tasks.add_task(ml_service.train_model)
    return {"status": "訓練已開始"}

@app.get("/api/ml/test")
async def test_model():
    """測試模型"""
    results = ml_service.test_model()
    return results['summary']
```

### 2. 使用自定義數據集

```python
# 載入自定義數據
custom_samples = [
    {
        "instruction": "...",
        "input": "...",
        "output": "..."
    },
    ...
]

# 測試自定義樣本
results = service.test_model(test_samples=custom_samples)
```

### 3. 模型推理

```python
from services.ml_training_service import MLTrainingService

service = MLTrainingService(output_dir="./output_lora_bug")

# 單個推理
output, time = service._inference(
    model=service.model,
    tokenizer=service.tokenizer,
    instruction="找出漏洞...",
    input_text="public fun withdraw(...)"
)
```

## 🐛 故障排除

### 問題：CUDA 記憶體不足
**解決方案**：
- 降低 `batch_size`
- 使用 8-bit 量化：不加 `--no-8bit` 標誌
- 使用更小的模型（如 TinyLlama-1.1B）

### 問題：訓練速度慢
**解決方案**：
- 減少 `epochs` 數量
- 增大 `batch_size`（如果記憶體允許）
- 使用更小的 `lora_r` 值

### 問題：準確率低
**解決方案**：
- 增加訓練數據量
- 增加 `epochs` 數量
- 調整 `learning_rate`
- 使用更強大的基礎模型

## 📚 相關文件

- `services/ml_training_service.py` - 核心訓練服務
- `ml_cli.py` - 命令行界面
- `services/risk_engine.py` - 風險評估引擎（使用訓練好的模型）
- `contract_bug_dataset.jsonl` - 訓練數據集

## 🎓 最佳實踐

1. **數據準備**：
   - 確保數據集平衡（每種類型樣本數量相近）
   - 使用高質量的標註數據
   - 定期更新數據集

2. **訓練策略**：
   - 先用小數據集快速驗證
   - 使用交叉驗證評估模型穩定性
   - 保存訓練日誌以便追蹤

3. **部署建議**：
   - 在生產環境使用經過充分測試的模型
   - 定期監控模型性能
   - 建立模型版本管理

## 📞 支持

如有問題，請聯繫開發團隊或提交 Issue。
