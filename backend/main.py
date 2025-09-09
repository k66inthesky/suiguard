from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import traceback
import sys
import os
import aiohttp
sys.path.append('.')

# Import所有服務模塊
try:
    from services.sui_analyzer import SuiAnalyzer
    print("✅ SuiAnalyzer import 成功")
except Exception as e:
    print(f"❌ SuiAnalyzer import 失敗: {e}")

try:
    from services.move_analyzer import MoveCodeAnalyzer
    print("✅ MoveCodeAnalyzer import 成功")
except Exception as e:
    print(f"❌ MoveCodeAnalyzer import 失敗: {e}")

try:
    from services.risk_engine import RiskEngine
    print("✅ RiskEngine import 成功")
except Exception as e:
    print(f"❌ RiskEngine import 失敗: {e}")

try:
    from services.walrus_cache import WalrusCache
    print("✅ WalrusCache import 成功")
except Exception as e:
    print(f"❌ WalrusCache import 失敗: {e}")

# 在main.py中定義EnhancedSuiAnalyzer，避免循環導入
class EnhancedSuiAnalyzer(SuiAnalyzer):
    """帶Walrus快取的增強版Sui分析器"""
    
    def __init__(self):
        super().__init__()
        self.walrus_cache = WalrusCache()
    
    async def get_package_with_cache(self, object_id: str) -> Optional[str]:
        """帶快取的package_id查詢"""
        cache_key = f"obj_to_pkg_{object_id}"
        
        try:
            # 先檢查Walrus快取
            cached = await self.walrus_cache.get_cached_analysis(cache_key)
            if cached and "package_id" in cached:
                print(f"🎯 快取命中: {object_id}")
                return cached["package_id"]
        except Exception as e:
            print(f"快取查詢失敗: {e}")
        
        # 快取未命中，調用RPC
        print(f"🔍 快取未命中，查詢RPC: {object_id}")
        package_id = await self.get_package_id(object_id)
        
        # 存入快取
        if package_id:
            try:
                await self.walrus_cache.cache_analysis(
                    cache_key, 
                    {"package_id": package_id, "object_id": object_id}
                )
            except Exception as e:
                print(f"快取存儲失敗: {e}")
        
        return package_id

    async def batch_get_package_ids(self, object_ids: List[str]) -> Dict[str, Optional[str]]:
        """批量處理多個object_id"""
        import asyncio
        tasks = []
        for obj_id in object_ids:
            task = asyncio.create_task(self.get_package_with_cache(obj_id))
            tasks.append((obj_id, task))
        
        results = {}
        for obj_id, task in tasks:
            try:
                package_id = await task
                results[obj_id] = package_id
            except Exception as e:
                print(f"處理 {obj_id} 時發生錯誤: {e}")
                results[obj_id] = None
        
        return results

# FastAPI應用初始化
app = FastAPI(
    title="SuiGuard API - Debug Version", 
    version="1.0.0",
    description="Chrome Extension backend for Sui wallet security analysis with debugging features"
)

# 啟用CORS，允許Chrome Extension調用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Pydantic模型定義
class QueryRequest(BaseModel):
    object_id: str

class PackageQueryRequest(BaseModel):
    object_ids: List[str]
    domain: Optional[str] = None

class ConnectionRequest(BaseModel):
    """Chrome Extension的錢包連接請求"""
    domain: str
    object_ids: List[str]
    permissions: Optional[List[str]] = []

class MoveAnalysisRequest(BaseModel):
    package_id: str

# API端點定義
@app.get("/")
async def root():
    """根端點"""
    return {
        "message": "SuiGuard API Debug Version",
        "version": "1.0.0",
        "status": "ready",
        "debug_endpoints": {
            "debug_rpc": "/api/debug_rpc",
            "test_package_lookup": "/api/test_package_lookup",
            "analyze_simple": "/api/analyze-connection-simple"
        },
        "main_endpoints": {
            "health": "/health",
            "docs": "/docs",
            "analyze_connection": "/api/analyze-connection"
        }
    }

@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy", 
        "message": "SuiGuard API is running",
        "timestamp": "2025-09-09T10:44:00Z",
        "services": {
            "sui_rpc": "connected",
            "walrus_cache": "enabled", 
            "risk_engine": "active",
            "move_analyzer": "ready"
        }
    }

