from typing import List, Dict, Optional
import re
from datetime import datetime
import json
import aiohttp
import os
from peft import LoraConfig, get_peft_model, PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from sklearn.metrics import f1_score
import torch

class RiskEngine:
    """風險評估引擎 - 
    負責分析域名、權限和智能合約包的風險等級
    提供綜合性的安全風險評估和建議
    """
    
    def __init__(self):
        # LoRA 微調模型配置
        self.model_path = os.getenv("LORA_MODEL_PATH", "./lora_models")
        self.base_model_name = os.getenv("BASE_MODEL_NAME", "mistralai/Mistral-7B-v0.1")
        self.dataset_path = os.getenv("DATASET_PATH", "ml/contract_bug_dataset.jsonl")
        
        # 初始化模型和分詞器
        self.model = None
        self.tokenizer = None
        self._initialize_model()
        
        # 漏洞分類映射到風險分數區間 (100分制)
        self.vulnerability_score_ranges = {
            "access_control": (80, 100),    # 存取控制漏洞 - 高風險 (80-100分)
            "logic_error": (50, 79),        # 邏輯錯誤漏洞 - 中風險 (50-79分)  
            "randomness_error": (20, 49),   # 隨機數漏洞 - 低風險 (20-49分)
            "safe": (0, 19)                 # 安全代碼 - 無風險 (0-19分)
        }
        
        # 機率分布閾值配置
        self.confidence_thresholds = {
            "high_confidence": 0.8,      # 高信心度閾值
            "medium_confidence": 0.6,    # 中信心度閾值
            "low_confidence": 0.4        # 低信心度閾值
        }
        
        # 惡意域名關鍵字清單
        self.malicious_domains = {
            'phishing', 'fake', 'scam', 'steal', 'malicious', 'hack', 
            'fraud', 'theft', 'fishing', 'wallet-stealer', 'crypto-steal',
            'bitcoin-scam', 'eth-fake', 'sui-fake', 'defi-scam', 'nft-steal',
            'metamask-fake', 'phantom-fake', 'ledger-fake', 'trezor-fake'
        }
        
        # 可疑域名關鍵字清單
        self.suspicious_domains = {
            'free', 'bonus', 'gift', 'earn', 'quick', 'fast', 'easy',
            'double', 'triple', 'profit', 'money', 'rich', 'millionaire',
            'lottery', 'winner', 'prize', 'reward', 'airdrop-free'
        }
        
        # 高風險權限清單
        self.high_risk_permissions = {
            'wallet:sign', 'wallet:transfer', 'wallet:approve_all',
            'wallet:delegate', 'wallet:admin'
        }
        
        # 中等風險權限清單
        self.medium_risk_permissions = {
            'wallet:read_balance', 'wallet:read_history', 'wallet:connect'
        }
        
        # 已知安全的官方域名
        self.trusted_domains = {
            'sui.io', 'mysten.io', 'suiwallet.com', 'ethoswallet.com',
            'martianwallet.xyz', 'github.com', 'chrome.google.com'
        }
        
        # 官方Sui包地址
        self.official_sui_packages = {
            "0x0000000000000000000000000000000000000000000000000000000000000001",  # Move stdlib
            "0x0000000000000000000000000000000000000000000000000000000000000002",  # Sui framework
            "0x0000000000000000000000000000000000000000000000000000000000000003"   # Sui system
        }
    
    def _initialize_model(self):
        """初始化 LoRA 微調模型"""
        try:
            print(f"🔄 正在加載基礎模型: {self.base_model_name}")
            
            # 加載 tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_name)
            
            # 加載基礎模型
            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            # 配置 LoRA
            lora_config = LoraConfig(
                r=8,
                lora_alpha=16,
                target_modules=["q_proj", "v_proj"],
                lora_dropout=0.05,
                bias="none",
                task_type="CAUSAL_LM"
            )
            
            # 如果存在已訓練的模型，直接加載 LoRA 模型
            if os.path.exists(self.model_path):
                print(f"✅ 加載微調權重: {self.model_path}")
                try:
                    self.model = PeftModel.from_pretrained(base_model, self.model_path)
                    print("✅ LoRA 微調模型加載成功")
                except Exception as e:
                    print(f"⚠️ LoRA 加載失敗，使用基礎模型: {e}")
                    self.model = get_peft_model(base_model, lora_config)
            else:
                print(f"⚠️ 未找到微調模型，使用基礎 LoRA 配置: {self.model_path}")
                self.model = get_peft_model(base_model, lora_config)
            
            self.model.eval()
            print("✅ 模型加載完成並設置為評估模式")
            
        except Exception as e:
            print(f"❌ 模型加載失敗: {e}")
            self.model = None
            self.tokenizer = None
    
    def load_dataset(self, jsonl_path: str) -> List[Dict]:
        """加載訓練數據集"""
        lines = []
        try:
            with open(jsonl_path, 'r', encoding='utf-8') as f:
                for line in f:
                    obj = json.loads(line)
                    lines.append({
                        "prompt": f"{obj['instruction']}\n{obj['input']}",
                        "output": obj['output']
                    })
            print(f"✅ 成功加載 {len(lines)} 筆訓練數據")
        except Exception as e:
            print(f"❌ 數據集加載失敗: {e}")
        return lines
    
    def extract_label(self, output_text: str) -> str:
        """從輸出文本提取漏洞標籤"""
        output_lower = output_text.lower()
        
        if "未發現明顯漏洞" in output_text or "未發現漏洞" in output_text:
            return "safe"
        elif "重入攻擊" in output_text or "reentrancy" in output_lower:
            return "reentrancy"
        elif "溢位" in output_text or "overflow" in output_lower:
            return "overflow"
        elif "存取控制" in output_text or "access_control" in output_lower:
            return "access_control"
        elif "邏輯錯誤" in output_text or "logic_error" in output_lower:
            return "logic_error"
        elif "隨機數" in output_text or "randomness" in output_lower:
            return "randomness_error"
        else:
            return "other_bug"
    
    def calculate_f1_score(self, dataset: List[Dict]) -> float:
        """計算模型的 F1 分數"""
        if not self.model or not self.tokenizer:
            print("❌ 模型未初始化，無法計算 F1 分數")
            return 0.0
        
        y_true = []
        y_pred = []
        
        print(f"📊 開始評估 {len(dataset)} 筆數據...")
        
        for i, sample in enumerate(dataset):
            if i % 10 == 0:
                print(f"  處理進度: {i}/{len(dataset)}")
            
            prompt = sample['prompt']
            label_true = self.extract_label(sample['output'])
            
            # 生成預測
            input_ids = self.tokenizer(prompt, return_tensors="pt", max_length=1024, truncation=True).input_ids
            if torch.cuda.is_available():
                input_ids = input_ids.to('cuda')
            
            with torch.no_grad():
                output_ids = self.model.generate(
                    input_ids=input_ids,
                    max_new_tokens=128,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            output_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
            label_pred = self.extract_label(output_text)
            
            y_true.append(label_true)
            y_pred.append(label_pred)
        
        # 計算 F1 分數
        f1 = f1_score(y_true, y_pred, average='macro')
        print(f"✅ F1 分數（macro）: {f1:.4f}")
        return f1
    
    def analyze_domain_risk(self, domain: str) -> Dict:
        """分析域名風險"""
        risk_score = 0.0
        reasons = []
        
        domain_lower = domain.lower()
        
        # 檢查是否為信任域名
        for trusted in self.trusted_domains:
            if trusted in domain_lower:
                return {
                    "risk_score": 0.0,
                    "reasons": [f"信任域名: {trusted}"]
                }
        
        # 檢查惡意關鍵字
        for keyword in self.malicious_domains:
            if keyword in domain_lower:
                risk_score += 0.8
                reasons.append(f"高風險域名模式: {keyword}")
        
        # 檢查可疑關鍵字  
        for keyword in self.suspicious_domains:
            if keyword in domain_lower:
                risk_score += 0.3
                reasons.append(f"可疑域名模式: {keyword}")
        
        # 檢查域名長度異常
        if len(domain) > 30:
            risk_score += 0.2
            reasons.append("域名長度異常")
        
        # 檢查過多連字符
        if domain.count('-') > 2:
            risk_score += 0.3
            reasons.append("域名包含過多連字符")
        
        # 檢查數字字母混合模式
        if any(c.isdigit() for c in domain) and any(c.isalpha() for c in domain):
            digit_count = sum(c.isdigit() for c in domain)
            if digit_count > 3:
                risk_score += 0.2
                reasons.append("可疑的數字字母組合")
        
        return {
            "risk_score": min(risk_score, 1.0),
            "reasons": reasons
        }
    
    def analyze_permissions_risk(self, permissions: List[str]) -> Dict:
        """分析權限風險"""
        risk_score = 0.0
        reasons = []
        
        high_risk_count = 0
        medium_risk_count = 0
        
        for permission in permissions:
            if permission in self.high_risk_permissions:
                risk_score += 0.4
                high_risk_count += 1
                reasons.append(f"高風險權限請求: {permission}")
            elif permission in self.medium_risk_permissions:
                risk_score += 0.2
                medium_risk_count += 1
                reasons.append(f"中等風險權限請求: {permission}")
        
        # 權限數量風險評估
        total_permissions = len(permissions)
        if total_permissions > 5:
            risk_score += 0.3
            reasons.append(f"請求過多權限: {total_permissions}個")
        elif total_permissions > 3:
            risk_score += 0.1
            reasons.append(f"請求較多權限: {total_permissions}個")
        
        # 高風險權限組合檢查
        if 'wallet:sign' in permissions and 'wallet:transfer' in permissions:
            risk_score += 0.2
            reasons.append("危險權限組合: 簽名+轉帳")
        
        return {
            "risk_score": min(risk_score, 1.0),
            "reasons": reasons,
            "high_risk_permissions": high_risk_count,
            "medium_risk_permissions": medium_risk_count
        }
    
    def analyze_package_risk(self, package_analyses: List[Dict]) -> Dict:
        """分析智能合約包風險"""
        risk_score = 0.0
        reasons = []
        analyzed_count = 0
        
        for analysis in package_analyses:
            if analysis.get('status') != 'success':
                continue
                
            analyzed_count += 1
            pkg_analysis = analysis.get('analysis', {})
            package_id = pkg_analysis.get('package_id', '')
            
            # 檢查是否為官方Sui包
            if package_id in self.official_sui_packages:
                reasons.append("官方Sui套件 - 已驗證安全")
                continue
            
            # 分析危險函數
            dangerous_functions = pkg_analysis.get('dangerous_functions', [])
            if len(dangerous_functions) > 10:
                risk_score += 0.4
                reasons.append(f"檢測到大量危險函數: {len(dangerous_functions)}個")
            elif len(dangerous_functions) > 5:
                risk_score += 0.2
                reasons.append(f"檢測到多個危險函數: {len(dangerous_functions)}個")
        
        return {
            "risk_score": min(risk_score, 1.0),
            "reasons": reasons,
            "analyzed_packages": analyzed_count
        }
    
    def calculate_overall_risk(self, domain: str, permissions: List[str], package_analyses: List[Dict]) -> Dict:
        """綜合風險評估 - 主要方法"""
        
        # 各項風險分析
        domain_risk = self.analyze_domain_risk(domain)
        permission_risk = self.analyze_permissions_risk(permissions)
        package_risk = self.analyze_package_risk(package_analyses)
        
        # 計算加權風險分數
        # 域名風險權重最高，因為惡意域名通常是最明顯的危險信號
        domain_weight = 0.5
        permission_weight = 0.3
        package_weight = 0.2
        
        weighted_risk = (
            domain_risk['risk_score'] * domain_weight +
            permission_risk['risk_score'] * permission_weight +
            package_risk['risk_score'] * package_weight
        )
        
        # 如果任一項目風險極高，則總風險也應該很高
        max_individual_risk = max(
            domain_risk['risk_score'],
            permission_risk['risk_score'],
            package_risk['risk_score']
        )
        
        # 使用加權平均和最高個別風險的較大值
        total_risk = max(weighted_risk, max_individual_risk * 0.8)
        
        # 合併所有風險原因
        all_reasons = (
            domain_risk['reasons'] + 
            permission_risk['reasons'] + 
            package_risk['reasons']
        )
        
        # 確定風險等級和建議
        if total_risk >= 0.7:
            risk_level = "HIGH"
            recommendation = "拒絕 - 檢測到高安全風險"
        elif total_risk >= 0.4:
            risk_level = "MEDIUM" 
            recommendation = "警告 - 請謹慎處理"
        else:
            risk_level = "LOW"
            recommendation = "批准 - 檢測到低風險"
        
        return {
            "risk_level": risk_level,
            "confidence": round(total_risk, 2),
            "reasons": all_reasons,
            "recommendation": recommendation,
            "risk_breakdown": {
                "domain_risk": round(domain_risk['risk_score'], 2),
                "permission_risk": round(permission_risk['risk_score'], 2),
                "package_risk": round(package_risk['risk_score'], 2),
                "weighted_score": round(weighted_risk, 2),
                "final_score": round(total_risk, 2)
            },
            "details": {
                "analyzed_packages": package_risk['analyzed_packages'],
                "high_risk_permissions": permission_risk.get('high_risk_permissions', 0),
                "timestamp": datetime.now().isoformat()
            }
        }

    async def classify_smart_contract_vulnerability(self, move_code: str) -> Dict:
        """
        使用 LoRA 微調的 Llama-2 模型對 Move 智能合約代碼進行漏洞分類
        分類為：reentrancy, overflow, access_control, logic_error, randomness_error, safe
        """
        try:
            if not self.model or not self.tokenizer:
                return {
                    "classification": "safe",
                    "confidence": 0.0,
                    "reasoning": "模型未初始化",
                    "error": "Model not initialized"
                }
            
            # 構建提示詞
            instruction = "請找出Sui smart contract的惡意漏洞，並判斷危險等級"
            prompt = f"{instruction}\n{move_code}"
            
            # 分詞
            input_ids = self.tokenizer(
                prompt,
                return_tensors="pt",
                max_length=1024,
                truncation=True
            ).input_ids
            
            # 移至 GPU（如果可用）
            if torch.cuda.is_available():
                input_ids = input_ids.to('cuda')
            
            # 生成預測
            with torch.no_grad():
                output_ids = self.model.generate(
                    input_ids=input_ids,
                    max_new_tokens=128,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # 解碼輸出
            output_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
            
            # 提取分類標籤
            classification = self.extract_label(output_text)
            
            # 解析危險等級
            confidence = 0.5  # 默認信心度
            if "危險等級：高" in output_text or "高風險" in output_text:
                confidence = 0.9
                risk_level = "HIGH"
            elif "危險等級：中" in output_text or "中風險" in output_text:
                confidence = 0.6
                risk_level = "MEDIUM"
            elif "危險等級：低" in output_text or "低風險" in output_text:
                confidence = 0.3
                risk_level = "LOW"
            else:
                risk_level = "UNKNOWN"
            
            # 映射到標準分類
            classification_map = {
                "reentrancy": "access_control",
                "overflow": "logic_error",
                "access_control": "access_control",
                "logic_error": "logic_error",
                "randomness_error": "randomness_error",
                "safe": "safe",
                "other_bug": "logic_error"
            }
            
            standard_classification = classification_map.get(classification, "safe")
            
            # 構建概率分布
            probabilities = {
                "access_control": 0.0,
                "logic_error": 0.0,
                "randomness_error": 0.0,
                "safe": 0.0
            }
            
            # 根據分類設置概率
            if standard_classification in probabilities:
                probabilities[standard_classification] = confidence
                # 分配剩餘概率給其他類別
                remaining_prob = 1.0 - confidence
                other_count = len(probabilities) - 1
                for key in probabilities:
                    if key != standard_classification:
                        probabilities[key] = remaining_prob / other_count
            else:
                probabilities["safe"] = 1.0
            
            # 計算風險分數
            classification_result = {
                "classification": standard_classification,
                "probabilities": probabilities,
                "max_probability": confidence,
                "reasoning": output_text,
                "original_classification": classification,
                "risk_level": risk_level
            }
            
            risk_score = self._calculate_probability_based_risk_score(classification_result)
            classification_result["risk_score"] = risk_score
            
            return classification_result
                        
        except Exception as e:
            return {
                "classification": "safe",
                "probabilities": {
                    "access_control": 0.0,
                    "logic_error": 0.0,
                    "randomness_error": 0.0,
                    "safe": 1.0
                },
                "max_probability": 1.0,
                "risk_score": 0,
                "reasoning": f"ML classification failed: {str(e)}",
                "error": f"Exception: {str(e)}"
            }

    def _calculate_probability_based_risk_score(self, ml_result: Dict) -> int:
        """
        基於機率分布計算100分制風險分數
        
        計算策略：
        1. 取最高機率的漏洞類型
        2. 根據機率高低在該類型分數區間內計算具體分數
        3. 考慮信心度調整最終分數
        """
        try:
            classification = ml_result.get("classification", "safe")
            probabilities = ml_result.get("probabilities", {})
            max_probability = ml_result.get("max_probability", 0.0)
            
            # 獲取該分類的分數區間
            score_range = self.vulnerability_score_ranges.get(classification, (0, 19))
            min_score, max_score = score_range
            
            # 基於最高機率計算在區間內的具體分數
            # 機率越高，分數越接近區間上限
            base_score = min_score + (max_score - min_score) * max_probability
            
            # 信心度調整
            confidence_adjustment = self._get_confidence_adjustment(max_probability)
            final_score = base_score * confidence_adjustment
            
            # 多類別機率加權 (考慮其他類別的影響)
            weighted_score = self._apply_multi_class_weighting(probabilities, final_score)
            
            return int(round(min(max(weighted_score, 0), 100)))
            
        except Exception as e:
            print(f"風險分數計算錯誤: {e}")
            return 0

    def _get_confidence_adjustment(self, max_probability: float) -> float:
        """根據信心度調整分數係數"""
        if max_probability >= self.confidence_thresholds["high_confidence"]:
            return 1.0  # 高信心度，不調整
        elif max_probability >= self.confidence_thresholds["medium_confidence"]:
            return 0.8  # 中信心度，適度降低
        elif max_probability >= self.confidence_thresholds["low_confidence"]:
            return 0.6  # 低信心度，明顯降低
        else:
            # 極低信心度：傾向於報告為"風險不明"的中低分數區域
            return 0.3  # 大幅降低，避免高風險誤報

    def _apply_multi_class_weighting(self, probabilities: Dict, base_score: float) -> float:
        """
        應用多類別機率加權
        考慮其他漏洞類型的機率對最終分數的影響
        """
        try:
            # 計算加權風險貢獻
            weighted_contribution = 0.0
            
            for vuln_type, probability in probabilities.items():
                if vuln_type == "safe":
                    continue  # 跳過安全類別
                
                # 獲取該漏洞類型的中位分數
                score_range = self.vulnerability_score_ranges.get(vuln_type, (0, 19))
                mid_score = (score_range[0] + score_range[1]) / 2
                
                # 加權貢獻 = 機率 × 該類型中位分數
                weighted_contribution += probability * mid_score
            
            # 結合基礎分數和加權貢獻 (70% 基礎 + 30% 加權)
            final_score = (base_score * 0.7) + (weighted_contribution * 0.3)
            
            return final_score
            
        except Exception as e:
            print(f"多類別加權計算錯誤: {e}")
            return base_score

    def _convert_score_to_risk_level(self, risk_score: int) -> tuple:
        """
        將100分制風險分數轉換為風險等級和建議
        
        Args:
            risk_score: 0-100的風險分數
            
        Returns:
            tuple: (risk_level, recommendation, normalized_score)
        """
        # 將100分制轉換為0-1範圍 (用於相容性)
        normalized_score = risk_score / 100.0
        
        if risk_score >= 70:
            return "HIGH", "🚫 拒絕 - 檢測到高安全風險 (ML分析)", normalized_score
        elif risk_score >= 40:
            return "MEDIUM", "⚠️ 警告 - 請謹慎處理 (ML分析)", normalized_score
        elif risk_score >= 20:
            return "LOW", "✅ 可接受 - 檢測到低風險 (ML分析)", normalized_score
        else:
            return "SAFE", "✅ 批准 - 未檢測到明顯風險 (ML分析)", normalized_score

    async def analyze_with_ml_integration(self, domain: str, permissions: List[str], 
                                        package_analyses: List[Dict], move_source_code: str = "") -> Dict:
        """
        結合規則引擎和機器學習的綜合風險分析
        """
        try:
            # 基礎規則引擎分析
            rule_based_analysis = self.calculate_overall_risk(domain, permissions, package_analyses)
            
            # 機器學習智能合約漏洞分類
            ml_classification = None
            ml_risk_score = 0.0
            
            if move_source_code.strip():
                ml_classification = await self.classify_smart_contract_vulnerability(move_source_code)
                # 使用新的100分制風險分數 (轉換為0-1範圍)
                ml_risk_score = ml_classification.get('risk_score', 0) / 100.0
            
            # 合併風險分析結果
            rule_risk_score = rule_based_analysis['risk_breakdown']['final_score']
            
            # 計算綜合風險分數
            if ml_classification and ml_classification.get('confidence', 0) > 0.3:
                # ML 分類可信度高時，給予更高權重
                final_risk_score = (ml_risk_score * 0.6) + (rule_risk_score * 0.4)
                confidence_boost = 0.1
            else:
                # ML 分類不可用或可信度低時，主要依賴規則引擎
                final_risk_score = (rule_risk_score * 0.8) + (ml_risk_score * 0.2)
                confidence_boost = 0.0
            
            # 重新確定風險等級
            if final_risk_score >= 0.7:
                risk_level = "HIGH"
                recommendation = "拒絕 - 檢測到高安全風險（ML+規則引擎）"
            elif final_risk_score >= 0.4:
                risk_level = "MEDIUM"
                recommendation = "警告 - 請謹慎處理（ML+規則引擎）"
            else:
                risk_level = "LOW"
                recommendation = "批准 - 檢測到低風險（ML+規則引擎）"
            
            # 合併風險原因
            all_reasons = rule_based_analysis['reasons'].copy()
            if ml_classification and ml_classification.get('classification') != 'safe':
                all_reasons.append(
                    f"ML檢測到智能合約漏洞: {ml_classification['classification']} "
                    f"(信心度: {ml_classification.get('confidence', 0):.2f})"
                )
            
            return {
                "risk_level": risk_level,
                "confidence": round(final_risk_score + confidence_boost, 2),
                "reasons": all_reasons,
                "recommendation": recommendation,
                "risk_breakdown": {
                    **rule_based_analysis['risk_breakdown'],
                    "ml_vulnerability_score": round(ml_risk_score, 2),
                    "final_combined_score": round(final_risk_score, 2)
                },
                "ml_analysis": ml_classification,
                "details": {
                    **rule_based_analysis['details'],
                    "ml_enabled": bool(move_source_code.strip()),
                    "analysis_method": "hybrid_ml_rules",
                    "ml_risk_score_100": ml_classification.get('risk_score', 0) if ml_classification else 0,
                    "ml_probabilities": ml_classification.get('probabilities', {}) if ml_classification else {}
                }
            }
            
        except Exception as e:
            # 如果ML分析失敗，回退到純規則引擎
            rule_analysis = self.calculate_overall_risk(domain, permissions, package_analyses)
            rule_analysis['details']['ml_analysis_error'] = str(e)
            rule_analysis['details']['analysis_method'] = "rules_only_fallback"
            return rule_analysis
