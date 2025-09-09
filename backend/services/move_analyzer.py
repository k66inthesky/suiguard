import aiohttp
import re
from typing import Dict, List, Optional
import json

class MoveCodeAnalyzer:
    """Move 程式碼分析器
    
    負責分析 Sui Move 智能合約的安全性
    檢測危險函數、可疑呼叫和高風險關鍵字
    """
    
    def __init__(self):
        self.rpc_url = "https://fullnode.mainnet.sui.io:443"
        
        # 危險函數清單
        self.dangerous_functions = [
            "transfer(", "withdraw(", "burn(", "mint(", "destroy(", 
            "delete(", "remove(", "clear(", "reset(", "init(", 
            "admin(", "owner(", "delegate(", "approve(", "sign(",
            "withdraw_all(", "transfer_all(", "approve_all(",
            "set_admin(", "change_owner(", "upgrade("
        ]
        
        # 可疑函數呼叫
        self.suspicious_calls = [
            "withdraw_all", "transfer_all", "approve_all", "burn_all",
            "destroy_all", "clear_all", "admin_transfer", "owner_only",
            "emergency_withdraw", "backdoor", "hidden_transfer"
        ]
        
        # 高風險關鍵字
        self.high_risk_keywords = [
            "backdoor", "hidden", "secret", "admin_only", "owner_only",
            "emergency", "exploit", "hack", "steal", "drain", "rug_pull"
        ]
    
    async def get_package_source(self, package_id: str) -> Optional[str]:
        """獲取包的源代碼
        
        Args:
            package_id: 包的ID
            
        Returns:
            包的源代碼字符串，如果失敗則返回None
        """
        try:
            print(f"🔍 獲取包源代碼: {package_id}")
            
            rpc_data = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getNormalizedMoveModulesByPackage",
                "params": [package_id]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.rpc_url, json=rpc_data, timeout=15) as resp:
                    if resp.status != 200:
                        print(f"❌ RPC 調用失敗: {resp.status}")
                        return None
                    
                    result = await resp.json()
                    
                    if "error" in result:
                        print(f"❌ RPC 錯誤: {result['error']}")
                        return None
                    
                    if "result" not in result:
                        print("❌ 響應中缺少 result 字段")
                        return None
                    
                    # 將模組轉換為可分析的文本
                    modules = result["result"]
                    source_text = ""
                    
                    for module_name, module_data in modules.items():
                        source_text += f"// Module: {module_name}\n"
                        
                        # 提取結構體
                        if "structs" in module_data:
                            for struct_name, struct_data in module_data["structs"].items():
                                source_text += f"struct {struct_name} {{\n"
                                if "fields" in struct_data:
                                    for field in struct_data["fields"]:
                                        source_text += f"  {field.get('name', 'unknown')}: {field.get('type', 'unknown')},\n"
                                source_text += "}\n\n"
                        
                        # 提取函數
                        if "exposedFunctions" in module_data:
                            for func_name, func_data in module_data["exposedFunctions"].items():
                                visibility = func_data.get("visibility", "private")
                                is_entry = func_data.get("isEntry", False)
                                
                                source_text += f"{visibility} "
                                if is_entry:
                                    source_text += "entry "
                                
                                source_text += f"fun {func_name}("
                                
                                # 參數
                                if "parameters" in func_data:
                                    params = []
                                    for param in func_data["parameters"]:
                                        params.append(f"param: {param}")
                                    source_text += ", ".join(params)
                                
                                source_text += ") {\n  // Function body\n}\n\n"
                    
                    return source_text if source_text else "// Empty package"
                    
        except Exception as e:
            print(f"❌ 獲取源代碼錯誤: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def analyze_dangerous_functions(self, source_code: str) -> List[str]:
        """分析危險函數"""
        found_functions = []
        
        for func in self.dangerous_functions:
            if func in source_code:
                found_functions.append(func)
        
        return found_functions
    
    def analyze_suspicious_calls(self, source_code: str) -> List[str]:
        """分析可疑函數呼叫"""
        found_calls = []
        
        for call in self.suspicious_calls:
            if call in source_code:
                found_calls.append(call)
        
        return found_calls
    
    def analyze_high_risk_keywords(self, source_code: str) -> List[str]:
        """分析高風險關鍵字"""
        found_keywords = []
        
        for keyword in self.high_risk_keywords:
            if keyword.lower() in source_code.lower():
                found_keywords.append(keyword)
        
        return found_keywords
    
    def calculate_complexity_score(self, source_code: str) -> int:
        """計算程式碼複雜度分數"""
        if not source_code:
            return 0
        
        # 基本行數
        lines = len(source_code.split('\n'))
        
        # 函數數量
        func_count = source_code.count('fun ')
        
        # 結構體數量
        struct_count = source_code.count('struct ')
        
        # 複雜度 = 行數 + 函數數*10 + 結構體數*5
        complexity = lines + (func_count * 10) + (struct_count * 5)
        
        return complexity
    
    def extract_entry_functions(self, source_code: str) -> List[str]:
        """提取入口函數"""
        entry_functions = []
        
        # 使用正則表達式查找 entry 函數
        pattern = r'entry\s+fun\s+(\w+)'
        matches = re.findall(pattern, source_code)
        entry_functions.extend(matches)
        
        # 也查找 public 函數
        pattern = r'public\s+fun\s+(\w+)'
        matches = re.findall(pattern, source_code)
        entry_functions.extend(matches)
        
        return list(set(entry_functions))  # 去重
    
    def determine_permission_level(self, dangerous_functions: List[str], 
                                 suspicious_calls: List[str], 
                                 high_risk_keywords: List[str]) -> str:
        """確定權限等級"""
        
        total_risk_items = len(dangerous_functions) + len(suspicious_calls) + len(high_risk_keywords)
        
        if total_risk_items >= 10:
            return "high"
        elif total_risk_items >= 5:
            return "medium"
        else:
            return "low"
    
    async def analyze_package(self, package_id: str, domain: str) -> Dict:
        """分析包的完整方法
        
        Args:
            package_id: 要分析的包ID
            domain: 請求來源的域名
            
        Returns:
            包含分析結果的字典
        """
        try:
            print(f"🔍 開始分析包: {package_id}")
            
            # 獲取源代碼
            source_code = await self.get_package_source(package_id)
            
            if not source_code:
                return {
                    "package_id": package_id,
                    "status": "failed",
                    "error": "無法獲取源代碼",
                    "domain": domain
                }
            
            # 進行各項分析
            dangerous_functions = self.analyze_dangerous_functions(source_code)
            suspicious_calls = self.analyze_suspicious_calls(source_code)
            high_risk_keywords = self.analyze_high_risk_keywords(source_code)
            complexity_score = self.calculate_complexity_score(source_code)
            entry_functions = self.extract_entry_functions(source_code)
            permission_level = self.determine_permission_level(
                dangerous_functions, suspicious_calls, high_risk_keywords
            )
            
            # 計算行數和模組數
            source_lines = len(source_code.split('\n'))
            module_count = source_code.count('// Module:')
            
            print(f"✅ 包分析完成: {package_id}")
            print(f"   - 危險函數: {len(dangerous_functions)}")
            print(f"   - 可疑呼叫: {len(suspicious_calls)}")
            print(f"   - 高風險關鍵字: {len(high_risk_keywords)}")
            print(f"   - 複雜度分數: {complexity_score}")
            
            return {
                "package_id": package_id,
                "dangerous_functions": dangerous_functions,
                "suspicious_calls": suspicious_calls,
                "high_risk_keywords": high_risk_keywords,
                "permission_level": permission_level,
                "complexity_score": complexity_score,
                "source_lines": source_lines,
                "module_count": module_count,
                "entry_functions": entry_functions,
                "status": "success",
                "domain": domain
            }
            
        except Exception as e:
            print(f"❌ 包分析錯誤: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "package_id": package_id,
                "status": "error",
                "error": str(e),
                "domain": domain
            }