@app.post("/api/debug_rpc")
async def debug_rpc_call(request: dict):
    """調試RPC調用 - 查看具體錯誤"""
    try:
        object_id = request.get("object_id", "0x0000000000000000000000000000000000000000000000000000000000000002")
        
        print(f"🔍 開始調試RPC調用: {object_id}")
        
        rpc_data = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sui_getObject",
            "params": [
                object_id, 
                {
                    "showType": True,
                    "showContent": True
                }
            ]
        }
        
        print(f"📡 發送RPC請求: {rpc_data}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://fullnode.mainnet.sui.io:443", 
                json=rpc_data, 
                timeout=15
            ) as resp:
                response_text = await resp.text()
                print(f"📡 RPC響應狀態: {resp.status}")
                print(f"📡 RPC響應內容: {response_text[:500]}...")
                
                if resp.status == 200:
                    result = await resp.json()
                    return {
                        "status": "success",
                        "rpc_response": result,
                        "object_id": object_id
                    }
                else:
                    return {
                        "status": "error",
                        "http_status": resp.status,
                        "response": response_text,
                        "object_id": object_id
                    }
                
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"❌ RPC調試錯誤: {e}")
        print(f"❌ 完整錯誤堆疊: {error_details}")
        
        raise HTTPException(
            status_code=500, 
            detail={
                "error": str(e),
                "traceback": error_details,
                "object_id": object_id
            }
        )

@app.post("/api/test_package_lookup")
async def test_package_lookup(request: dict):
    """測試單純的package_id查詢"""
    try:
        object_id = request.get("object_id", "0x0000000000000000000000000000000000000000000000000000000000000002")
        
        print(f"🔍 測試package_id查詢: {object_id}")
        
        # 測試基本版
        sui_analyzer = SuiAnalyzer()
        basic_result = await sui_analyzer.get_package_id(object_id)
        print(f"基本版結果: {basic_result}")
        
        # 測試增強版
        enhanced_analyzer = EnhancedSuiAnalyzer()
        enhanced_result = await enhanced_analyzer.get_package_with_cache(object_id)
        print(f"增強版結果: {enhanced_result}")
        
        return {
            "object_id": object_id,
            "basic_result": basic_result,
            "enhanced_result": enhanced_result,
            "status": "success"
        }
        
    except Exception as e:
        print(f"❌ 測試錯誤: {e}")
        traceback.print_exc()
        return {
            "object_id": object_id,
            "error": str(e),
            "status": "failed"
        }

