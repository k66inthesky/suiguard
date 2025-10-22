"""
風險報告數據模型
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum

class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH" 
    CRITICAL = "CRITICAL"

@dataclass
class RiskReport:
    """風險分析報告"""
    package_id: str
    protocol: str
    risk_level: RiskLevel
    risk_score: float  # 0-100
    confidence: float  # 0-100
    
    # 風險細節
    vulnerabilities: List[str]
    security_issues: List[str]
    recommendations: List[str]
    
    # 分析資訊
    analysis_time: datetime
    analyzer_version: str = "v1.0"
    ml_analysis: Optional[Dict] = None
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['risk_level'] = self.risk_level.value
        data['analysis_time'] = self.analysis_time.isoformat()
        return data
    
    def get_severity_color(self) -> str:
        """取得風險等級對應的顏色(Discord embed)"""
        colors = {
            RiskLevel.LOW: 0x00ff00,      # 綠色
            RiskLevel.MEDIUM: 0xffff00,   # 黃色
            RiskLevel.HIGH: 0xff8000,     # 橙色
            RiskLevel.CRITICAL: 0xff0000   # 紅色
        }
        return colors.get(self.risk_level, 0x808080)
    
    def get_summary(self) -> str:
        """取得風險摘要"""
        return f"風險等級: {self.risk_level.value} | 分數: {self.risk_score:.1f} | 信心度: {self.confidence:.1f}%"