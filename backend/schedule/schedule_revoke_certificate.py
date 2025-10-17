"""
自動撤銷過期證書的定時任務
每天凌晨 2 點執行，查詢所有過期證書並銷毀
"""
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from pysui import SuiConfig, AsyncClient
from pysui.sui.sui_txn import SyncTransaction
from pysui.sui.sui_types.scalars import ObjectID, SuiString
import logging

# 載入環境變數
load_dotenv()

# 設置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置常量
ADMIN_PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY")  # 管理員錢包私鑰
ADMIN_CAP_ID = os.getenv("ADMIN_CAP_ID")  # AdminCap 物件 ID
PACKAGE_ID = os.getenv("CERTIFICATE_PACKAGE_ID")  # 合約包 ID
MODULE_NAME = "certificate"
CLOCK_ID = "0x6"  # Sui 系統時鐘


class CertificateRevoker:
    """證書撤銷器"""
    
    def __init__(self):
        # 使用環境變量配置，不依賴本地 Sui 配置文件
        from pysui.sui.sui_clients.common import handle_result
        from pysui.sui.sui_config import SuiConfig
        
        # 創建自定義配置
        self.config = SuiConfig.user_config(
            rpc_url=os.getenv("SUI_RPC_URL", "https://fullnode.testnet.sui.io:443")
        )
        self.client = AsyncClient(self.config)
        self.admin_cap_id = ADMIN_CAP_ID
        self.package_id = PACKAGE_ID
        
    async def get_expired_certificates(self) -> list:
        """
        查詢所有已過期的證書
        
        Returns:
            list: 過期證書的 Object ID 列表
        """
        try:
            # 由於 pysui 0.92.0 API 限制，目前暫時返回空列表
            # 實際使用時需要通過 Sui RPC JSON-RPC 直接查詢
            # 或者維護一個證書ID的資料庫
            logger.info("開始查詢過期證書...")
            
            # TODO: 實現實際的查詢邏輯
            # 方案1: 使用 Sui GraphQL API
            # 方案2: 維護證書ID資料庫
            # 方案3: 使用 httpx 直接調用 sui_getOwnedObjects RPC
            
            expired_certs = []
            logger.info(f"共找到 {len(expired_certs)} 個過期證書")
            return expired_certs
            
        except Exception as e:
            logger.error(f"查詢過期證書時發生錯誤: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    async def burn_certificate(self, certificate_id: str) -> bool:
        """
        銷毀單個證書
        
        Args:
            certificate_id: 證書物件 ID
            
        Returns:
            bool: 是否成功銷毀
        """
        try:
            # 構建交易
            txn = SyncTransaction(
                client=self.client,
                initial_sender=self.config.active_address
            )
            
            # 調用 burn_expired_certificate 函數
            txn.move_call(
                target=f"{self.package_id}::{MODULE_NAME}::burn_expired_certificate",
                arguments=[
                    ObjectID(self.admin_cap_id),  # admin: &AdminCap
                    ObjectID(certificate_id),      # cert: SecurityCertificate
                    ObjectID(CLOCK_ID),            # clock: &Clock
                ],
                type_arguments=[]
            )
            
            # 簽名並執行交易
            result = await txn.execute(
                gas_budget="10000000"  # 0.01 SUI
            )
            
            if result.is_ok():
                logger.info(f"成功銷毀證書: {certificate_id}")
                logger.info(f"交易摘要: {result.result_string}")
                return True
            else:
                logger.error(f"銷毀證書失敗: {certificate_id}, 錯誤: {result.result_string}")
                return False
                
        except Exception as e:
            logger.error(f"銷毀證書時發生錯誤 {certificate_id}: {e}")
            return False
    
    async def revoke_expired_certificates(self):
        """
        主任務：撤銷所有過期證書
        """
        logger.info("=== 開始執行過期證書撤銷任務 ===")
        start_time = datetime.now()
        
        # 檢查環境變數
        if not ADMIN_PRIVATE_KEY:
            logger.error("未設置 ADMIN_PRIVATE_KEY 環境變數")
            return
        
        if not ADMIN_CAP_ID:
            logger.error("未設置 ADMIN_CAP_ID 環境變數")
            return
            
        if not PACKAGE_ID:
            logger.error("未設置 CERTIFICATE_PACKAGE_ID 環境變數")
            return
        
        try:
            # 獲取過期證書
            expired_certs = await self.get_expired_certificates()
            
            if not expired_certs:
                logger.info("沒有需要撤銷的過期證書")
                return
            
            # 逐個銷毀證書
            success_count = 0
            fail_count = 0
            
            for cert in expired_certs:
                success = await self.burn_certificate(cert["object_id"])
                if success:
                    success_count += 1
                else:
                    fail_count += 1
                
                # 避免請求過快，間隔 1 秒
                await asyncio.sleep(1)
            
            # 統計結果
            elapsed_time = (datetime.now() - start_time).total_seconds()
            logger.info(
                f"=== 任務完成 ===\n"
                f"總計處理: {len(expired_certs)} 個證書\n"
                f"成功銷毀: {success_count} 個\n"
                f"失敗: {fail_count} 個\n"
                f"耗時: {elapsed_time:.2f} 秒"
            )
            
        except Exception as e:
            logger.error(f"執行撤銷任務時發生錯誤: {e}")
        finally:
            logger.info("=== 任務結束 ===")


# 全局實例
revoker = CertificateRevoker()


async def scheduled_revoke_task():
    """定時任務包裝函數"""
    await revoker.revoke_expired_certificates()


def start_scheduler():
    """
    啟動定時任務調度器
    每天凌晨 2 點執行
    """
    scheduler = AsyncIOScheduler()
    
    # 添加定時任務：每天凌晨 2 點執行
    scheduler.add_job(
        scheduled_revoke_task,
        trigger=CronTrigger(hour=2, minute=0),
        id='revoke_expired_certificates',
        name='撤銷過期證書',
        replace_existing=True
    )
    
    # 添加啟動時立即執行一次（測試用）
    # scheduler.add_job(
    #     scheduled_revoke_task,
    #     'date',
    #     run_date=datetime.now(),
    #     id='revoke_expired_certificates_startup',
    #     name='啟動時撤銷過期證書'
    # )
    
    logger.info("定時任務調度器已啟動")
    logger.info("每天凌晨 2:00 將自動撤銷過期證書")
    
    scheduler.start()
    return scheduler


if __name__ == "__main__":
    """
    獨立運行模式
    用於測試：python -m backend.schedule.schedule_revoke_certificate
    """
    import sys
    
    # 檢查是否為測試模式
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        logger.info("=== 測試模式：立即執行一次撤銷任務 ===")
        asyncio.run(scheduled_revoke_task())
    else:
        # 正常啟動調度器
        scheduler = start_scheduler()
        
        try:
            # 保持程序運行
            asyncio.get_event_loop().run_forever()
        except (KeyboardInterrupt, SystemExit):
            logger.info("收到停止信號，關閉調度器...")
            scheduler.shutdown()
