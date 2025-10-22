"""
協議追蹤器 - 整合掃描、分析和通知
"""
import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime
from ..models.contract_event import ContractEvent
from ..models.risk_report import RiskReport, RiskLevel
from .sui_scanner import SuiEventScanner
from .discord_notifier import DiscordNotifier
from .risk_analyzer import RiskAnalyzer

logger = logging.getLogger(__name__)

class ProtocolTracker:
    """協議追蹤器主服務"""
    
    def __init__(self):
        self.scanner = None
        self.notifier = None
        self.analyzer = None
        self.running = False
        self.stats = {
            "contracts_detected": 0,
            "high_risk_found": 0,
            "notifications_sent": 0,
            "start_time": None
        }
    
    async def __aenter__(self):
        self.scanner = SuiEventScanner()
        await self.scanner.__aenter__()
        
        self.notifier = DiscordNotifier()
        await self.notifier.__aenter__()
        
        self.analyzer = RiskAnalyzer()
        await self.analyzer.__aenter__()
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.scanner:
            await self.scanner.__aexit__(exc_type, exc_val, exc_tb)
        if self.notifier:
            await self.notifier.__aexit__(exc_type, exc_val, exc_tb)
        if self.analyzer:
            await self.analyzer.__aexit__(exc_type, exc_val, exc_tb)
    
    async def handle_contract_event(self, event: ContractEvent):
        """處理新的合約事件"""
        logger.info(f"處理新合約事件: {event.package_id} ({event.protocol})")
        
        try:
            # 更新統計
            self.stats["contracts_detected"] += 1
            
            # 1. 發送合約檢測通知
            await self.notifier.notify_contract_event(event)
            self.stats["notifications_sent"] += 1
            
            # 2. 進行風險分析
            logger.info(f"開始分析合約風險: {event.package_id}")
            risk_report = await self.analyzer.analyze_contract(event)
            
            # 3. 發送風險分析通知
            if risk_report:
                await self.notifier.notify_risk_analysis(event, risk_report)
                
                if risk_report.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                    self.stats["high_risk_found"] += 1
                    logger.warning(f"發現高風險合約: {event.package_id} - {risk_report.risk_level.value}")
            
            logger.info(f"合約事件處理完成: {event.package_id}")
            
        except Exception as e:
            logger.error(f"處理合約事件時發生錯誤: {e}")
            await self.notifier.notify_error(f"處理合約 {event.package_id} 時發生錯誤: {str(e)}")
    
    async def handle_contract_event_with_analysis(self, event: ContractEvent, analysis_result: dict):
        """處理包含完整風險分析的合約事件並發送 Discord 通知"""
        try:
            self.stats['contracts_detected'] += 1
            
            # 發送合約檢測通知
            await self.notifier.notify_contract_detected(
                protocol=event.protocol,
                package_id=event.package_id,
                deployer=event.deployer,
                transaction_digest=event.transaction_digest
            )
            
            # 發送風險分析通知
            await self.notifier.notify_risk_analysis(
                protocol=event.protocol,
                package_id=event.package_id,
                risk_level=analysis_result["risk_level"],
                risk_score=analysis_result["risk_score"],
                confidence=analysis_result["confidence"],
                vulnerabilities=analysis_result["vulnerabilities"],
                security_issues=analysis_result["security_issues"],
                recommendations=analysis_result["recommendations"],
                ml_analysis=analysis_result["ml_analysis"]
            )
            
            self.stats['notifications_sent'] += 2  # 檢測通知 + 風險分析通知
            
            # 更新高風險統計
            if analysis_result["risk_level"] in ["HIGH", "CRITICAL"]:
                self.stats["high_risk_found"] += 1
            
            logger.info(f"✅ 已處理 {event.protocol} 合約事件並發送完整風險分析通知")
            
        except Exception as e:
            logger.error(f"❌ 處理合約事件時發生錯誤: {e}")
            await self.notifier.notify_error(f"處理合約 {event.package_id} 時發生錯誤: {str(e)}", "health")
    
    async def start_monitoring(self):
        """開始監控"""
        if self.running:
            logger.warning("監控已在運行中")
            return
        
        self.running = True
        self.stats["start_time"] = datetime.utcnow()
        logger.info("啟動協議追蹤器...")
        
        try:
            # 發送啟動通知
            await self.notifier.notify_startup("SuiAudit Package Monitor 已啟動", "health")
            
            # 等待2秒後生成演示事件
            await asyncio.sleep(2)
            await self._generate_demo_events()
            
            # 開始掃描
            await self.scanner.start_monitoring(self.handle_contract_event)
            
        except Exception as e:
            logger.error(f"監控過程中發生錯誤: {e}")
            await self.notifier.notify_error(f"監控服務發生錯誤: {str(e)}")
        finally:
            self.running = False
    
    async def _generate_demo_events(self):
        """生成演示事件"""
        logger.info("生成演示事件...")
        
        # 演示事件數據 - 使用真實的Sui網路地址
        demo_contracts = [
            {
                "protocol": "bucket",
                "package_id": "0x155a2b4a924288070dc6cced78e6af9e244c654294a9863aa4b4544ccdedcb0f",
                "deployer": "0xce7c4460ee50d5c1bb1d7d5c1e4a3b9c3e9c6e7a2f1d3b5e8c4f7a1e3c6d9b2",
                "modules": ["bucket_lending", "bucket_core", "collateral_manager"],
                "risk_level": "HIGH",
                "risk_score": 78
            },
            {
                "protocol": "scallop", 
                "package_id": "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf",
                "deployer": "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf",
                "modules": ["scallop_protocol", "spool_manager", "lending_pool"],
                "risk_level": "MEDIUM",
                "risk_score": 55
            },
            {
                "protocol": "navi",
                "package_id": "0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b6bb6eebf73fa5bc4c81ca", 
                "deployer": "0x1e4f7a0d3e6b9c2f5a8e1b4d7c0a3f6e9b2d5c8f1a4b7e0c3d6f9a2e5b8c1",
                "modules": ["navi_protocol", "vault_manager", "lending_core"],
                "risk_level": "CRITICAL",
                "risk_score": 92
            }
        ]
        
        # 為每個協議生成演示事件
        for i, contract in enumerate(demo_contracts):
            await asyncio.sleep(3)  # 間隔3秒發送
            
            from ..models.contract_event import ContractEvent
            
            demo_event = ContractEvent(
                package_id=contract["package_id"],
                protocol=contract["protocol"],
                deployer=contract["deployer"],
                timestamp=datetime.utcnow(),
                transaction_digest=f"demo_tx_{int(datetime.utcnow().timestamp())}_{i}",
                modules=contract["modules"],
                gas_used=2000000 + i * 500000
            )
            
            logger.info(f"處理演示事件: {contract['protocol']} - {contract['package_id']}")
            
            # 發送合約檢測通知
            await self.notifier.notify_contract_detected(
                protocol=contract["protocol"],
                package_id=contract["package_id"],
                deployer=contract["deployer"],
                transaction_digest=demo_event.transaction_digest
            )
            
            # 等待 3 秒後發送風險分析通知
            await asyncio.sleep(3)
            
            # 模擬風險分析結果
            vulnerabilities = [
                "Potential reentrancy vulnerability in lending functions",
                "Insufficient access control on admin functions",
                "Flash loan attack vector detected"
            ]
            
            security_issues = [
                "Missing input validation on critical parameters",
                "Potential integer overflow in calculation functions"
            ]
            
            recommendations = [
                "Implement proper access control mechanisms",
                "Add reentrancy guards to sensitive functions",
                "Conduct thorough security audit before mainnet deployment"
            ]
            
            # 發送風險分析通知
            await self.notifier.notify_risk_analysis(
                protocol=contract["protocol"],
                package_id=contract["package_id"],
                risk_level=contract["risk_level"],
                risk_score=contract["risk_score"],
                confidence=85.5,
                vulnerabilities=vulnerabilities[:2] if contract["risk_level"] == "HIGH" else vulnerabilities[:1],
                security_issues=security_issues[:1] if contract["risk_level"] != "CRITICAL" else security_issues,
                recommendations=recommendations[:2],
                ml_analysis={
                    "analysis_method": "ml_analysis",
                    "model_version": "v1.0",
                    "processing_time": 2.5
                }
            )
            
            # 更新統計
            self.stats['contracts_detected'] += 1
            self.stats['notifications_sent'] += 2  # 檢測 + 風險分析
            if contract["risk_level"] in ["HIGH", "CRITICAL"]:
                self.stats['high_risk_found'] += 1
    
    def get_stats(self) -> Dict:
        """取得統計資訊"""
        stats = self.stats.copy()
        if stats["start_time"]:
            runtime = datetime.utcnow() - stats["start_time"]
            stats["runtime_seconds"] = runtime.total_seconds()
        return stats
    
    async def stop(self):
        """停止監控"""
        self.running = False
        logger.info("協議追蹤器已停止")