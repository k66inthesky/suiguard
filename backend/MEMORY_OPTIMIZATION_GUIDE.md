# SuiGuard 專業架構 - 記憶體優化方案 C

## 🎯 方案概述

本方案採用**微服務架構**，將記憶體密集的 ML 模型服務與主 API 服務分離，實現：
- ✅ **記憶體隔離**：ML 服務獨立運行，避免 OOM 影響主服務
- ✅ **請求限流**：防止並發請求導致記憶體溢出
- ✅ **懶加載**：ML 模型僅在首次請求時載入，節省啟動記憶體
- ✅ **保留 LoRA**：完整保留你的 LoRA 微調模型
- ✅ **靈活配置**：可獨立啟用/禁用各個服務組件

---

## 📁 新增文件說明

### 1. **核心服務文件**

#### `ml_service.py` - 獨立 ML 服務
- **端口**：8081 (可配置)
- **功能**：智能合約漏洞檢測
- **特性**：
  - 懶加載 LoRA 模型（首次請求時載入）
  - 單例模式（全局共享模型實例）
  - 完整保留你的 LoRA 微調權重
  - 獨立的 API 文檔：`http://localhost:8081/docs`

#### `middleware/rate_limiter.py` - 限流中間件
- **功能**：API 請求限流和隊列管理
- **特性**：
  - 控制 ML 請求並發數（默認：1）
  - 隊列管理（默認最大 10 個等待請求）
  - 防止記憶體峰值

### 2. **啟動腳本**

#### `start_ml_service.sh` - ML 服務啟動腳本
```bash
chmod +x start_ml_service.sh
./start_ml_service.sh
```
- 自動檢查虛擬環境
- 檢查端口衝突
- 背景運行 ML 服務
- 生成 `ml_service.pid` 和 `ml_service.log`

#### `start_api_service.sh` - 主服務啟動腳本
```bash
chmod +x start_api_service.sh
./start_api_service.sh
```
- 自動檢查 ML 服務狀態
- 提示啟動缺失服務
- 背景運行主 API
- 生成 `api_service.pid` 和 `backend.log`

#### `stop_all_services.sh` - 停止所有服務
```bash
chmod +x stop_all_services.sh
./stop_all_services.sh
```
- 優雅停止所有服務
- 清理 PID 文件
- 檢查殘留進程

---

## ⚙️ 環境變數配置

在 `.env` 文件中添加以下配置：

```bash
# ============================================
# 🤖 ML Service Configuration (方案 C 專業架構)
# ============================================
# ML 服務配置
ENABLE_ML_SERVICE=true                    # 啟用 ML 服務
ML_SERVICE_URL=http://localhost:8081      # ML 服務地址
ML_SERVICE_PORT=8081                      # ML 服務端口
ML_SERVICE_TIMEOUT=30                     # ML 請求超時（秒）

# ML 請求隊列配置 (限流)
MAX_CONCURRENT_ML_REQUESTS=1              # 最大並發 ML 請求數
MAX_ML_QUEUE_SIZE=10                      # 最大隊列長度

# Package Monitor 配置
ENABLE_PACKAGE_MONITOR=false              # 是否啟用 Package Monitor

# LoRA 模型配置 (保留你的配置)
LORA_MODEL_PATH=./lora_models
BASE_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2
```

---

## 🚀 快速開始

### 方法 1：使用啟動腳本（推薦）

```bash
# 1. 進入 backend 目錄
cd /home/k66/suiguard/backend

# 2. 設置腳本執行權限
chmod +x start_ml_service.sh start_api_service.sh stop_all_services.sh

# 3. 啟動 ML 服務
./start_ml_service.sh

# 4. 啟動主 API 服務
./start_api_service.sh

# 5. 檢查服務狀態
curl http://localhost:8081/health     # ML 服務健康檢查
curl http://localhost:8080/           # 主 API 健康檢查
```

### 方法 2：手動啟動

```bash
# 1. 啟動虛擬環境
source venv/bin/activate

# 2. 啟動 ML 服務（端口 8081）
nohup python ml_service.py > ml_service.log 2>&1 &

# 3. 啟動主 API 服務（端口 8080）
nohup python main.py > backend.log 2>&1 &

# 4. 查看日誌
tail -f ml_service.log
tail -f backend.log
```

---

## 📊 服務架構

```
┌─────────────────────────────────────────────────┐
│         Chrome Extension / VS Code              │
│              (用戶請求)                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         主 API 服務 (main.py:8080)              │
│  • 輕量級端點 (健康檢查、版本查詢等)             │
│  • 限流中間件 (RateLimitMiddleware)             │
│  • Package Monitor (可選)                       │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP 調用
                 ▼
┌─────────────────────────────────────────────────┐
│        ML 服務 (ml_service.py:8081)             │
│  • LoRA 模型懶加載                               │
│  • 單例模式 (全局共享模型)                       │
│  • 漏洞分類分析                                  │
│  記憶體使用：~10-12 GB                           │
└─────────────────────────────────────────────────┘
```

