"""
數據模型定義
"""
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class ProtocolType(Enum):
    BUCKET = "bucket"
    SCALLOP = "scallop" 
    NAVI = "navi"
    UNKNOWN = "unknown"

class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM" 
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@dataclass
class ContractEvent:
    """合約事件模型"""
    package_id: str
    protocol: ProtocolType
    deployer: str
    timestamp: datetime
    transaction_digest: str
    block_height: Optional[int] = None
    gas_used: Optional[int] = None
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['protocol'] = self.protocol.value
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass 
class RiskAnalysis:
    """風險分析結果"""
    package_id: str
    risk_level: RiskLevel
    risk_score: float  # 0-1
    confidence: float  # 0-1
    reasons: List[str]
    recommendation: str
    ml_analysis: Optional[Dict] = None
    analysis_time: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['risk_level'] = self.risk_level.value
        if self.analysis_time:
            data['analysis_time'] = self.analysis_time.isoformat()
        return data