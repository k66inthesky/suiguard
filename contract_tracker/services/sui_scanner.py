"""
Sui網路掃描器 - 監控合約部署事件
"""
import asyncio
import aiohttp
import logging
from typing import List, Dict, Optional, AsyncGenerator
from datetime import datetime, timedelta
from ..config import Config
from ..models.contract_event import ContractEvent

logger = logging.getLogger(__name__)

class SuiEventScanner:
    """Sui網路事件掃描器"""
    
    def __init__(self):
        self.rpc_url = Config.SUI_RPC_URL
        self.scan_interval = Config.SCAN_INTERVAL
        self.last_checkpoint = None
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()
    
    async def _make_rpc_call(self, method: str, params: List) -> Dict:
        """發送RPC請求到Sui節點"""
        if not self._session:
            raise RuntimeError("Session not initialized. Use async context manager.")
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        try:
            async with self._session.post(self.rpc_url, json=payload) as response:
                data = await response.json()
                if "error" in data:
                    logger.error(f"RPC錯誤: {data['error']}")
                    raise Exception(f"RPC錯誤: {data['error']}")
                return data.get("result", {})
        except Exception as e:
            logger.error(f"RPC請求失敗: {e}")
            raise
    
    async def get_latest_checkpoint(self) -> int:
        """取得最新的checkpoint"""
        result = await self._make_rpc_call("sui_getLatestCheckpointSequenceNumber", [])
        return int(result)
    
    async def get_events_in_checkpoint(self, checkpoint: int) -> List[Dict]:
        """取得指定checkpoint中的事件"""
        try:
            # 取得checkpoint中的交易
            result = await self._make_rpc_call("sui_getCheckpoint", [str(checkpoint)])
            transactions = result.get("transactions", [])
            
            events = []
            for tx_digest in transactions:
                tx_events = await self.get_transaction_events(tx_digest)
                events.extend(tx_events)
            
            return events
        except Exception as e:
            logger.error(f"取得checkpoint {checkpoint} 事件失敗: {e}")
            return []
    
    async def get_transaction_events(self, tx_digest: str) -> List[Dict]:
        """取得交易事件"""
        try:
            result = await self._make_rpc_call("sui_getTransactionBlock", [
                tx_digest,
                {
                    "showInput": True,
                    "showRawInput": False,
                    "showEffects": True,
                    "showEvents": True,
                    "showObjectChanges": True,
                    "showBalanceChanges": True
                }
            ])
            
            events = []
            # 檢查是否有包發布事件
            object_changes = result.get("objectChanges", [])
            for change in object_changes:
                if change.get("type") == "published":
                    events.append({
                        "type": "package_published",
                        "packageId": change.get("packageId"),
                        "digest": tx_digest,
                        "sender": result.get("transaction", {}).get("data", {}).get("sender"),
                        "timestampMs": result.get("timestampMs"),
                        "checkpoint": result.get("checkpoint"),
                        "gasUsed": result.get("effects", {}).get("gasUsed", {}).get("computationCost", 0),
                        "modules": change.get("modules", [])
                    })
            
            return events
        except Exception as e:
            logger.error(f"取得交易 {tx_digest} 事件失敗: {e}")
            return []
    
    async def scan_new_events(self) -> AsyncGenerator[ContractEvent, None]:
        """掃描新的合約部署事件"""
        current_checkpoint = await self.get_latest_checkpoint()
        
        if self.last_checkpoint is None:
            # 首次掃描，從當前checkpoint開始
            self.last_checkpoint = current_checkpoint
            logger.info(f"開始掃描，起始checkpoint: {current_checkpoint}")
            return
        
        # 掃描新的checkpoints
        for checkpoint in range(self.last_checkpoint + 1, current_checkpoint + 1):
            logger.info(f"掃描 checkpoint: {checkpoint}")
            events = await self.get_events_in_checkpoint(checkpoint)
            logger.info(f"Checkpoint {checkpoint} 找到 {len(events)} 個事件")
            
            for event in events:
                if event.get("type") == "package_published":
                    package_id = event.get("packageId")
                    modules = event.get("modules", [])
                    sender = event.get("sender")
                    
                    logger.info(f"檢測到包發布: {package_id}, 模組: {modules}, 部署者: {sender}")
                    
                    # 判斷協議類型
                    protocol = await self._identify_protocol(package_id, modules, sender)
                    logger.info(f"識別結果: {protocol}")
                    
                    if protocol != "unknown":
                        contract_event = ContractEvent.from_sui_event(event, protocol)
                        logger.info(f"生成協議事件: {protocol} - {package_id}")
                        yield contract_event
                    else:
                        logger.debug(f"未識別協議: {package_id}")
        
        self.last_checkpoint = current_checkpoint
    
    async def _identify_protocol(self, package_id: str, modules: List[str] = None, deployer: str = None) -> str:
        """識別合約屬於哪個協議"""
        logger.debug(f"開始識別協議: package_id={package_id}, modules={modules}, deployer={deployer}")
        
        # 導入協議檢測器
        from ..protocols import ProtocolRegistry
        from ..protocols.bucket_detector import BucketDetector
        from ..protocols.scallop_detector import ScallopDetector
        from ..protocols.navi_detector import NaviDetector
        
        # 創建協議註冊表
        registry = ProtocolRegistry()
        registry.register(BucketDetector())
        registry.register(ScallopDetector())
        registry.register(NaviDetector())
        
        # 識別協議
        detected_protocol = await registry.identify_protocol(package_id, modules or [], deployer)
        logger.info(f"協議識別結果: {detected_protocol} for package {package_id}")
        
        return detected_protocol
    
    async def start_monitoring(self, callback):
        """開始監控"""
        logger.info("開始監控Sui網路合約部署...")
        
        while True:
            try:
                async for event in self.scan_new_events():
                    await callback(event)
                
                await asyncio.sleep(self.scan_interval)
            except Exception as e:
                logger.error(f"監控過程發生錯誤: {e}")
                await asyncio.sleep(self.scan_interval)