---

## 🔧 配置選項

### 禁用 ML 服務（僅使用規則引擎）
```bash
# .env
ENABLE_ML_SERVICE=false
```
記憶體節省：~10-12 GB

### 禁用 Package Monitor
```bash
# .env
ENABLE_PACKAGE_MONITOR=false
```
記憶體節省：~1-2 GB

### 調整限流配置
```bash
# .env
MAX_CONCURRENT_ML_REQUESTS=2    # 增加並發數（需要更多記憶體）
MAX_ML_QUEUE_SIZE=20            # 增加隊列長度
```

---

## 📝 日誌管理

### 查看實時日誌
```bash
# ML 服務日誌
tail -f ml_service.log

# 主 API 日誌
tail -f backend.log

# 查看最後 50 行
tail -50 ml_service.log
tail -50 backend.log
```

### 日誌位置
- ML 服務：`/home/k66/suiguard/backend/ml_service.log`
- 主 API：`/home/k66/suiguard/backend/backend.log`
- PID 文件：`ml_service.pid`, `api_service.pid`

---

## 🛠️ 故障排除

### 1. ML 服務無法啟動
```bash
# 檢查端口是否被佔用
lsof -i :8081

# 查看錯誤日誌
tail -50 ml_service.log

# 手動停止並重啟
pkill -f "python.*ml_service.py"
./start_ml_service.sh
```

### 2. 主服務連接 ML 服務失敗
```bash
# 檢查 ML 服務是否運行
curl http://localhost:8081/health

# 檢查 .env 配置
grep ML_SERVICE .env

# 查看主服務日誌
tail -50 backend.log | grep "ML"
```

### 3. 記憶體仍然不足
```bash
# 檢查當前記憶體使用
free -h

# 查看進程記憶體
ps aux --sort=-%mem | head -10

# 禁用非必要服務
# 編輯 .env:
ENABLE_PACKAGE_MONITOR=false
ENABLE_ML_SERVICE=false  # 完全禁用 ML
```

### 4. 清理所有服務並重啟
```bash
# 停止所有服務
./stop_all_services.sh

# 清理日誌
rm -f *.log *.pid

# 重新啟動
./start_ml_service.sh
./start_api_service.sh
```

---

## 📊 記憶體使用預估

| 配置 | 主 API | ML 服務 | Package Monitor | 總計 |
|------|--------|---------|-----------------|------|
| **完整方案** | ~1 GB | ~10-12 GB | ~1-2 GB | **~13-15 GB** |
| **禁用 Monitor** | ~1 GB | ~10-12 GB | 0 GB | **~11-13 GB** |
| **僅規則引擎** | ~0.5 GB | 0 GB | 0 GB | **~0.5 GB** |

---

## 🎯 API 端點

### 主 API (端口 8080)
- `GET /` - 服務信息
- `POST /api/real-time-analyze` - 即時代碼分析 (使用 ML)
- `POST /api/analyze-connection` - 合約連接分析 (使用 ML)
- `POST /api/request-certificate` - NFT 證書請求 (使用 ML)
- `POST /api/analyze-versions` - 包版本分析
- `GET /health` - 健康檢查

### ML 服務 (端口 8081)
- `GET /` - 服務信息
- `POST /api/analyze-vulnerability` - 漏洞分析
- `GET /health` - 健康檢查
- `GET /stats` - 模型統計
- `POST /api/warmup` - 預熱模型
- `GET /docs` - API 文檔

---

## 🔍 監控和調試

### 檢查服務狀態
```bash
# 檢查所有運行的 Python 進程
ps aux | grep python

# 檢查端口佔用
lsof -i :8080    # 主 API
lsof -i :8081    # ML 服務

# 檢查記憶體使用
free -h
ps aux --sort=-%mem | grep python
```

### ML 服務統計
```bash
# 獲取模型統計信息
curl http://localhost:8081/stats
```

### 主服務限流統計
查看日誌中的限流信息：
```bash
tail -f backend.log | grep "限流\|queue\|活躍"
```

---

## ✅ 優化成果

相比原來的方案：
1. ✅ **記憶體隔離**：ML 模型獨立運行，OOM 不影響主服務
2. ✅ **靈活控制**：可單獨重啟 ML 服務而不影響主 API
3. ✅ **請求限流**：防止並發請求導致記憶體峰值
4. ✅ **懶加載**：ML 模型僅在需要時載入
5. ✅ **保留 LoRA**：完整保留你的微調模型

---

## 📞 需要幫助？

遇到問題請檢查：
1. 日誌文件：`ml_service.log`, `backend.log`
2. 環境變數配置：`.env`
3. 服務進程：`ps aux | grep python`
4. 記憶體使用：`free -h`

---

**祝你使用順利！🚀**
