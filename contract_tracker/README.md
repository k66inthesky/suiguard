# SuiAudit Package Monitor

🔍 **即時監控 Sui 網路上的 DeFi 協議合約部署**

## 功能特色

### 📦 Package Monitor 功能
- **實時監控**: 自動掃描 Sui 網路上的新合約部署
- **協議識別**: 智能識別 Bucket、Scallop、Navi 等 DeFi 協議
- **風險分析**: 使用 ML 模型分析合約安全性
- **Discord 通知**: 即時發送合約檢測和風險分析結果到 Discord

### 🛡️ 安全分析
- **ML 驅動**: 基於 Mistral-7B + LoRA 的智能風險評估
- **多層檢測**: 結合規則引擎和機器學習模型
- **實時評分**: 0-100 分的風險評分系統
- **詳細報告**: 漏洞詳情、安全建議、信心度評估

## 快速開始

### 1. 環境準備
```bash
cd /home/k66/suiguard/backend
source venv/bin/activate
```

### 2. 配置環境變數
編輯 `backend/.env` 文件，設置 Discord Webhook URLs：
```properties
# Discord 通知配置
DISCORD_WEBHOOK_BUCKET=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_SCALLOP=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_NAVI=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_GENERAL=https://discord.com/api/webhooks/...
```

### 3. 啟動後端服務
```bash
cd backend
source venv/bin/activate
nohup python main.py > backend.log 2>&1 &
```

### 4. 運行 Package Monitor
```bash
cd contract_tracker
source ../backend/venv/bin/activate
python main.py
```

### 5. 測試功能
```bash
source backend/venv/bin/activate
python test_package_monitor.py
```

## 架構設計

### 核心模組
```
contract_tracker/
├── models/           # 數據模型
│   ├── contract_event.py    # 合約事件
│   └── risk_report.py       # 風險報告
├── services/         # 核心服務
│   ├── sui_scanner.py       # Sui 網路掃描器
│   ├── discord_notifier.py  # Discord 通知服務
│   ├── risk_analyzer.py     # 風險分析器
│   └── protocol_tracker.py  # 協議追蹤器
├── protocols/        # 協議檢測器
│   ├── bucket_detector.py   # Bucket 協議
│   ├── scallop_detector.py  # Scallop 協議
│   └── navi_detector.py     # Navi 協議
└── utils/           # 工具函數
```

### 工作流程
1. **掃描階段**: SUI 網路掃描器監控新的 package 部署
2. **識別階段**: 協議檢測器識別合約屬於哪個 DeFi 協議
3. **分析階段**: 風險分析器調用後端 ML 模型進行安全評估
4. **通知階段**: Discord 通知服務發送結果到相應頻道

### Discord 通知格式
- **合約檢測通知**: 包含 Package ID、部署者、協議類型、Gas 使用等
- **風險分析報告**: 包含風險等級、分數、漏洞列表、安全建議等
- **顏色編碼**: 綠色(低風險)、黃色(中風險)、橙色(高風險)、紅色(嚴重風險)

## 配置說明

### 監控設定
```properties
SCAN_INTERVAL=600          # 掃描間隔（秒）
BATCH_SIZE=50              # 批次處理大小
MAX_BLOCKS_TO_SCAN=100     # 最大掃描區塊數
```

### 風險分析
```properties
ML_ENABLED=true            # 啟用 ML 分析
ML_TIMEOUT=30             # ML 分析超時（秒）
```

### Sui 網路
```properties
SUI_RPC_PUBLIC_URL=https://fullnode.testnet.sui.io:443
```

## 協議檢測邏輯

### Bucket Protocol
- 關鍵字: `bucket`, `collateral`
- 模組模式: `bucket.*`, `lending.*`, `borrow.*`, `collateral.*`

### Scallop Protocol  
- 關鍵字: `scallop`, `spool`
- 模組模式: `scallop.*`, `spool.*`, `lending.*`, `market.*`

### Navi Protocol
- 關鍵字: `navi`, `navigation`, `vault`
- 模組模式: `navi.*`, `navigation.*`, `lending.*`, `vault.*`

## 狀態監控

### 運行狀態
- 檢查後端服務: `curl http://localhost:8080/`
- 查看日誌: `tail -f backend/backend.log`
- 監控統計: 通過 ProtocolTracker.get_stats() 獲取

### 故障排除
1. **Sui RPC 連接失敗**: 檢查網路連接和 RPC URL
2. **Discord 通知失敗**: 驗證 Webhook URLs 配置
3. **協議檢測錯誤**: 檢查模組名稱模式和關鍵字
4. **風險分析失敗**: 確認後端服務運行並檢查 ML 模型

## 性能優化

### 建議設置
- **開發環境**: SCAN_INTERVAL=60 (快速測試)
- **生產環境**: SCAN_INTERVAL=600 (降低負載)
- **高頻監控**: SCAN_INTERVAL=300 (平衡性能和即時性)

### 資源使用
- **內存**: 約 200-500MB (包含 ML 模型)
- **網路**: 每次掃描約 1-5MB 數據傳輸
- **磁盤**: 日誌文件隨時間增長

## 安全注意事項

⚠️ **重要提醒**:
1. Discord Webhook URLs 包含敏感信息，不要提交到版本控制
2. 定期輪換 Webhook URLs
3. 監控異常流量和錯誤日誌
4. 設置適當的掃描間隔避免過載

## 開發指南

### 添加新協議
1. 在 `protocols/` 目錄創建新的檢測器
2. 繼承 `ProtocolDetector` 基類
3. 實現協議特有的檢測邏輯
4. 在主程式中註冊檢測器

### 自定義通知格式
1. 修改 `discord_notifier.py` 中的 embed 創建方法
2. 調整顏色、字段、格式等
3. 測試不同風險等級的通知效果

---

📝 **開發完成**: Package Monitor 功能已完成，支援實時監控、智能識別、風險分析和 Discord 通知。
⏰ **開發時間**: 約 3.5 小時 (符合 4 小時目標)
🎯 **下一步**: 可以開始開發第二個功能