"""
API 限流中間件
防止並發請求導致 ML 模型重複載入和記憶體溢出
使用隊列機制確保同時只處理有限數量的 ML 分析請求
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import asyncio
from datetime import datetime
import logging
from typing import Dict, Optional
from collections import deque
import time

logger = logging.getLogger(__name__)


class MLRequestQueue:
    """ML 請求隊列管理器 - 單例模式"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, max_concurrent: int = 1, max_queue_size: int = 10):
        """
        初始化隊列管理器
        
        Args:
            max_concurrent: 最大並發處理數
            max_queue_size: 最大隊列長度
        """
        # 防止重複初始化
        if self._initialized:
            return
            
        self.max_concurrent = max_concurrent
        self.max_queue_size = max_queue_size
        self.active_requests = 0
        self.queue = deque()
        self.lock = asyncio.Lock()
        self.stats = {
            "total_requests": 0,
            "completed_requests": 0,
            "rejected_requests": 0,
            "current_queue_size": 0,
            "max_queue_reached": 0
        }
        self._initialized = True
        logger.info(f"✅ ML 請求隊列初始化: max_concurrent={max_concurrent}, max_queue_size={max_queue_size}")
    
    async def acquire(self, request_id: str) -> bool:
        """
        請求獲取處理槽位
        
        Returns:
            bool: True 表示獲得處理權，False 表示被拒絕
        """
        async with self.lock:
            self.stats["total_requests"] += 1
            
            # 檢查是否可以立即處理
            if self.active_requests < self.max_concurrent:
                self.active_requests += 1
                logger.info(f"🟢 請求 {request_id} 立即執行 (活躍: {self.active_requests}/{self.max_concurrent})")
                return True
            
            # 檢查隊列是否已滿
            if len(self.queue) >= self.max_queue_size:
                self.stats["rejected_requests"] += 1
                self.stats["max_queue_reached"] += 1
                logger.warning(f"🔴 請求 {request_id} 被拒絕 - 隊列已滿 ({len(self.queue)}/{self.max_queue_size})")
                return False
            
            # 加入隊列
            self.queue.append({
                "request_id": request_id,
                "timestamp": time.time()
            })
            self.stats["current_queue_size"] = len(self.queue)
            logger.info(f"🟡 請求 {request_id} 加入隊列 (隊列長度: {len(self.queue)}/{self.max_queue_size})")
        
        # 等待處理槽位
        while True:
            async with self.lock:
                if self.active_requests < self.max_concurrent:
                    # 檢查是否輪到此請求
                    if self.queue and self.queue[0]["request_id"] == request_id:
                        self.queue.popleft()
                        self.active_requests += 1
                        self.stats["current_queue_size"] = len(self.queue)
                        logger.info(f"🟢 請求 {request_id} 開始執行 (活躍: {self.active_requests}/{self.max_concurrent})")
                        return True
            
            # 等待一段時間再檢查
            await asyncio.sleep(0.5)
    
    async def release(self, request_id: str):
        """釋放處理槽位"""
        async with self.lock:
            if self.active_requests > 0:
                self.active_requests -= 1
                self.stats["completed_requests"] += 1
                logger.info(f"✅ 請求 {request_id} 完成釋放 (活躍: {self.active_requests}/{self.max_concurrent})")
    
    def get_stats(self) -> Dict:
        """獲取隊列統計信息"""
        return {
            **self.stats,
            "active_requests": self.active_requests,
            "queue_length": len(self.queue),
            "max_concurrent": self.max_concurrent,
            "max_queue_size": self.max_queue_size
        }


