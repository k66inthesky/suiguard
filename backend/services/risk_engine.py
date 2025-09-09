from typing import List, Dict, Optional
import re
from datetime import datetime

class RiskEngine:
    """風險評估引擎 - 完整版
    
    負責分析域名、權限和智能合約包的風險等級
    提供綜合性的安全風險評估和建議
    """
    
    def __init__(self):
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
