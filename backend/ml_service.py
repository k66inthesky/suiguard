"""
獨立的 ML 模型服務
負責智能合約漏洞檢測，使用 LoRA 微調的 Mistral-7B 模型
支援懶加載和單例模式以優化記憶體使用
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
import logging
from datetime import datetime
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel, LoraConfig, get_peft_model
import asyncio
from threading import Lock

# 日誌配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# 智能設備選擇（優先 GPU，自動降級 CPU）
# ============================================
def get_device():
    """自動偵測並選擇最佳計算設備"""
    if torch.cuda.is_available():
        device = "cuda"
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"🎮 偵測到 GPU: {gpu_name} ({gpu_memory:.1f} GB)")
        logger.info(f"✅ 使用 GPU 加速 (CUDA {torch.version.cuda})")
        return device
    else:
        logger.warning("⚠️ 未偵測到 GPU，降級使用 CPU")
        logger.info("💡 安裝 CUDA 版本的 PyTorch 以啟用 GPU 加速")
        return "cpu"

# FastAPI 應用
app = FastAPI(
    title="SuiGuard ML Service",
    version="1.0.0",
    description="Dedicated ML service for smart contract vulnerability detection",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 請求模型
class VulnerabilityAnalysisRequest(BaseModel):
    """漏洞分析請求"""
    move_code: str
    timeout: Optional[int] = 30  # 秒
    
    class Config:
        min_anystr_length = 1

# ML 模型單例管理器
class MLModelSingleton:
    """ML 模型單例 - 懶加載，全局共享"""
    
    _instance = None
    _lock = Lock()
    _model = None
    _tokenizer = None
    _initialized = False
    _loading = False
    _device = None  # 計算設備（cuda 或 cpu）
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """初始化配置（不載入模型）"""
        if not hasattr(self, '_config_loaded'):
            self.model_path = os.getenv("LORA_MODEL_PATH", "./lora_models")
            self.base_model_name = os.getenv("BASE_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2")
            
            # 智能選擇設備（優先 GPU）
            if self._device is None:
                self._device = get_device()
            
            # 漏洞分類映射到風險分數區間 (100分制) - 所有漏洞都是高風險
            self.vulnerability_score_ranges = {
                "capability_leak": (80, 95),         # Capability Leak - 高風險
                "arithmetic_overflow": (80, 95),     # Arithmetic Overflow - 高風險
                "cross_module_pollution": (80, 95),  # Cross-Module Pollution - 高風險
                "unchecked_return": (80, 95),        # Unchecked Return - 高風險
                "resource_leak": (80, 95),           # Resource Leak - 高風險
                "safe": (0, 19)                      # Safe - 低風險
            }
            
            # 漏洞類型的中文名稱
            self.vulnerability_names = {
                "capability_leak": "Capability Leak (權限洩漏)",
                "arithmetic_overflow": "Arithmetic Overflow (算術溢位)",
                "cross_module_pollution": "Cross-Module Pollution (跨模組污染)",
                "unchecked_return": "Unchecked Return (未檢查返回值)",
                "resource_leak": "Resource Leak (資源洩漏)",
                "safe": "未發現明顯漏洞"
            }
            
            # 機率分布閾值配置
            self.confidence_thresholds = {
                "high_confidence": 0.8,
                "medium_confidence": 0.6,
                "low_confidence": 0.4
            }
            
            self._config_loaded = True
            logger.info("✅ ML 模型配置已載入")
    
    async def ensure_model_loaded(self):
        """確保模型已載入（懶加載）"""
        if self._initialized:
            return True
        
        # 防止重複載入
        if self._loading:
            # 等待其他請求完成載入
            while self._loading:
                await asyncio.sleep(0.5)
            return self._initialized
        
        with self._lock:
            if self._initialized:
                return True
            
            self._loading = True
            try:
                await self._load_model()
                self._initialized = True
                logger.info("✅ ML 模型載入完成")
                return True
            except Exception as e:
                logger.error(f"❌ ML 模型載入失敗: {e}")
                raise
            finally:
                self._loading = False
    
    async def _load_model(self):
        """實際載入模型（私有方法）"""
        try:
            logger.info(f"🔄 開始載入 LoRA 模型: {self.base_model_name}")
            
            # 載入 tokenizer
            logger.info("📚 載入 tokenizer...")
            self._tokenizer = AutoTokenizer.from_pretrained(self.base_model_name)
            if self._tokenizer.pad_token is None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
            
            # 根據設備類型配置模型載入參數
            if self._device == "cuda":
                # GPU 模式：使用 float16 加速，支援記憶體限制
                max_memory_gb = int(os.getenv("ML_MAX_MEMORY_GB", "10"))
                logger.info(f"💾 GPU 記憶體限制: {max_memory_gb}GB")
                
                logger.info("🧠 載入基礎模型 (GPU 模式)...")
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    torch_dtype=torch.float16,  # GPU 使用 FP16 加速
                    device_map="cuda:0",
                    low_cpu_mem_usage=True
                )
            else:
                # CPU 模式：使用 float32，不需要 device_map
                logger.info("🧠 載入基礎模型 (CPU 模式)...")
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    torch_dtype=torch.float32,  # CPU 使用 FP32
                    low_cpu_mem_usage=True
                )
                base_model = base_model.to(self._device)
            
            # 載入 LoRA 微調權重
            if os.path.exists(self.model_path):
                logger.info(f"🎯 載入 LoRA 微調權重: {self.model_path}")
                try:
                    if self._device == "cuda":
                        # GPU 模式
                        self._model = PeftModel.from_pretrained(
                            base_model, 
                            self.model_path,
                            torch_dtype=torch.float16
                        )
                    else:
                        # CPU 模式
                        self._model = PeftModel.from_pretrained(
                            base_model, 
                            self.model_path,
                            torch_dtype=torch.float32
                        )
                    logger.info("✅ LoRA 模型載入成功")
                except Exception as e:
                    logger.warning(f"⚠️ LoRA 載入失敗，直接使用基礎模型: {e}")
                    # 如果 LoRA 載入失敗，直接使用基礎模型
                    self._model = base_model
                    logger.info("✅ 使用基礎模型（無 LoRA）")
            else:
                logger.warning(f"⚠️ 未找到 LoRA 模型路徑: {self.model_path}")
                lora_config = LoraConfig(
                    r=8,
                    lora_alpha=16,
                    target_modules=["q_proj", "v_proj"],
                    lora_dropout=0.05,
                    bias="none",
                    task_type="CAUSAL_LM"
                )
                self._model = get_peft_model(base_model, lora_config)
            
            # 設置為評估模式
            self._model.eval()
            
            # 記憶體使用報告
            if self._device == "cuda":
                memory_allocated = torch.cuda.memory_allocated() / 1024**3  # GB
                memory_reserved = torch.cuda.memory_reserved() / 1024**3  # GB
                logger.info(f"📊 GPU 記憶體使用: {memory_allocated:.2f} GB (已分配), {memory_reserved:.2f} GB (已保留)")
            else:
                logger.info("📊 CPU 模式運行中")
            
            logger.info(f"✅ ML 模型載入完成 (設備: {self._device})")
            
        except Exception as e:
            logger.error(f"❌ 模型載入失敗: {e}")
            raise
    
    def extract_label(self, output_text: str) -> str:
        """從輸出文本提取漏洞標籤 - 對應5種類型"""
        output_lower = output_text.lower()
        
        # Resource Leak (資源洩漏)
        if "resource leak" in output_lower or "資源洩漏" in output_text or "资源泄漏" in output_text:
            return "resource_leak"
        # Arithmetic Overflow (算術溢位)
        elif "overflow" in output_lower or "溢位" in output_text or "溢出" in output_text or "arithmetic" in output_lower:
            return "arithmetic_overflow"
        # Unchecked Return (未檢查返回值)
        elif "unchecked" in output_lower or "return" in output_lower or "未檢查" in output_text or "返回值" in output_text:
            return "unchecked_return"
        # Cross-Module Pollution (跨模組污染)
        elif "cross-module" in output_lower or "pollution" in output_lower or "跨模組" in output_text or "污染" in output_text:
            return "cross_module_pollution"
        # Capability Leak (權限洩漏)
        elif "capability" in output_lower or "access control" in output_lower or "權限" in output_text or "存取控制" in output_text:
            return "capability_leak"
        # Safe (未發現明顯漏洞)
        elif "未發現明顯漏洞" in output_text or "未發現漏洞" in output_text or "安全" in output_text or "safe" in output_lower:
            return "safe"
        else:
            # 默認根據常見關鍵字判斷
            if "邏輯" in output_text or "logic" in output_lower:
                return "arithmetic_overflow"
            elif "隨機" in output_text or "random" in output_lower:
                return "unchecked_return"
            else:
                return "safe"
    
    async def classify_vulnerability(self, move_code: str) -> Dict:
        """使用 LoRA 模型分類智能合約漏洞"""
        import time
        start_time = time.time()
        
        try:
            # 確保模型已載入
            await self.ensure_model_loaded()
            
            if not self._model or not self._tokenizer:
                raise Exception("模型未正確初始化")
            
            # 構建提示詞
            instruction = "請分析以下 Sui Move 智能合約代碼，找出潛在的安全漏洞，並評估危險等級（高/中/低）"
            prompt = f"{instruction}\n\n```move\n{move_code}\n```\n\n分析結果："
            
            # 分詞
            inputs = self._tokenizer(
                prompt,
                return_tensors="pt",
                max_length=2048,
                truncation=True,
                padding=True
            )
            
            # 移至正確設備（GPU 或 CPU）
            inputs = {k: v.to(self._device) for k, v in inputs.items()}
            
            # 生成預測 - 使用確定性推理（greedy decoding）
            with torch.no_grad():
                outputs = self._model.generate(
                    **inputs,
                    max_new_tokens=256,
                    do_sample=False,  # 關閉隨機採樣，使用貪婪解碼
                    num_beams=1,      # 不使用 beam search，保持一致性
                    pad_token_id=self._tokenizer.pad_token_id,
                    eos_token_id=self._tokenizer.eos_token_id
                )
            
            # 解碼輸出
            output_text = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 提取分析結果部分
            if "分析結果：" in output_text:
                output_text = output_text.split("分析結果：", 1)[1].strip()
            
            # 提取分類標籤
            classification = self.extract_label(output_text)
            
            # 解析危險等級和信心度
            confidence = 0.5  # 默認信心度
            risk_level = "MEDIUM"
            
            if "危險等級：高" in output_text or "高風險" in output_text or "嚴重" in output_text:
                confidence = 0.9
                risk_level = "HIGH"
            elif "危險等級：中" in output_text or "中風險" in output_text or "中等" in output_text:
                confidence = 0.6
                risk_level = "MEDIUM"
            elif "危險等級：低" in output_text or "低風險" in output_text or "輕微" in output_text:
                confidence = 0.3
                risk_level = "LOW"
            elif classification == "safe":
                confidence = 0.8
                risk_level = "SAFE"
            
            # 構建概率分布 - 更新為6種類型
            probabilities = {
                "capability_leak": 0.0,
                "arithmetic_overflow": 0.0,
                "cross_module_pollution": 0.0,
                "unchecked_return": 0.0,
                "resource_leak": 0.0,
                "safe": 0.0
            }
            
            # 根據分類設置概率
            probabilities[classification] = confidence
            remaining_prob = 1.0 - confidence
            other_count = len(probabilities) - 1
            for key in probabilities:
                if key != classification:
                    probabilities[key] = remaining_prob / other_count
            
            # 計算風險分數 (0-100)
            risk_score = self._calculate_risk_score(classification, confidence)
            
            # 獲取漏洞類型的中文名稱
            vulnerability_name = self.vulnerability_names.get(classification, classification)
            
            # 計算處理時間
            processing_time = time.time() - start_time
            
            return {
                "classification": classification,
                "vulnerability_type": vulnerability_name,  # 添加中文名稱
                "probabilities": probabilities,
                "max_probability": confidence,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "reasoning": output_text,
                "model_version": "LoRA-Mistral-7B-v1.0",
                "processing_time": round(processing_time, 2),
                "timestamp": datetime.now().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"❌ 漏洞分類失敗: {e}")
            raise
    
    def _calculate_risk_score(self, classification: str, confidence: float) -> int:
        """計算 0-100 風險分數"""
        score_range = self.vulnerability_score_ranges.get(classification, (0, 19))
        min_score, max_score = score_range
        
        # 基於信心度在區間內計算分數
        base_score = min_score + (max_score - min_score) * confidence
        
        # 信心度調整
        if confidence >= self.confidence_thresholds["high_confidence"]:
            adjustment = 1.0
        elif confidence >= self.confidence_thresholds["medium_confidence"]:
            adjustment = 0.8
        elif confidence >= self.confidence_thresholds["low_confidence"]:
            adjustment = 0.6
        else:
            adjustment = 0.3
        
        final_score = base_score * adjustment
        return int(round(min(max(final_score, 0), 100)))
    
    def get_stats(self) -> Dict:
        """獲取模型統計信息"""
        stats = {
            "initialized": self._initialized,
            "loading": self._loading,
            "model_path": self.model_path,
            "base_model": self.base_model_name
        }
        
        if torch.cuda.is_available() and self._initialized:
            stats["gpu_memory_allocated_gb"] = torch.cuda.memory_allocated() / 1024**3
            stats["gpu_memory_reserved_gb"] = torch.cuda.memory_reserved() / 1024**3
        
        return stats

# 全局單例實例
ml_model = MLModelSingleton()

# API 端點
@app.get("/")
async def root():
    """服務基本信息"""
    return {
        "service": "SuiGuard ML Service",
        "version": "1.0.0",
        "status": "ready",
        "model_initialized": ml_model._initialized,
        "endpoints": {
            "analyze": "/api/analyze-vulnerability",
            "health": "/health",
            "stats": "/stats"
        }
    }

@app.post("/api/analyze-vulnerability")
async def analyze_vulnerability(request: VulnerabilityAnalysisRequest):
    """分析智能合約漏洞"""
    try:
        move_code = request.move_code.strip()
        
        if not move_code:
            raise HTTPException(status_code=400, detail="move_code is required")
        
        if len(move_code) > 100000:
            raise HTTPException(status_code=400, detail="Code too large (max: 100KB)")
        
        logger.info("📝 收到漏洞分析請求")
        
        # 執行分析
        result = await ml_model.classify_vulnerability(move_code)
        
        logger.info(f"✅ 分析完成: {result['classification']} (風險分數: {result['risk_score']})")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 分析失敗: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "model_initialized": ml_model._initialized,
        "timestamp": datetime.now().isoformat() + "Z"
    }

@app.get("/stats")
async def get_stats():
    """獲取服務統計信息"""
    return ml_model.get_stats()

@app.post("/api/warmup")
async def warmup():
    """預熱模型（手動觸發載入）"""
    try:
        logger.info("🔥 開始預熱 ML 模型...")
        await ml_model.ensure_model_loaded()
        logger.info("✅ 模型預熱完成")
        return {
            "status": "warmed_up",
            "stats": ml_model.get_stats()
        }
    except Exception as e:
        logger.error(f"❌ 預熱失敗: {e}")
        raise HTTPException(status_code=500, detail=f"Warmup failed: {str(e)}")

# 啟動配置
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("ML_SERVICE_PORT", 8081))
    host = "0.0.0.0"
    
    logger.info(f"🚀 Starting ML Service on http://{host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=False,
        reload=False,
        workers=1  # 單 worker，避免重複載入模型
    )
