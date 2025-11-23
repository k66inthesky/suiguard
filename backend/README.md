# SuiGuard Backend

A production-ready FastAPI backend for Sui wallet security analysis with custom LoRA fine-tuned vulnerability detection models.

## Features

- **Smart Contract Analysis**: Move code vulnerability detection
- **ML Integration**: Custom LoRA fine-tuned models (Mistral-7B) for vulnerability classification
- **Custom ML Training**: Train and test vulnerability detection models with LoRA fine-tuning
- **Risk Scoring**: 100-point probability-based risk assessment
- **Package Versioning**: Smart contract version tracking
- **Chrome Extension**: Ready for browser extension integration

## Directory Structure

```
backend/
├── lora_models/              # Trained LoRA models (92.4% accuracy)
│   ├── adapter_model.safetensors
│   ├── tokenizer.json
│   └── adapter_config.json
├── ml/                       # ML training and testing tools
│   ├── ml_cli.py            # Command-line interface
│   ├── examples.py          # Usage examples
│   └── contract_bug_dataset.jsonl  # Training dataset (66 samples)
├── services/
│   ├── ml_training_service.py   # ML training service
│   ├── risk_engine.py           # Risk assessment engine
│   └── ML_TRAINING_README.md    # ML training documentation
└── main.py                   # FastAPI server
```

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Configure your environment in `.env`:

```
SUI_RPC_PROVIDER_URL=your_sui_rpc_endpoint
LORA_MODEL_PATH=./lora_models
BASE_MODEL_NAME=mistralai/Mistral-7B-v0.1
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run server:

```bash
./stop_all_service.sh && ./start_ml_service.sh && ./start_api_service.sh
```

## API Endpoints

### Analyze Connection

```http
POST /api/analyze-connection
Content-Type: application/json

{
  "package_ids": ["0x123..."]
}
```

### Analyze Package Versions

```http
POST /api/analyze-versions
Content-Type: application/json

{
  "package_ids": ["0x123..."]
}
```

## ML Classification

The system uses custom LoRA fine-tuned models (Mistral-7B-v0.1) to classify Move smart contracts into:

- **Arithmetic Overflow** - 算術溢位漏洞
- **Unchecked Return** - 未檢查返回值漏洞
- **Resource Leak** - 資源洩漏漏洞
- **Cross-Module Pollution** - 跨模組污染漏洞
- **Capability Leak** - 權限洩漏漏洞
- **未發現明顯漏洞** - 安全代碼

Model Performance: **92.4% accuracy** on 66 test samples

## ML Training & Testing

Train and test custom vulnerability detection models:

```bash
# Train model
python ml/ml_cli.py --train --epochs 3

# Test model
python ml/ml_cli.py --test

# Cross-validation
python ml/ml_cli.py --cross-validate --folds 3

# View examples
python ml/examples.py 5
```

See `services/ML_TRAINING_README.md` for detailed documentation.

## Risk Assessment

Final risk scores combine:

- LoRA ML classification (primary detection)
- Rule-based analysis (supplementary checks)
- Confidence adjustments based on model certainty

Risk levels:

- **HIGH** (≥70): Reject connection
- **MEDIUM** (40-69): Show warning
- **LOW** (<40): Approve connection

## Environment Variables

```bash
# Sui Network
SUI_RPC_PUBLIC_URL=https://fullnode.mainnet.sui.io:443
SUI_RPC_PROVIDER_URL=your_quicknode_endpoint

# LoRA Model
LORA_MODEL_PATH=./lora_models
BASE_MODEL_NAME=mistralai/Mistral-7B-v0.1
DATASET_PATH=ml/contract_bug_dataset.jsonl

# ML System
ML_ENABLED=true
ML_TIMEOUT=30
ML_CONFIDENCE_THRESHOLD=0.3

# Chrome Extension
CHROME_EXTENSION_ID=your_extension_id
```

## Production Notes

- API docs disabled in production mode
- CORS restricted to Chrome extension origin
- Error responses sanitized for security
- Single worker mode to avoid concurrency issues

## Health Check

```http
GET /health
```

Returns service status and configuration validation.

---

_by SuiAudit Lab_