class RateLimitMiddleware(BaseHTTPMiddleware):
    """API 限流中間件"""
    
    def __init__(
        self, 
        app, 
        ml_endpoints: list = None,
        max_concurrent_ml: int = 1,
        max_queue_size: int = 10,
        request_timeout: int = 60
    ):
        """
        初始化限流中間件
        
        Args:
            app: FastAPI 應用
            ml_endpoints: 需要限流的 ML 端點列表
            max_concurrent_ml: ML 請求最大並發數
            max_queue_size: 最大隊列長度
            request_timeout: 請求超時時間（秒）
        """
        super().__init__(app)
        self.ml_endpoints = ml_endpoints or [
            "/api/real-time-analyze",
            "/api/analyze-connection",
            "/api/request-certificate",
            "/analyze-contract"
        ]
        self.request_timeout = request_timeout
        self.queue_manager = MLRequestQueue(
            max_concurrent=max_concurrent_ml,
            max_queue_size=max_queue_size
        )
        logger.info(f"✅ 限流中間件初始化: ML 端點={len(self.ml_endpoints)}")
    
    async def dispatch(self, request: Request, call_next):
        """處理請求"""
        path = request.url.path
        
        # 檢查是否為需要限流的端點
        is_ml_endpoint = any(endpoint in path for endpoint in self.ml_endpoints)
        
        if not is_ml_endpoint:
            # 非 ML 端點，直接放行
            return await call_next(request)
        
        # ML 端點，需要排隊
        request_id = f"{datetime.now().timestamp()}_{id(request)}"
        
        try:
            # 嘗試獲取處理權
            acquired = await asyncio.wait_for(
                self.queue_manager.acquire(request_id),
                timeout=self.request_timeout
            )
            
            if not acquired:
                # 隊列已滿，拒絕請求
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Too Many Requests",
                        "message": "ML 分析服務繁忙，請稍後再試",
                        "queue_stats": self.queue_manager.get_stats(),
                        "retry_after": 10
                    }
                )
            
            # 執行請求
            try:
                response = await call_next(request)
                return response
            finally:
                # 釋放槽位
                await self.queue_manager.release(request_id)
                
        except asyncio.TimeoutError:
            # 超時
            logger.warning(f"⏱️ 請求 {request_id} 超時")
            return JSONResponse(
                status_code=408,
                content={
                    "error": "Request Timeout",
                    "message": "請求超時，請稍後再試",
                    "timeout": self.request_timeout
                }
            )
        except Exception as e:
            logger.error(f"❌ 限流中間件錯誤: {e}")
            # 確保釋放槽位
            await self.queue_manager.release(request_id)
            raise


class SimpleRateLimiter:
    """簡單的速率限制器（基於 IP 的請求頻率限制）"""
    
    def __init__(self, requests_per_minute: int = 30):
        """
        初始化速率限制器
        
        Args:
            requests_per_minute: 每分鐘最大請求數
        """
        self.requests_per_minute = requests_per_minute
        self.request_history: Dict[str, deque] = {}
        self.lock = asyncio.Lock()
    
    async def is_allowed(self, client_ip: str) -> bool:
        """
        檢查是否允許請求
        
        Args:
            client_ip: 客戶端 IP
            
        Returns:
            bool: True 表示允許，False 表示超過限制
        """
        async with self.lock:
            now = time.time()
            
            # 初始化 IP 的請求歷史
            if client_ip not in self.request_history:
                self.request_history[client_ip] = deque()
            
            # 移除 1 分鐘前的請求記錄
            history = self.request_history[client_ip]
            while history and history[0] < now - 60:
                history.popleft()
            
            # 檢查是否超過限制
            if len(history) >= self.requests_per_minute:
                return False
            
            # 記錄新請求
            history.append(now)
            return True
    
    def get_stats(self, client_ip: str) -> Dict:
        """獲取 IP 的統計信息"""
        if client_ip not in self.request_history:
            return {
                "requests_in_last_minute": 0,
                "limit": self.requests_per_minute,
                "remaining": self.requests_per_minute
            }
        
        now = time.time()
        history = self.request_history[client_ip]
        recent_requests = sum(1 for t in history if t > now - 60)
        
        return {
            "requests_in_last_minute": recent_requests,
            "limit": self.requests_per_minute,
            "remaining": max(0, self.requests_per_minute - recent_requests)
        }