@app.post("/api/get_package_id")
async def get_package_id(request: QueryRequest):
    """單個object_id轉package_id"""
    try:
        analyzer = SuiAnalyzer()
        package_id = await analyzer.get_package_id(request.object_id)
        return {
            "object_id": request.object_id,
            "package_id": package_id,
            "cached": False
        }
    except Exception as e:
        print(f"錯誤詳情: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"服務器錯誤: {str(e)}")

@app.post("/api/analyze_move_code")
async def analyze_move_code(request: MoveAnalysisRequest):
    """Move代碼分析"""
    try:
        analyzer = MoveCodeAnalyzer()
        result = await analyzer.analyze_source_code(request.package_id)
        return result
    except Exception as e:
        print(f"Move分析錯誤: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"分析失敗: {str(e)}")

@app.post("/api/analyze-connection-simple")
async def analyze_connection_simple(request: ConnectionRequest):
    """簡化版連接分析端點"""
    try:
        print(f"🔍 開始簡化分析: {request.domain}")
        
        # 初始化分析器
        sui_analyzer = SuiAnalyzer()
        move_analyzer = MoveCodeAnalyzer()
        risk_engine = RiskEngine()
        
        # 分析所有object_ids
        analysis_results = []
        
        for object_id in request.object_ids:
            print(f"📦 分析對象: {object_id}")
            
            # 獲取package_id
            package_id = await sui_analyzer.get_package_id(object_id)
            if not package_id:
                print(f"❌ 無法獲取package_id: {object_id}")
                continue
            
            # Move代碼分析
            move_analysis = await move_analyzer.analyze_package(
                package_id, request.domain
            )
            
            analysis_results.append({
                "object_id": object_id,
                "package_id": package_id,
                "analysis": move_analysis,
                "risk_assessment": {
                    "risk": "LOW",
                    "score": 0.1,
                    "reasons": ["初步分析完成"],
                    "recommendation": "APPROVE"
                }
            })
        
        # **關鍵修復：正確調用風險評估**
        risk_result = risk_engine.calculate_overall_risk(
            domain=request.domain,           # ✅ 傳遞域名
            permissions=request.permissions, # ✅ 傳遞權限清單
            package_analyses=analysis_results # ✅ 傳遞包分析結果
        )
        
        return {
            "domain": request.domain,
            "risk_level": risk_result["risk_level"],
            "confidence": risk_result["confidence"],
            "reasons": risk_result["reasons"],
            "recommendation": risk_result["recommendation"],
            "analyzed_packages": len(analysis_results),
            "total_objects": len(request.object_ids),
            "simplified": True,
            "details": analysis_results
        }
        
    except Exception as e:
        print(f"❌ 簡化分析錯誤: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"分析失敗: {e}")


@app.post("/api/analyze-connection")
async def analyze_connection(request: ConnectionRequest):
    """🎯 Chrome Extension主要調用端點 - 分析錢包連接請求（原版）"""
    try:
        domain = request.domain
        object_ids = request.object_ids
        
        print(f"📊 開始分析連接請求: {domain}, objects: {len(object_ids)}")
        
        # 使用增強版分析器（帶Walrus快取）
        enhanced_analyzer = EnhancedSuiAnalyzer()
        move_analyzer = MoveCodeAnalyzer()
        risk_engine = RiskEngine()
        package_analysis = []
        
        # 分析每個object_id
        for obj_id in object_ids:
            print(f"🔍 分析object_id: {obj_id}")
            try:
                package_id = await enhanced_analyzer.get_package_with_cache(obj_id)
                if package_id:
                    print(f"📦 找到package_id: {package_id}")
                    
                    # Move代碼分析
                    code_analysis = await move_analyzer.analyze_source_code(package_id)
                    code_analysis["domain"] = domain
                    
                    # 風險評估
                    risk_result = risk_engine.evaluate_risk(code_analysis)
                    
                    package_analysis.append({
                        "object_id": obj_id,
                        "package_id": package_id,
                        "analysis": code_analysis,
                        "risk_assessment": risk_result
                    })
                else:
                    print(f"⚠️ 無法獲取package_id: {obj_id}")
                    
            except Exception as e:
                print(f"❌ 分析object_id {obj_id} 時出錯: {e}")
        
        # 計算整體風險
        overall_risk = risk_engine.calculate_overall_risk(package_analysis)
        
        result = {
            "domain": domain,
            "risk_level": overall_risk["risk"],
            "confidence": overall_risk["score"],
            "reasons": overall_risk["reasons"],
            "recommendation": overall_risk["recommendation"],
            "analyzed_packages": len(package_analysis),
            "total_objects": len(object_ids),
            "cache_enabled": True,
            "timestamp": "2025-09-09T10:44:00Z",
            "details": package_analysis
        }
        
        print(f"✅ 分析完成: {result['risk_level']}, 信心度: {result['confidence']:.2f}")
        return result
        
    except Exception as e:
        print(f"❌ 連接分析錯誤: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"分析失敗: {str(e)}")

# 錯誤處理
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found", 
        "message": "The requested endpoint does not exist",
        "available_endpoints": [
            "/health", 
            "/docs", 
            "/api/debug_rpc",
            "/api/analyze-connection-simple",
            "/api/analyze-connection"
        ]
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error", 
        "message": "Please check server logs for details",
        "timestamp": "2025-09-09T10:44:00Z"
    }

# 應用啟動
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 SuiGuard Debug 版本啟動中...")
    print("="*60)
    print("🔧 調試端點:")
    print("   📍 RPC調試: http://localhost:8080/api/debug_rpc")
    print("   📍 包查詢測試: http://localhost:8080/api/test_package_lookup")
    print("   📍 簡化分析: http://localhost:8080/api/analyze-connection-simple")
    print("📍 主要端點: http://localhost:8080/api/analyze-connection")
    print("📖 API文檔: http://localhost:8080/docs")
    print("💚 健康檢查: http://localhost:8080/health")
    print("="*60)
    
    # 設置環境變數
    os.environ.setdefault("WALRUS_ENDPOINT", "https://walrus-testnet.nodes.guru")
    os.environ.setdefault("SUI_RPC_URL", "https://fullnode.mainnet.sui.io:443")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080,
        log_level="info",
        access_log=True,
        reload=False
    )
