from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import sys
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
# 載入 .env 文件
load_dotenv()

sys.path.append('.')

# 配置生產環境日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import core services (靜默導入，減少控制台噪音)
try:
    from services.move_analyzer import MoveCodeAnalyzer  
    from services.risk_engine import RiskEngine
    from services.pkg_version_service import PackageVersionService
    logger.info("✅ All services imported successfully")
except Exception as e:
    logger.error(f"❌ Service import failed: {e}")
    raise

# 🎯 由於直接使用 package_ids，不再需要複雜的快取邏輯
# 直接使用核心服務即可

# FastAPI應用初始化 - 生產模式
app = FastAPI(
    title="SuiGuard API",
    version="1.0.0",
    description="Production-ready Chrome Extension backend for Sui wallet security analysis",
    docs_url=None,  # 🔒 生產環境關閉API文檔
    redoc_url=None, # 🔒 生產環境關閉ReDoc
    openapi_url=None  # 🔒 生產環境關閉OpenAPI schema
)

# 🔐 嚴格的CORS設定 - 只允許特定的Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"chrome-extension://{os.getenv('CHROME_EXTENSION_ID')}" # 🔒 替換為實際的Extension ID
    ],
    allow_credentials=False,  # 🔒 生產環境不允許攜帶認證信息
    allow_methods=["GET", "POST"],  # 🔒 只允許必要的HTTP方法
    allow_headers=[
        "Content-Type",
        "Accept",
        "User-Agent"
    ],  # 🔒 只允許必要的headers
)

# Pydantic模型定義
class ConnectionRequest(BaseModel):
    """Chrome Extension的錢包連接請求"""
    package_ids: List[str]  # 🎯 只需要 package_ids 列表
    
    class Config:
        # 輸入驗證
        min_anystr_length = 1
        max_anystr_length = 1000

class PackageVersionRequest(BaseModel):
    """包版本分析請求"""
    package_ids: List[str]  # 要分析版本的包ID列表
    
    class Config:
        min_anystr_length = 1
        max_anystr_length = 1000

