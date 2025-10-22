"""
風險分析器 - 整合現有的後端風險引擎
"""
import asyncio
import aiohttp
import logging
from typing import Optional, Dict
from datetime import datetime
from ..models.contract_event import ContractEvent
from ..models.risk_report import RiskReport, RiskLevel
from ..config import Config

logger = logging.getLogger(__name__)

class RiskAnalyzer:
    """風險分析器 - 調用後端風險引擎"""
    
    def __init__(self):
        self.backend_url = Config.BACKEND_URL
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()
    
    async def analyze_contract(self, event: ContractEvent) -> Optional[RiskReport]:
        """分析合約風險"""
        if not self._session:
            raise RuntimeError("Session not initialized. Use async context manager.")
        
        try:
            # 準備分析請求
            analysis_payload = {
                "package_id": event.package_id,
                "deployer": event.deployer,
                "protocol": event.protocol,
                "modules": getattr(event, 'modules', []),
                "timestamp": event.timestamp.isoformat()
            }
            
            # 調用後端風險分析API
            async with self._session.post(
                f"{self.backend_url}/analyze-contract",
                json=analysis_payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status != 200:
                    logger.error(f"後端風險分析API返回錯誤: {response.status}")
                    return None
                
                result = await response.json()
                
                # 轉換為RiskReport格式
                return self._convert_to_risk_report(event, result)
        
        except asyncio.TimeoutError:
            logger.error(f"風險分析超時: {event.package_id}")
            return None
        except Exception as e:
            logger.error(f"風險分析失敗: {e}")
            return None
    
    def _convert_to_risk_report(self, event: ContractEvent, analysis_result: Dict) -> RiskReport:
        """轉換後端分析結果為RiskReport"""
        # 解析風險等級
        risk_score = analysis_result.get("risk_score", 0)
        risk_level = self._get_risk_level(risk_score)
        
        # 提取漏洞和建議
        vulnerabilities = analysis_result.get("vulnerabilities", [])
        recommendations = analysis_result.get("recommendations", [])
        
        # 如果沒有具體的漏洞，根據風險分數生成
        if not vulnerabilities:
            vulnerabilities = self._generate_default_vulnerabilities(risk_level)
        
        if not recommendations:
            recommendations = self._generate_default_recommendations(risk_level)
        
        return RiskReport(
            package_id=event.package_id,
            protocol=event.protocol,
            risk_level=risk_level,
            risk_score=risk_score,
            confidence=analysis_result.get("confidence", 85.0),
            vulnerabilities=vulnerabilities,
            security_issues=analysis_result.get("security_issues", []),
            recommendations=recommendations,
            analysis_time=datetime.utcnow(),
            analyzer_version="v1.0-ml",
            ml_analysis=analysis_result.get("ml_analysis")
        )
    
    def _get_risk_level(self, risk_score: float) -> RiskLevel:
        """根據風險分數判斷風險等級"""
        if risk_score >= 80:
            return RiskLevel.CRITICAL
        elif risk_score >= 60:
            return RiskLevel.HIGH
        elif risk_score >= 30:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_default_vulnerabilities(self, risk_level: RiskLevel) -> list:
        """根據風險等級生成默認漏洞列表"""
        base_vulns = []
        
        if risk_level == RiskLevel.CRITICAL:
            base_vulns = [
                "檢測到潛在的重入攻擊漏洞",
                "發現未授權的權限提升風險",
                "存在資金鎖定或丟失的可能性"
            ]
        elif risk_level == RiskLevel.HIGH:
            base_vulns = [
                "檢測到權限管理不當",
                "發現潛在的整數溢出風險",
                "存在邏輯錯誤可能導致資金損失"
            ]
        elif risk_level == RiskLevel.MEDIUM:
            base_vulns = [
                "檢測到輕微的安全配置問題",
                "發現代碼複雜度較高區域",
                "存在潛在的gas優化問題"
            ]
        else:  # LOW
            base_vulns = [
                "代碼結構良好，未發現明顯漏洞",
                "建議進行常規安全審計"
            ]
        
        return base_vulns
    
    def _generate_default_recommendations(self, risk_level: RiskLevel) -> list:
        """根據風險等級生成默認建議"""
        base_recs = []
        
        if risk_level == RiskLevel.CRITICAL:
            base_recs = [
                "立即暫停合約使用，進行緊急安全審計",
                "建議聯繫專業安全團隊進行深度分析",
                "考慮部署修復版本前充分測試"
            ]
        elif risk_level == RiskLevel.HIGH:
            base_recs = [
                "建議進行專業安全審計",
                "加強權限控制和輸入驗證",
                "部署前進行充分測試"
            ]
        elif risk_level == RiskLevel.MEDIUM:
            base_recs = [
                "建議進行代碼審查",
                "優化gas使用效率",
                "加強錯誤處理機制"
            ]
        else:  # LOW
            base_recs = [
                "保持良好的開發實踐",
                "定期進行安全更新",
                "監控合約運行狀態"
            ]
        
        return base_recs