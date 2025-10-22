# Contract Tracker Configuration
"""
協議配置和 Discord Webhook 設定
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加載 backend 目錄下的 .env 文件
backend_env_path = Path(__file__).parent.parent / "backend" / ".env"
load_dotenv(backend_env_path)

class Config:
    # Discord Configuration
    DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
    
    # Discord 頻道 IDs
    DISCORD_CHANNEL_IDS = {
        "bucket": os.getenv("DISCORD_BUCKET_CHANNEL_ID", ""),
        "scallop": os.getenv("DISCORD_SCALLOP_CHANNEL_ID", ""),
        "navi": os.getenv("DISCORD_NAVI_CHANNEL_ID", ""),
        "health": os.getenv("DISCORD_HEALTH_CHANNEL_ID", "")
    }
    
    # Discord Webhook URLs
    DISCORD_WEBHOOKS = {
        "bucket": os.getenv("DISCORD_WEBHOOK_BUCKET", ""),
        "scallop": os.getenv("DISCORD_WEBHOOK_SCALLOP", ""), 
        "navi": os.getenv("DISCORD_WEBHOOK_NAVI", ""),
        "health": os.getenv("DISCORD_WEBHOOK_HEALTH", "")  # 統一通知頻道
    }

    # 後端API配置
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

    # 協議配置
    PROTOCOLS = {
        "bucket": {
            "name": "Bucket Protocol",
            "description": "流動性挖礦協議",
            "official_deployer": "0x...",  # Bucket 官方部署地址
            "risk_threshold": 0.7  # 高於此分數才通知
        },
        "scallop": {
            "name": "Scallop Protocol", 
            "description": "借貸協議",
            "official_deployer": "0x...",  # Scallop 官方部署地址
            "risk_threshold": 0.6
        },
        "navi": {
            "name": "Navi Protocol",
            "description": "DeFi 協議",
            "official_deployer": "0x...",  # Navi 官方部署地址
            "risk_threshold": 0.6
        }
    }

    # Sui RPC 設定
    SUI_RPC_URL = os.getenv("SUI_RPC_PUBLIC_URL", "https://fullnode.testnet.sui.io:443")
    SUI_WEBSOCKET_URL = os.getenv("SUI_WEBSOCKET_URL", "wss://fullnode.testnet.sui.io:443")

    # 掃描設定
    SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL", "30"))  # 30 秒
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", "20"))  # 每次掃描的交易數量
    MAX_BLOCKS_TO_SCAN = int(os.getenv("MAX_BLOCKS_TO_SCAN", "10"))  # 最多掃描區塊數

    # 風險分析設定
    ENABLE_ML_ANALYSIS = os.getenv("ML_ENABLED", "true").lower() == "true"
    RISK_ANALYSIS_TIMEOUT = int(os.getenv("ML_TIMEOUT", "30"))

    # 日誌設定
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "contract_tracker.log")