"""
協議識別器基礎類
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class ProtocolDetector(ABC):
    """協議檢測器基礎類"""
    
    @abstractmethod
    def get_protocol_name(self) -> str:
        """返回協議名稱"""
        pass
    
    @abstractmethod
    async def is_protocol_contract(self, package_id: str, modules: List[str], deployer: str) -> bool:
        """檢測是否為該協議的合約"""
        pass
    
    @abstractmethod
    def get_known_addresses(self) -> List[str]:
        """返回已知的協議地址"""
        pass
    
    @abstractmethod
    def get_module_patterns(self) -> List[str]:
        """返回模組名稱模式"""
        pass

class ProtocolRegistry:
    """協議註冊表"""
    
    def __init__(self):
        self.detectors: List[ProtocolDetector] = []
    
    def register(self, detector: ProtocolDetector):
        """註冊協議檢測器"""
        self.detectors.append(detector)
        logger.info(f"註冊協議檢測器: {detector.get_protocol_name()}")
    
    async def identify_protocol(self, package_id: str, modules: List[str] = None, deployer: str = None) -> str:
        """識別協議"""
        if modules is None:
            modules = []
        
        for detector in self.detectors:
            try:
                if await detector.is_protocol_contract(package_id, modules, deployer):
                    logger.info(f"識別為 {detector.get_protocol_name()} 協議: {package_id}")
                    return detector.get_protocol_name()
            except Exception as e:
                logger.error(f"協議檢測器 {detector.get_protocol_name()} 發生錯誤: {e}")
        
        return "unknown"