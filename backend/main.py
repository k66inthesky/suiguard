from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import sys
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
import asyncio

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
    from schedule.schedule_revoke_certificate import start_scheduler
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

# 🔐 CORS設定 - 開發環境允許所有來源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發模式：允許所有來源
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],  # 允許所有 headers
)

# 🔄 定時任務調度器 (啟動時初始化)
@app.on_event("startup")
async def startup_event():
    """應用啟動時執行"""
    logger.info("🚀 Starting SuiGuard API...")
    
    # 啟動證書撤銷定時任務
    try:
        scheduler = start_scheduler()
        app.state.scheduler = scheduler
        logger.info("✅ Certificate revocation scheduler started")
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """應用關閉時執行"""
    logger.info("🛑 Shutting down SuiGuard API...")
    
    # 停止調度器
    if hasattr(app.state, 'scheduler'):
        try:
            app.state.scheduler.shutdown()
            logger.info("✅ Scheduler stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping scheduler: {e}")

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

class CertificateRequest(BaseModel):
    """NFT證書請求"""
    package_id: str
    wallet_address: str
    
    class Config:
        min_anystr_length = 1
        max_anystr_length = 200

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
            "version_analysis": "/api/analyze-versions"
        }
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

@app.post("/api/request-certificate")
async def request_certificate(request: CertificateRequest):
    """🎖️ NFT證書請求端點 - 返回證書鑄造所需數據"""
    try:
        package_id = request.package_id.strip()
        wallet_address = request.wallet_address.strip()
        
        # 輸入驗證
        if not package_id.startswith('0x'):
            raise HTTPException(status_code=400, detail="Invalid package_id format")
        if not wallet_address.startswith('0x'):
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        logger.info(f"Certificate request for package: {package_id}, wallet: {wallet_address}")
        
        # 重新分析 package 以獲取最新數據
        move_analyzer = MoveCodeAnalyzer()
        risk_engine = RiskEngine()
        
        # 分析package
        code_analysis = await move_analyzer.analyze_package(package_id, "certificate_request")
        source_code = code_analysis.get("source_code", "")
        
        # 風險分析
        overall_risk = await risk_engine.analyze_with_ml_integration(
            domain="certificate_request",
            permissions=[],
            package_analyses=[{
                "package_id": package_id,
                "analysis": code_analysis,
                "status": "success"
            }],
            move_source_code=source_code
        )
        
        # 計算安全分數 (0-100)
        risk_level = overall_risk["risk_level"]
        confidence = overall_risk["confidence"]
        
        # 將風險等級轉換為分數
        risk_scores = {
            "LOW": 85,
            "MEDIUM": 60,
            "HIGH": 30
        }
        base_score = risk_scores.get(risk_level, 50)
        
        # 根據confidence調整分數
        security_score = int(base_score * confidence)
        security_score = max(0, min(100, security_score))  # 確保在0-100之間
        
        # 準備證書數據
        certificate_data = {
            "recipient": wallet_address,
            "package_id": package_id,
            "risk_level": risk_level,
            "security_score": security_score,
            "recommendation": overall_risk["recommendation"],
            "analyzer_version": "v1.0.0",
            "timestamp": datetime.now().isoformat() + "Z",
            "reasons": overall_risk["reasons"],
            "confidence": confidence,
        }
        
        logger.info(f"Certificate data prepared: {risk_level}, score: {security_score}")
        
        return certificate_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Certificate request error: {e}")
        raise HTTPException(status_code=500, detail="Certificate service temporarily unavailable")

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
    
    # 生產環境默認配置 - Cloud Run 使用 PORT 環境變數
    port = int(os.getenv("PORT", 8080))
    host = "0.0.0.0"  # Cloud Run 需要監聽所有介面
    
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