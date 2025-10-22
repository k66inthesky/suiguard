"""
Discord通知服務
"""
import aiohttp
import logging
from typing import Dict, Optional
from datetime import datetime
from ..config import Config
from ..models.contract_event import ContractEvent
from ..models.risk_report import RiskReport, RiskLevel

logger = logging.getLogger(__name__)

class DiscordNotifier:
    """Discord Webhook通知服務"""
    
    def __init__(self):
        self.webhooks = Config.DISCORD_WEBHOOKS
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()
    
    async def send_webhook(self, webhook_url: str, payload: Dict) -> bool:
        """發送Discord webhook"""
        if not self._session:
            raise RuntimeError("Session not initialized. Use async context manager.")
        
        try:
            async with self._session.post(webhook_url, json=payload) as response:
                if response.status == 204:
                    logger.info("Discord通知發送成功")
                    return True
                else:
                    logger.error(f"Discord通知發送失敗: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"發送Discord通知時發生錯誤: {e}")
            return False
    
    def create_contract_event_embed(self, event: ContractEvent) -> Dict:
        """創建合約事件的Discord embed"""
        embed = {
            "title": f"🔍 新合約部署檢測 - {event.protocol.upper()}",
            "description": f"檢測到新的{event.protocol}協議合約部署",
            "color": 0x3498db,  # 藍色
            "timestamp": event.timestamp.isoformat(),
            "fields": [
                {
                    "name": "📦 Package ID",
                    "value": f"`{event.package_id}`",
                    "inline": False
                },
                {
                    "name": "👤 部署者",
                    "value": f"`{event.deployer}`",
                    "inline": True
                },
                {
                    "name": "🏷️ 協議",
                    "value": event.protocol.upper(),
                    "inline": True
                },
                {
                    "name": "⛽ Gas使用",
                    "value": f"{event.gas_used or 'N/A'}",
                    "inline": True
                },
                {
                    "name": "🔗 Transaction",
                    "value": f"[查看詳情](https://suiexplorer.com/txblock/{event.transaction_digest})",
                    "inline": False
                }
            ],
            "footer": {
                "text": "SuiAudit Package Monitor",
                "icon_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
            }
        }
        return embed
    
    def create_risk_report_embed(self, event: ContractEvent, report: RiskReport) -> Dict:
        """創建風險報告的Discord embed"""
        embed = {
            "title": f"⚠️ 風險分析報告 - {event.protocol.upper()}",
            "description": f"合約風險等級: **{report.risk_level.value}**",
            "color": report.get_severity_color(),
            "timestamp": report.analysis_time.isoformat(),
            "fields": [
                {
                    "name": "📦 Package ID",
                    "value": f"`{event.package_id}`",
                    "inline": False
                },
                {
                    "name": "📊 風險分數",
                    "value": f"{report.risk_score:.1f}/100",
                    "inline": True
                },
                {
                    "name": "🎯 信心度",
                    "value": f"{report.confidence:.1f}%",
                    "inline": True
                },
                {
                    "name": "🏷️ 協議",
                    "value": event.protocol.upper(),
                    "inline": True
                }
            ],
            "footer": {
                "text": "SuiAudit AI Risk Analysis",
                "icon_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
            }
        }
        
        # 添加漏洞資訊
        if report.vulnerabilities:
            vulnerabilities_text = "\\n".join([f"• {vuln}" for vuln in report.vulnerabilities[:5]])
            if len(report.vulnerabilities) > 5:
                vulnerabilities_text += f"\\n...還有 {len(report.vulnerabilities) - 5} 個漏洞"
            embed["fields"].append({
                "name": "🚨 發現的漏洞",
                "value": vulnerabilities_text,
                "inline": False
            })
        
        # 添加建議
        if report.recommendations:
            recommendations_text = "\\n".join([f"• {rec}" for rec in report.recommendations[:3]])
            embed["fields"].append({
                "name": "💡 安全建議",
                "value": recommendations_text,
                "inline": False
            })
        
        return embed
    
    async def notify_contract_event(self, event: ContractEvent) -> bool:
        """通知新合約事件"""
        webhook_url = self.webhooks.get(event.protocol)
        if not webhook_url:
            logger.warning(f"未找到協議 {event.protocol} 的webhook URL")
            return False
        
        embed = self.create_contract_event_embed(event)
        payload = {
            "embeds": [embed],
            "username": "SuiAudit Monitor",
            "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
        }
        
        return await self.send_webhook(webhook_url, payload)
    
    async def notify_risk_analysis(self, event: ContractEvent, report: RiskReport) -> bool:
        """通知風險分析結果"""
        webhook_url = self.webhooks.get(event.protocol)
        if not webhook_url:
            logger.warning(f"未找到協議 {event.protocol} 的webhook URL")
            return False
        
        # 只有中高風險才發送通知
        if report.risk_level in [RiskLevel.LOW]:
            logger.info(f"風險等級為LOW，跳過通知")
            return True
        
        embed = self.create_risk_report_embed(event, report)
        payload = {
            "embeds": [embed],
            "username": "SuiAudit Risk Analyzer",
            "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
        }
        
        return await self.send_webhook(webhook_url, payload)
    
    async def notify_startup(self, message: str, protocol: str = "health") -> bool:
        """通知系統啟動訊息"""
        webhook_url = self.webhooks.get(protocol, list(self.webhooks.values())[0])
        
        embed = {
            "title": "🚀 系統啟動",
            "description": message,
            "color": 0x00ff00,  # 綠色
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "SuiAudit System Monitor",
                "icon_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
            }
        }
        
        payload = {
            "embeds": [embed],
            "username": "SuiAudit System",
            "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
        }
        
        return await self.send_webhook(webhook_url, payload)

    async def notify_error(self, error_message: str, protocol: str = "health") -> bool:
        """通知錯誤訊息"""
        webhook_url = self.webhooks.get(protocol, list(self.webhooks.values())[0])
        
        embed = {
            "title": "❌ 系統錯誤",
            "description": error_message,
            "color": 0xff0000,  # 紅色
            "timestamp": datetime.utcnow().isoformat(),
            "footer": {
                "text": "SuiAudit Error Monitor"
            }
        }
        
        payload = {
            "embeds": [embed],
            "username": "SuiAudit System",
            "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
        }
        
        return await self.send_webhook(webhook_url, payload)
    
    async def notify_contract_detected(self, protocol: str, package_id: str, deployer: str, transaction_digest: str) -> bool:
        """通知合約檢測 (新方法)"""
        webhook_url = self.webhooks.get(protocol)
        if not webhook_url:
            logger.warning(f"未找到協議 {protocol} 的webhook URL")
            return False
        
        embed = {
            "title": f"🔍 新合約檢測 - {protocol.upper()}",
            "description": f"檢測到新的{protocol}協議合約部署",
            "color": 0x3498db,  # 藍色
            "timestamp": datetime.utcnow().isoformat(),
            "fields": [
                {
                    "name": "📦 Package ID",
                    "value": f"`{package_id}`",
                    "inline": False
                },
                {
                    "name": "👤 部署者",
                    "value": f"`{deployer}`",
                    "inline": True
                },
                {
                    "name": "🏷️ 協議",
                    "value": protocol.upper(),
                    "inline": True
                },
                {
                    "name": "🔗 Transaction",
                    "value": f"[查看詳情](https://suiexplorer.com/txblock/{transaction_digest})",
                    "inline": False
                }
            ],
            "footer": {
                "text": "SuiAudit Package Monitor",
                "icon_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
            }
        }
        
        payload = {
            "embeds": [embed],
            "username": "SuiAudit Monitor",
            "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
        }
        
        return await self.send_webhook(webhook_url, payload)
    
    async def notify_risk_analysis(self, protocol: str, package_id: str, risk_level: str, 
                                 risk_score: int, confidence: float, vulnerabilities: list,
                                 security_issues: list, recommendations: list, ml_analysis: dict) -> bool:
        """發送風險分析報告到 Discord"""
        try:
            # 根據風險等級決定是否發送通知
            if risk_level == "LOW":
                logger.info(f"🟢 {protocol} 低風險合約，跳過通知: {package_id}")
                return True
            
            # 風險等級顏色映射
            color_map = {
                "MEDIUM": 0xFFA500,    # 橙色
                "HIGH": 0xFF4500,      # 紅橙色  
                "CRITICAL": 0xFF0000   # 紅色
            }
            
            # 風險等級圖標映射
            icon_map = {
                "MEDIUM": "⚠️",
                "HIGH": "🚨", 
                "CRITICAL": "🔴"
            }
            
            color = color_map.get(risk_level, 0xFFA500)
            icon = icon_map.get(risk_level, "⚠️")
            
            # 構建 embed 訊息
            embed = {
                "title": f"{icon} 風險分析報告 - {protocol.upper()}",
                "description": f"檢測到 {protocol} 協議合約的安全風險",
                "color": color,
                "timestamp": datetime.utcnow().isoformat(),
                "fields": [
                    {
                        "name": "🆔 Package ID", 
                        "value": f"`{package_id}`",
                        "inline": False
                    },
                    {
                        "name": "📊 風險評分",
                        "value": f"**{risk_score}/100** ({risk_level})",
                        "inline": True
                    },
                    {
                        "name": "🎯 置信度", 
                        "value": f"{confidence:.1f}%",
                        "inline": True
                    },
                    {
                        "name": "🤖 分析方法",
                        "value": ml_analysis.get("analysis_method", "rules_only").upper(),
                        "inline": True
                    }
                ],
                "footer": {
                    "text": f"SuiAudit Package Monitor • Model {ml_analysis.get('model_version', 'v1.0')}",
                    "icon_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
                }
            }
            
            # 添加漏洞信息
            if vulnerabilities:
                vulnerability_text = "\n".join([f"• {v}" for v in vulnerabilities[:3]])  # 最多顯示3個
                if len(vulnerabilities) > 3:
                    vulnerability_text += f"\n... 及其他 {len(vulnerabilities) - 3} 個漏洞"
                    
                embed["fields"].append({
                    "name": "🔍 發現的漏洞",
                    "value": vulnerability_text,
                    "inline": False
                })
            
            # 添加安全問題
            if security_issues:
                issues_text = "\n".join([f"• {issue}" for issue in security_issues[:2]])  # 最多顯示2個
                if len(security_issues) > 2:
                    issues_text += f"\n... 及其他 {len(security_issues) - 2} 個問題"
                    
                embed["fields"].append({
                    "name": "⚠️ 安全問題", 
                    "value": issues_text,
                    "inline": False
                })
            
            # 添加建議
            if recommendations:
                rec_text = "\n".join([f"• {rec}" for rec in recommendations[:2]])  # 最多顯示2個
                if len(recommendations) > 2:
                    rec_text += f"\n... 及其他 {len(recommendations) - 2} 個建議"
                    
                embed["fields"].append({
                    "name": "💡 安全建議",
                    "value": rec_text, 
                    "inline": False
                })
            
            # 發送到對應的協議頻道
            webhook_url = self.webhooks.get(protocol)
            if webhook_url:
                payload = {
                    "embeds": [embed],
                    "username": "SuiAudit Risk Analyzer",
                    "avatar_url": "https://raw.githubusercontent.com/k66inthesky/suiguard/main/extension/icons/logo128.png"
                }
                
                result = await self.send_webhook(webhook_url, payload)
                if result:
                    logger.info(f"✅ {protocol} 風險分析報告已發送到 Discord")
                return result
            else:
                logger.warning(f"⚠️ 未找到 {protocol} 協議的 webhook URL")
                return False
                
        except Exception as e:
            logger.error(f"❌ 發送風險分析報告失敗: {e}")
            return False