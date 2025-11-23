from typing import List, Dict, Optional
import re
from datetime import datetime
import json
import aiohttp
import os
import logging

logger = logging.getLogger(__name__)

class RiskEngine:
    """風險評估引擎 - 
    負責分析域名、權限和智能合約包的風險等級
    提供綜合性的安全風險評估和建議
    """
    
    def __init__(self):
        # ML 服務配置 (通過 HTTP 調用獨立服務)
        self.ml_service_url = os.getenv("ML_SERVICE_URL", "http://localhost:8081")
        self.ml_service_enabled = os.getenv("ENABLE_ML_SERVICE", "true").lower() == "true"
        self.ml_service_timeout = int(os.getenv("ML_SERVICE_TIMEOUT", "30"))
        
        logger.info(f"🔧 RiskEngine 初始化: ML 服務={'啟用' if self.ml_service_enabled else '禁用'}")
        if self.ml_service_enabled:
            logger.info(f"🔗 ML 服務 URL: {self.ml_service_url}")
        
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
        通過 HTTP 調用獨立 ML 服務進行智能合約漏洞分類
        分類為：access_control, logic_error, randomness_error, safe
        """
        try:
            if not self.ml_service_enabled:
                logger.info("ML 服務已禁用，返回安全分類")
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
                    "risk_level": "SAFE",
                    "reasoning": "ML 服務已禁用",
                    "service_status": "disabled"
                }
            
            # 調用 ML 服務
            url = f"{self.ml_service_url}/api/analyze-vulnerability"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json={"move_code": move_code},
                    timeout=aiohttp.ClientTimeout(total=self.ml_service_timeout)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"✅ ML 服務分析完成: {result.get('classification')} (分數: {result.get('risk_score')})")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ ML 服務返回錯誤: {response.status} - {error_text}")
                        raise Exception(f"ML service returned {response.status}")
                        
        except asyncio.TimeoutError:
            logger.warning("⏱️ ML 服務超時，返回安全分類")
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
                "risk_level": "SAFE",
                "reasoning": "ML 服務超時",
                "error": "timeout"
            }
        except Exception as e:
            logger.error(f"❌ ML 分類失敗: {e}")
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
                "risk_level": "SAFE",
                "reasoning": f"ML 服務錯誤: {str(e)}",
                "error": str(e)
            }

    def _calculate_probability_based_risk_score(self, ml_result: Dict) -> int:
        """
        基於機率分布計算100分制風險分數
        （注意：ML 服務已經計算好 risk_score，此方法用於兼容性）
        """
        # ML 服務已經計算好風險分數，直接返回
        if "risk_score" in ml_result:
            return ml_result["risk_score"]
        
        # 回退邏輯（如果 ML 服務未提供 risk_score）
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
                # 使用 ML 100 分制風險分數判斷等級
                ml_score_100 = ml_classification.get('risk_score', 0)
                if ml_score_100 >= 70:
                    risk_level = "HIGH"
                    recommendation = "Reject - High security risk detected (ML+Rules)"
                elif ml_score_100 >= 40:
                    risk_level = "MEDIUM"
                    recommendation = "Warning - Please proceed with caution (ML+Rules)"
                else:
                    risk_level = "LOW"
                    recommendation = "Approve - Low risk detected (ML+Rules)"
            else:
                # ML 分類不可用或可信度低時，主要依賴規則引擎
                final_risk_score = (rule_risk_score * 0.8) + (ml_risk_score * 0.2)
                confidence_boost = 0.0
                # 如果有 ML 分數，使用 ML 100 分制判斷（即使信心度低）
                if ml_classification and ml_classification.get('risk_score', 0) > 0:
                    ml_score_100 = ml_classification.get('risk_score', 0)
                    if ml_score_100 >= 70:
                        risk_level = "HIGH"
                        recommendation = "Reject - High security risk detected (ML+Rules)"
                    elif ml_score_100 >= 40:
                        risk_level = "MEDIUM"
                        recommendation = "Warning - Please proceed with caution (ML+Rules)"
                    else:
                        risk_level = "LOW"
                        recommendation = "Approve - Low risk detected (ML+Rules)"
                else:
                    # 純規則引擎判斷
                    if final_risk_score >= 0.7:
                        risk_level = "HIGH"
                        recommendation = "Reject - High security risk detected (Rules)"
                    elif final_risk_score >= 0.4:
                        risk_level = "MEDIUM"
                        recommendation = "Warning - Please proceed with caution (Rules)"
                    else:
                        risk_level = "LOW"
                        recommendation = "Approve - Low risk detected (Rules)"
            
            # 合併風險原因
            all_reasons = rule_based_analysis['reasons'].copy()
            if ml_classification and ml_classification.get('classification') != 'safe':
                all_reasons.append(
                    f"ML detected smart contract vulnerability: {ml_classification['classification']} "
                    f"(confidence: {ml_classification.get('confidence', 0):.2f})"
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
                    "ml_probabilities": ml_classification.get('probabilities', {}) if ml_classification else {},
                    "processing_time": ml_classification.get('processing_time', 0) if ml_classification else 0
                }
            }
            
        except Exception as e:
            # 如果ML分析失敗，回退到純規則引擎
            rule_analysis = self.calculate_overall_risk(domain, permissions, package_analyses)
            rule_analysis['details']['ml_analysis_error'] = str(e)
            rule_analysis['details']['analysis_method'] = "rules_only_fallback"
            return rule_analysis
