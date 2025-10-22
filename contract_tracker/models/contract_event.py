"""
合約事件數據模型
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, List

@dataclass
class ContractEvent:
    """Sui網路合約部署事件"""
    package_id: str
    protocol: str  # bucket, scallop, navi
    deployer: str
    timestamp: datetime
    transaction_digest: str
    block_height: Optional[int] = None
    gas_used: Optional[int] = None
    modules: Optional[List[str]] = None
    event_type: str = "package_published"
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_sui_event(cls, event_data: Dict, protocol: str) -> 'ContractEvent':
        """從Sui事件數據創建實例"""
        return cls(
            package_id=event_data.get('packageId', ''),
            protocol=protocol,
            deployer=event_data.get('sender', ''),
            timestamp=datetime.fromtimestamp(event_data.get('timestampMs', 0) / 1000),
            transaction_digest=event_data.get('digest', ''),
            block_height=event_data.get('checkpoint'),
            gas_used=event_data.get('gasUsed'),
            modules=event_data.get('modules', [])
        )