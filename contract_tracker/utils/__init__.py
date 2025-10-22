"""
通用工具函數
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RateLimiter:
    """API請求速率限制器"""
    
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    async def acquire(self):
        """取得請求許可"""
        now = datetime.utcnow()
        
        # 清理過期的請求記錄
        cutoff = now - timedelta(seconds=self.time_window)
        self.requests = [req_time for req_time in self.requests if req_time > cutoff]
        
        # 檢查是否超過限制
        if len(self.requests) >= self.max_requests:
            sleep_time = (self.requests[0] + timedelta(seconds=self.time_window) - now).total_seconds()
            if sleep_time > 0:
                logger.warning(f"達到速率限制，等待 {sleep_time:.1f} 秒")
                await asyncio.sleep(sleep_time)
        
        # 記錄請求時間
        self.requests.append(now)

def format_sui_address(address: str) -> str:
    """格式化Sui地址"""
    if not address:
        return ""
    
    # 確保地址以0x開頭
    if not address.startswith("0x"):
        address = "0x" + address
    
    # 補齊到64字符（不包括0x前綴）
    if len(address) < 66:  # 2 + 64
        address = "0x" + address[2:].zfill(64)
    
    return address

def truncate_address(address: str, start: int = 6, end: int = 4) -> str:
    """截斷地址顯示"""
    if len(address) <= start + end:
        return address
    return f"{address[:start]}...{address[-end:]}"

def safe_get(data: Dict, keys: str, default: Any = None) -> Any:
    """安全取得嵌套字典值"""
    try:
        for key in keys.split('.'):
            if isinstance(data, dict):
                data = data.get(key, {})
            else:
                return default
        return data if data != {} else default
    except Exception:
        return default

async def retry_async(func, max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """異步重試裝飾器"""
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            wait_time = delay * (backoff ** attempt)
            logger.warning(f"第 {attempt + 1} 次嘗試失敗，{wait_time:.1f}秒後重試: {e}")
            await asyncio.sleep(wait_time)

def validate_package_id(package_id: str) -> bool:
    """驗證Sui Package ID格式"""
    if not package_id:
        return False
    
    # 移除0x前綴
    if package_id.startswith("0x"):
        package_id = package_id[2:]
    
    # 檢查長度和字符
    if len(package_id) != 64:
        return False
    
    try:
        int(package_id, 16)
        return True
    except ValueError:
        return False

class CircuitBreaker:
    """熔斷器模式實現"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func):
        """使用熔斷器調用函數"""
        if self.state == "OPEN":
            if self._should_attempt_reset():
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """判斷是否應該嘗試重置"""
        if self.last_failure_time is None:
            return True
        return (datetime.utcnow() - self.last_failure_time).total_seconds() > self.recovery_timeout
    
    def _on_success(self):
        """成功調用時的處理"""
        self.failure_count = 0
        self.state = "CLOSED"
    
    def _on_failure(self):
        """失敗調用時的處理"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"