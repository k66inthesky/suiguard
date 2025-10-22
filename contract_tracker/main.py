"""
Package Monitor 主程式
"""
import asyncio
import logging
import signal
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
sys.path.append(str(Path(__file__).parent.parent))

from contract_tracker.services.protocol_tracker import ProtocolTracker
from contract_tracker.config import Config

# 配置日誌
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Config.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class PackageMonitorApp:
    """Package Monitor 應用程式"""
    
    def __init__(self):
        self.tracker = None
        self.running = False
    
    async def start(self):
        """啟動監控"""
        logger.info("🚀 SuiAudit Package Monitor 啟動中...")
        
        try:
            async with ProtocolTracker() as tracker:
                self.tracker = tracker
                self.running = True
                
                # 設置信號處理
                for sig in [signal.SIGTERM, signal.SIGINT]:
                    signal.signal(sig, self.signal_handler)
                
                # 開始監控
                await tracker.start_monitoring()
                
        except KeyboardInterrupt:
            logger.info("收到中斷信號，正在停止...")
        except Exception as e:
            logger.error(f"監控過程發生錯誤: {e}")
        finally:
            await self.stop()
    
    def signal_handler(self, signum, frame):
        """信號處理器"""
        logger.info(f"收到信號 {signum}，正在停止監控...")
        self.running = False
        if self.tracker:
            asyncio.create_task(self.tracker.stop())
    
    async def stop(self):
        """停止監控"""
        self.running = False
        if self.tracker:
            await self.tracker.stop()
        logger.info("Package Monitor 已停止")

async def main():
    """主函數"""
    app = PackageMonitorApp()
    await app.start()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("應用程式已停止")
    except Exception as e:
        logger.error(f"應用程式發生錯誤: {e}")
        sys.exit(1)