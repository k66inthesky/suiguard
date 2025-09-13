import asyncio
from playwright.async_api import async_playwright
import re
import requests
import os
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class PackageVersionService:
    """智能合約包版本分析服務"""
    
    def __init__(self):
        # 優先使用 SUI_RPC_PROVIDER_URL，然後是 SUI_RPC_PUBLIC_URL
        self.rpc_url = (
            os.getenv("SUI_RPC_PROVIDER_URL") or 
            os.getenv("SUI_RPC_PUBLIC_URL") or 
            "https://fullnode.mainnet.sui.io:443"
        )
        self.timeout = 8  # RPC 請求超時時間
        self.browser_timeout = 2000  # 瀏覽器等待時間
    
    async def analyze_package_version(self, package_id: str) -> Dict[str, Any]:
        """
        分析智能合約包的版本信息
        
        Args:
            package_id: 智能合約包ID
            
        Returns:
            Dict包含版本分析結果
        """
        try:
            logger.info(f"開始分析包版本: {package_id}")
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)  # 生產環境使用 headless
                page = await browser.new_page()
                
                try:
                    # 訪問 SuiVision 頁面
                    await page.goto(f"https://suivision.xyz/package/{package_id}?tab=Code")
                    await page.wait_for_timeout(self.browser_timeout)
                    
                    # 獲取版本信息
                    current_version = await self._extract_current_version(page)
                    if current_version is None:
                        return {"error": "無法獲取當前版本信息", "package_id": package_id}
                    
                    logger.info(f"當前版本: {current_version}")
                    
                    # 獲取模組列表和前一版本信息
                    modules = await self._extract_modules(page)
                    logger.info(f"找到模組: {modules}")
                    
                    if not modules:
                        return {
                            "package_id": package_id,
                            "current_version": current_version,
                            "previous_version_info": None,
                            "modules": [],
                            "status": "success"
                        }
                    
                    # 分析前一版本
                    previous_info = await self._analyze_previous_version(
                        page, modules, package_id, current_version
                    )
                    
                    result = {
                        "package_id": package_id,
                        "current_version": current_version,
                        "previous_version_info": previous_info,
                        "modules": modules,
                        "status": "success"
                    }
                    
                    logger.info(f"版本分析完成: {result}")
                    return result
                    
                finally:
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"版本分析錯誤 {package_id}: {e}")
            return {
                "error": f"版本分析失敗: {str(e)}",
                "package_id": package_id,
                "status": "failed"
            }
    
    async def _extract_current_version(self, page) -> Optional[int]:
        """從頁面提取當前版本號"""
        try:
            sections = await page.query_selector_all('section')
            if not sections:
                return None
                
            details_text = await sections[0].inner_text()
            lines = details_text.splitlines()
            
            for i, line in enumerate(lines):
                if "Version:" in line and i + 1 < len(lines):
                    ver_line = lines[i + 1].strip()
                    if ver_line.isdigit():
                        return int(ver_line)
            return None
        except Exception as e:
            logger.error(f"提取版本號錯誤: {e}")
            return None
    
    async def _extract_modules(self, page) -> list:
        """從頁面提取模組列表"""
        try:
            all_li = await page.query_selector_all("li")
            modules = []
            exclude = {
                "Publisher:", "Publish Time:", "Last Transaction ID:", 
                "Version:", "Owner:", "Transaction Blocks", "Code", 
                "Statistics", "Bytecode"
            }
            
            for li in all_li:
                txt = (await li.inner_text()).strip()
                if (txt and 
                    re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", txt) and 
                    txt not in exclude):
                    modules.append(txt)
            
            return modules
        except Exception as e:
            logger.error(f"提取模組列表錯誤: {e}")
            return []
    
    async def _analyze_previous_version(self, page, modules: list, current_package_id: str, current_version: int) -> Optional[Dict[str, Any]]:
        """分析前一版本信息"""
        try:
            checked_packages = set()
            
            for module_name in modules:
                try:
                    # 點擊模組獲取代碼
                    li_elements = await page.query_selector_all("li")
                    target_li = None
                    
                    for li in li_elements:
                        txt = (await li.inner_text()).strip()
                        if txt == module_name:
                            target_li = li
                            break
                    
                    if not target_li:
                        continue
                    
                    await target_li.click()
                    await page.wait_for_timeout(1000)
                    
                    # 獲取代碼內容
                    code_elements = await page.query_selector_all("code")
                    
                    for code_el in code_elements:
                        code_text = await code_el.inner_text()
                        if not code_text or code_text.strip().lower() == "null":
                            continue
                        
                        logger.debug(f"模組 {module_name} 代碼片段: {code_text[:80]}")
                        
                        # 提取前一版本的 package ID
                        match = re.search(r'module (0x[a-f0-9]{64})::', code_text)
                        if not match:
                            logger.debug(f"模組 {module_name}: 代碼中沒有找到 package_id")
                            break
                        
                        prev_package_id = match.group(1)
                        logger.debug(f"模組 {module_name} 前版本 package_id: {prev_package_id}")
                        
                        if prev_package_id == current_package_id or prev_package_id in checked_packages:
                            break
                        
                        checked_packages.add(prev_package_id)
                        
                        # 通過 RPC 查詢前一版本信息
                        prev_info = await self._query_previous_package_info(
                            prev_package_id, current_version
                        )
                        
                        if prev_info:
                            return prev_info
                        
                        break
                        
                except Exception as e:
                    logger.error(f"分析模組 {module_name} 錯誤: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"分析前一版本錯誤: {e}")
            return None
    
    async def _query_previous_package_info(self, package_id: str, expected_version: int) -> Optional[Dict[str, Any]]:
        """通過 RPC 查詢前一版本包信息"""
        try:
            headers = {'Content-Type': 'application/json'}
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getObject",
                "params": [
                    package_id,
                    {
                        "showType": True,
                        "showOwner": True, 
                        "showPreviousTransaction": True,
                        "showContent": True
                    }
                ]
            }
            
            response = requests.post(
                self.rpc_url, 
                headers=headers, 
                json=payload, 
                timeout=self.timeout
            )
            
            data = response.json().get("result", {}).get("data", {})
            if not data:
                return None
            
            version = int(data.get("version", 0))
            logger.debug(f"RPC 版本查詢結果: {version}")
            
            # 檢查是否為期望的前一版本
            if version == expected_version - 1:
                transaction_id = data.get("previousTransaction")
                publish_time = await self._get_transaction_timestamp(transaction_id)
                
                return {
                    "package_id": package_id,
                    "version": version,
                    "publish_time": publish_time,
                    "transaction_id": transaction_id
                }
            
            return None
            
        except Exception as e:
            logger.error(f"RPC 查詢錯誤: {e}")
            return None
    
    async def _get_transaction_timestamp(self, transaction_id: str) -> Optional[str]:
        """獲取交易時間戳"""
        try:
            if not transaction_id:
                return None
                
            headers = {'Content-Type': 'application/json'}
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getTransactionBlock",
                "params": [
                    transaction_id,
                    {
                        "showInput": False,
                        "showRawInput": False, 
                        "showEffects": False,
                        "showEvents": False
                    }
                ]
            }
            
            response = requests.post(
                self.rpc_url,
                headers=headers,
                json=payload, 
                timeout=self.timeout
            )
            
            timestamp_ms = response.json()["result"].get("timestampMs")
            if timestamp_ms:
                dt = datetime.fromtimestamp(int(timestamp_ms) / 1000)
                return dt.strftime("%Y-%m-%d %H:%M:%S")
            
            return None
            
        except Exception as e:
            logger.error(f"獲取交易時間戳錯誤: {e}")
            return None

    async def batch_analyze_versions(self, package_ids: list) -> Dict[str, Any]:
        """批量分析多個包的版本信息"""
        results = []
        
        for package_id in package_ids:
            try:
                result = await self.analyze_package_version(package_id)
                # 🎯 轉換為新的響應格式
                formatted_result = self._format_version_response(result)
                results.append(formatted_result)
            except Exception as e:
                logger.error(f"批量分析錯誤 {package_id}: {e}")
                results.append(f"Error analyzing {package_id}: {str(e)}")
        
        return {
            "total_packages": len(package_ids),
            "results": results,
            "timestamp": datetime.now().isoformat() + "Z"
        }
    
    def _format_version_response(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """將分析結果轉換為新的響應格式"""
        try:
            # 如果分析失敗，返回錯誤信息
            if analysis_result.get("status") == "failed" or "error" in analysis_result:
                error_msg = analysis_result.get("error", "Analysis failed")
                return f"Error: {error_msg}"
            
            current_package_id = analysis_result.get("package_id")
            current_version = analysis_result.get("current_version")
            previous_info = analysis_result.get("previous_version_info")
            
            # 如果沒有找到前一版本
            if not previous_info:
                if current_version and current_version > 1:
                    return f"No Last Version Found for {current_package_id}. Current version is {current_version}."
                else:
                    return f"No Last Version. Maybe last version is 1."
            
            # 🎯 新的響應格式
            formatted_response = {
                "CUR_PKG_ID": current_package_id,
                "CUR_PKG_VER": current_version,
                "CUR_PKG_TIME": self._get_current_package_time(current_package_id),  # 需要獲取當前包的時間
                "LAST_PKG_ID": previous_info.get("package_id"),
                "LAST_PKG_VER": previous_info.get("version"),
                "LAST_PKG_TIME": previous_info.get("publish_time")
            }
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"格式化響應錯誤: {e}")
            return f"Error formatting response: {str(e)}"
    
    def _get_current_package_time(self, package_id: str) -> str:
        """獲取當前包的發布時間（簡化版）"""
        try:
            headers = {'Content-Type': 'application/json'}
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getObject",
                "params": [
                    package_id,
                    {
                        "showType": True,
                        "showOwner": True, 
                        "showPreviousTransaction": True,
                        "showContent": True
                    }
                ]
            }
            
            response = requests.post(
                self.rpc_url, 
                headers=headers, 
                json=payload, 
                timeout=self.timeout
            )
            
            data = response.json().get("result", {}).get("data", {})
            if data:
                transaction_id = data.get("previousTransaction")
                if transaction_id:
                    # 簡化版本：直接用同步方式獲取時間戳
                    timestamp = self._get_transaction_timestamp_sync(transaction_id)
                    return timestamp or "Unknown"
            
            return "Unknown"
            
        except Exception as e:
            logger.error(f"獲取當前包時間錯誤: {e}")
            return "Unknown"
    
    def _get_transaction_timestamp_sync(self, transaction_id: str) -> Optional[str]:
        """同步獲取交易時間戳"""
        try:
            if not transaction_id:
                return None
                
            headers = {'Content-Type': 'application/json'}
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "sui_getTransactionBlock",
                "params": [
                    transaction_id,
                    {
                        "showInput": False,
                        "showRawInput": False, 
                        "showEffects": False,
                        "showEvents": False
                    }
                ]
            }
            
            response = requests.post(
                self.rpc_url,
                headers=headers,
                json=payload, 
                timeout=self.timeout
            )
            
            result = response.json().get("result", {})
            timestamp_ms = result.get("timestampMs")
            if timestamp_ms:
                dt = datetime.fromtimestamp(int(timestamp_ms) / 1000)
                return dt.strftime("%Y-%m-%d %H:%M:%S")
            
            return None
            
        except Exception as e:
            logger.error(f"同步獲取交易時間戳錯誤: {e}")
            return None