# 🎯 核心API端點
@app.get("/")
async def root():
    """API基本資訊 - 精簡版"""
    return {
        "message": "SuiGuard API - Production Ready",
        "version": "1.0.0",
        "status": "ready",
        "features": [
            "Smart Contract Vulnerability Detection",
            "ML-Powered Risk Assessment", 
            "Walrus Distributed Caching",
            "Real-time Sui Blockchain Analysis"
        ],
        "endpoints": {
            "analyze": "/api/analyze-connection",
            "version_analysis": "/api/analyze-versions",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """生產環境健康檢查 - 快速、安全"""
    current_time = datetime.now().isoformat() + "Z"
    
    # 🏥 基礎服務檢查
    services_status = {
        "api": "operational",
        "timestamp": current_time
    }
    
    # 快速檢查核心服務（不進行實際RPC調用以提高響應速度）
    try:
        # 檢查服務是否可以初始化
        MoveCodeAnalyzer()
        RiskEngine()
        services_status["core_services"] = "ready"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        services_status["core_services"] = "degraded"
    
    # 檢查環境配置
    required_env = ["WALRUS_ENDPOINT"]
    optional_env = ["SUI_RPC_PUBLIC_URL", "SUI_RPC_PROVIDER_URL"]
    missing_env = [env for env in required_env if not os.getenv(env)]
    
    # 檢查是否至少有一個 SUI RPC URL 可用
    has_sui_rpc = any(os.getenv(env) for env in optional_env)
    if not has_sui_rpc:
        missing_env.append("SUI_RPC_PUBLIC_URL or SUI_RPC_PROVIDER_URL")
    
    if missing_env:
        services_status["configuration"] = f"missing: {', '.join(missing_env)}"
    else:
        services_status["configuration"] = "complete"
    
    # 整體狀態判斷
    overall_status = "healthy" if services_status["core_services"] == "ready" and services_status["configuration"] == "complete" else "degraded"
    
    return {
        "status": overall_status,
        "message": "SuiGuard API operational status",
        "services": services_status,
        "version": "1.0.0"
    }

@app.post("/api/analyze-connection")
async def analyze_connection(request: ConnectionRequest):
    """🎯 主要業務端點 - Chrome Extension用戶合約分析"""
    try:
        package_ids = request.package_ids  # 🎯 只需要 package_ids
        
        # 輸入驗證
        if not package_ids:
            raise HTTPException(status_code=400, detail="package_ids are required")
        
        if len(package_ids) > 50:  # 🔒 限制處理數量防止濫用
            raise HTTPException(status_code=400, detail="Too many packages to analyze (max: 50)")
        
        logger.info(f"Analyzing packages: {len(package_ids)}")
        
        # 初始化核心服務
        move_analyzer = MoveCodeAnalyzer()
        risk_engine = RiskEngine()
        package_analysis = []
        all_move_code = ""
        
        # 🚀 直接分析每個 package_id
        for package_id in package_ids:
            try:
                # 輸入清理和驗證
                package_id = package_id.strip()
                if not package_id.startswith('0x'):
                    logger.warning(f"Invalid package_id format: {package_id}")
                    continue
                
                # 🎯 直接從 Sui RPC 獲取完整合約 source code
                code_analysis = await move_analyzer.analyze_package(package_id, "unknown_domain")
                
                # 收集Move代碼用於ML分析
                source_code = code_analysis.get("source_code", "")
                if source_code:
                    all_move_code += f"\n// Package: {package_id}\n{source_code}\n"
                
                package_analysis.append({
                    "package_id": package_id,
                    "analysis": code_analysis,
                    "status": "success"
                })
                    
            except Exception as e:
                logger.error(f"Error analyzing package_id {package_id}: {e}")
                package_analysis.append({
                    "package_id": package_id,
                    "analysis": {"error": "Analysis failed"},
                    "status": "error"
                })
        
        # ML整合風險分析
        overall_risk = await risk_engine.analyze_with_ml_integration(
            domain="unknown_domain",
            permissions=[],
            package_analyses=package_analysis,
            move_source_code=all_move_code.strip()
        )
        
        # 🎯 生產環境響應 - 精簡且安全
        result = {
            "risk_level": overall_risk["risk_level"],
            "confidence": overall_risk["confidence"],
            "reasons": overall_risk["reasons"],
            "recommendation": overall_risk["recommendation"],
            "analyzed_packages": len([p for p in package_analysis if p["status"] == "success"]),
            "total_packages": len(package_ids),
            "analysis_method": overall_risk["details"].get("analysis_method", "rules_only"),
            "timestamp": datetime.now().isoformat() + "Z",
            # 🔒 生產環境不返回詳細的內部分析數據
        }
        
        logger.info(f"Analysis completed: {result['risk_level']}, confidence: {result['confidence']:.2f}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Connection analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis service temporarily unavailable")

@app.post("/api/analyze-versions")
async def analyze_package_versions(request: PackageVersionRequest):
    """🔍 包版本分析端點 - 分析智能合約包的版本歷史"""
    try:
        package_ids = request.package_ids
        
        # 輸入驗證
        if not package_ids:
            raise HTTPException(status_code=400, detail="package_ids are required")
        
        if len(package_ids) > 10:  # 🔒 版本分析比較耗時，限制更少的數量
            raise HTTPException(status_code=400, detail="Too many packages to analyze versions (max: 10)")
        
        logger.info(f"Analyzing package versions: {len(package_ids)}")
        
        # 初始化版本分析服務
        version_service = PackageVersionService()
        
        # 批量分析版本
        version_results = await version_service.batch_analyze_versions(package_ids)
        
        logger.info(f"Version analysis completed: {len(version_results['results'])}/{version_results['total_packages']} total")
        
        return version_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Package version analysis error: {e}")
        raise HTTPException(status_code=500, detail="Version analysis service temporarily unavailable")

# 🔒 生產環境錯誤處理 - 不洩露內部信息
from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "The requested resource does not exist",
            "status_code": 404
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "Service temporarily unavailable. Please try again later.",
            "status_code": 500
        }
    )

# 🚀 生產環境啟動配置
if __name__ == "__main__":
    import uvicorn
    
    # 生產環境默認配置
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    # 設置必要的環境變數
    # 優先使用 SUI_RPC_PROVIDER_URL，然後是 SUI_RPC_PUBLIC_URL，最後是默認值
    if not os.getenv("SUI_RPC_PROVIDER_URL") and not os.getenv("SUI_RPC_PUBLIC_URL"):
        os.environ.setdefault("SUI_RPC_PUBLIC_URL", "https://fullnode.mainnet.sui.io:443")
    os.environ.setdefault("WALRUS_ENDPOINT", "https://walrus-testnet.nodes.guru")
    
    logger.info("🚀 Starting SuiGuard API in production mode...")
    logger.info(f"🌐 Server will run on http://{host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",  # 🔒 生產環境使用info級別日誌
        access_log=False,  # 🔒 關閉詳細訪問日誌
        reload=False,      # 🔒 生產環境關閉自動重載
        workers=1          # 🔒 單worker模式，避免並發問題
    )