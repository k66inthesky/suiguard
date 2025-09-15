# SuiGuard Backend

A production-ready FastAPI backend for Sui wallet security analysis with DeepSeek-R1 ML integration.

## Features

- **Smart Contract Analysis**: Move code vulnerability detection
- **ML Integration**: DeepSeek-R1 powered classification
- **Risk Scoring**: 100-point probability-based risk assessment
- **Package Versioning**: Smart contract version tracking
- **Chrome Extension**: Ready for browser extension integration

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Configure your API keys in `.env`:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
SUI_RPC_PROVIDER_URL=your_sui_rpc_endpoint
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run server:

```bash
python main.py
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

The system uses DeepSeek-R1 to classify Move smart contracts into:

- `access_control` (80-100 points) - Permission vulnerabilities
- `logic_error` (50-79 points) - Logic flaws
- `randomness_error` (20-49 points) - Randomness issues
- `safe` (0-19 points) - No vulnerabilities detected

## Risk Assessment

Final risk scores combine:

- ML classification (60% weight when confident)
- Rule-based analysis (40% weight when ML confident)
- Confidence adjustments based on ML certainty

Risk levels:

- **HIGH** (≥70): Reject connection
- **MEDIUM** (40-69): Show warning
- **LOW** (<40): Approve connection

## Environment Variables

```bash
# Sui Network
SUI_RPC_PUBLIC_URL=https://fullnode.mainnet.sui.io:443
SUI_RPC_PROVIDER_URL=your_quicknode_endpoint

# DeepSeek ML
DEEPSEEK_API_KEY=your_api_key
ML_ENABLED=true
ML_TIMEOUT=30

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

_by SuiGuard Team_
