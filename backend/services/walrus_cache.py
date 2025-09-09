import json
import os
from typing import Optional, Dict
import aiohttp

class WalrusCache:
    def __init__(self):
        self.endpoint = os.getenv("WALRUS_ENDPOINT", "https://walrus-testnet.nodes.guru")
        
    async def get_cached_analysis(self, cache_key: str) -> Optional[Dict]:
        """從Walrus獲取快取的分析結果"""
        try:
            # 模擬Walrus API調用
            async with aiohttp.ClientSession() as session:
                url = f"{self.endpoint}/v1/get/{cache_key}"
                async with session.get(url, timeout=5) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data
        except Exception as e:
            print(f"Walrus快取獲取失敗: {e}")
            return None
        
        return None

    async def cache_analysis(self, cache_key: str, analysis_result: Dict, ttl: int = 3600):
        """將分析結果存儲到Walrus"""
        try:
            data_payload = {
                "key": cache_key,
                "value": analysis_result,
                "ttl": ttl
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.endpoint}/v1/store"
                async with session.post(url, json=data_payload, timeout=10) as resp:
                    if resp.status == 200:
                        result = await resp.text()
                        print(f"✅ 快取已存: {cache_key}")
                        return result
        except Exception as e:
            print(f"❌ Walrus快取存儲失敗: {e}")
