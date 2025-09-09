import aiohttp
from typing import Optional
import json

class SuiAnalyzer:
    """Sui链分析器 - 基础版本"""
    
    def __init__(self):
        self.rpc_url = "https://fullnode.mainnet.sui.io:443"
    
    async def get_package_id(self, object_id: str) -> Optional[str]:
        """从object_id获取package_id"""
        try:
            print(f"🔍 开始获取package_id: {object_id}")
            
            rpc_data = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getObject",
                "params": [
                    object_id,
                    {"showType": True, "showContent": True}
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.rpc_url, json=rpc_data, timeout=15) as resp:
                    if resp.status != 200:
                        print(f"❌ RPC调用失败: {resp.status}")
                        return None
                    
                    result = await resp.json()
                    
                    # 检查错误
                    if "error" in result:
                        print(f"❌ RPC错误: {result['error']}")
                        return None
                    
                    # 检查result结构
                    if "result" not in result or "data" not in result["result"]:
                        print("❌ 响应格式错误")
                        return None
                    
                    data = result["result"]["data"]
                    
                    # 特殊处理：0x2是Sui标准库包
                    if object_id == "0x0000000000000000000000000000000000000000000000000000000000000002":
                        print("📦 识别为Sui标准库包")
                        return "0x0000000000000000000000000000000000000000000000000000000000000002"
                    
                    # 检查type字段
                    if "type" not in data:
                        print("❌ 对象数据中缺少type字段")
                        return None
                    
                    type_info = data["type"]
                    print(f"📦 对象类型: {type_info}")
                    
                    # 从type中提取package_id
                    if "::" in type_info:
                        package_id = type_info.split("::")[0]
                        print(f"✅ 提取到package_id: {package_id}")
                        return package_id
                    
                    # 如果type就是一个address，可能是package对象
                    if type_info.startswith("0x"):
                        print(f"✅ 直接返回package_id: {type_info}")
                        return type_info
                    
                    print(f"⚠️ 无法从type '{type_info}' 中提取package_id")
                    return None
                    
        except Exception as e:
            print(f"❌ get_package_id错误: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def analyze_object(self, object_id: str) -> dict:
        """分析单个对象"""
        try:
            package_id = await self.get_package_id(object_id)
            if not package_id:
                return {
                    "object_id": object_id,
                    "package_id": None,
                    "status": "failed",
                    "error": "Unable to extract package_id"
                }
            
            return {
                "object_id": object_id,
                "package_id": package_id,
                "status": "success"
            }
            
        except Exception as e:
            return {
                "object_id": object_id,
                "package_id": None,
                "status": "error",
                "error": str(e)
            }
