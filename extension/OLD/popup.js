class SUIBlocklistDetector {
    constructor() {
        this.blocklists = {
            coin: [],
            object: [],
            domain: [],
            package: []
        };
        this.baseUrls = {
            coin: 'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/coin-list.json',
            object: 'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/object-list.json',
            domain: 'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/domain-list.json',
            package: 'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/package-list.json'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBlocklists();
        this.showPage('home'); // 預設顯示首頁
    }

    bindEvents() {
        // 原有的功能事件監聽器
        document.getElementById('checkBtn').addEventListener('click', () => this.checkAddress());
        document.getElementById('reportBtn').addEventListener('click', () => this.reportAddress());
        
        // Enter鍵觸發檢測
        document.getElementById('addressInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.checkAddress();
            }
        });

        // 新增：頁面導航事件
        document.getElementById('checkPageBtn').addEventListener('click', () => this.showPage('check'));
        document.getElementById('reportPageBtn').addEventListener('click', () => this.showPage('report'));
        document.getElementById('backFromCheck').addEventListener('click', () => this.showPage('home'));
        document.getElementById('backFromReport').addEventListener('click', () => this.showPage('home'));
    }

    // 新增：頁面切換方法
    showPage(pageName) {
        // 隱藏所有頁面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        // 顯示指定頁面
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
        
        // 清空結果框
        const checkResult = document.getElementById('checkResult');
        const reportResult = document.getElementById('reportResult');
        if (checkResult) checkResult.style.display = 'none';
        if (reportResult) reportResult.style.display = 'none';
        
        console.log(`📱 切換到頁面: ${pageName}`);
    }

    async loadBlocklists() {
        console.log('🔄 開始載入 GitHub blocklists...');
        
        try {
            // 添加載入指示器
            this.showLoadingStatus('正在從 GitHub 載入黑名單...');
            
            // 檢查網路連線
            if (!navigator.onLine) {
                throw new Error('網路連線異常，請檢查網路狀態');
            }
            
            const promises = Object.entries(this.baseUrls).map(async ([type, url]) => {
                try {
                    console.log(`📡 正在載入 ${type} blocklist from: ${url}`);
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache',
                            'User-Agent': 'SUI-Guard-Extension/1.0'
                        },
                        mode: 'cors'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log(`📄 ${type} 原始資料格式:`, data);
                    
                    // 修正資料格式處理 - 關鍵修正！
                    if (data && data.blocklist && Array.isArray(data.blocklist)) {
                        this.blocklists[type] = data.blocklist;
                        console.log(`✅ ${type} blocklist 載入成功: ${data.blocklist.length} 筆記錄`);
                    } else if (Array.isArray(data)) {
                        // 備用：如果資料直接就是陣列格式
                        this.blocklists[type] = data;
                        console.log(`✅ ${type} blocklist 載入成功 (直接陣列): ${data.length} 筆記錄`);
                    } else {
                        console.warn(`⚠️ ${type} blocklist 格式錯誤或為空，資料:`, data);
                        this.blocklists[type] = [];
                    }
                    
                } catch (error) {
                    console.error(`❌ 載入 ${type} blocklist 失敗:`, error);
                    this.blocklists[type] = [];
                    
                    // 更詳細的錯誤分析
                    if (error.message.includes('Failed to fetch')) {
                        console.error(`網路連線問題: 無法連接到 GitHub`);
                    } else if (error.message.includes('CORS')) {
                        console.error(`跨域請求問題: ${error.message}`);
                    } else if (error.message.includes('HTTP')) {
                        console.error(`HTTP 錯誤: ${error.message}`);
                    } else {
                        console.error(`其他錯誤: ${error.message}`);
                    }
                }
            });

            await Promise.all(promises);
            
            // 統計載入結果
            const stats = this.getLoadingStats();
            console.log('📊 Blocklists 載入完成:', stats);
            
            // 更新 UI 狀態
            this.updateLoadingStatus(stats);
            
        } catch (error) {
            console.error('❌ 載入 blocklists 時發生嚴重錯誤:', error);
            this.showLoadingStatus(`載入失敗：${error.message}`, 'error');
        }
    }

    // 載入統計
    getLoadingStats() {
        const stats = {
            total: 0,
            loaded: 0,
            failed: 0,
            details: {}
        };
        
        Object.entries(this.blocklists).forEach(([type, list]) => {
            stats.total++;
            if (list.length > 0) {
                stats.loaded++;
                stats.details[type] = list.length;
            } else {
                stats.failed++;
                stats.details[type] = 0;
            }
        });
        
        return stats;
    }

    // 更新：使用新的狀態文字元素
    showLoadingStatus(message, type = 'info') {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.innerHTML = message;
            
            switch(type) {
                case 'success':
                    statusText.style.color = '#4CAF50';
                    break;
                case 'error':
                    statusText.style.color = '#F44336';
                    break;
                case 'warning':
                    statusText.style.color = '#FF9800';
                    break;
                default:
                    statusText.style.color = '#2196F3';
            }
        }
    }

    // 更新載入狀態顯示
    updateLoadingStatus(stats) {
        const totalEntries = Object.values(stats.details).reduce((sum, count) => sum + count, 0);
        
        if (stats.loaded === stats.total && totalEntries > 0) {
            this.showLoadingStatus(
                `📡 GitHub 黑名單載入成功 (${totalEntries} 筆記錄)`, 
                'success'
            );
        } else if (stats.loaded > 0) {
            this.showLoadingStatus(
                `⚠️ 部分載入成功 (${stats.loaded}/${stats.total} 個檔案，${totalEntries} 筆記錄)`, 
                'warning'
            );
        } else {
            this.showLoadingStatus(
                '❌ 無法載入黑名單，請檢查網路連線或權限設定', 
                'error'
            );
        }
    }

    async checkAddress() {
        const addressType = document.getElementById('addressType').value;
        const addressInput = document.getElementById('addressInput').value.trim();
        const resultDiv = document.getElementById('checkResult');
        const checkBtn = document.getElementById('checkBtn');

        if (!addressInput) {
            this.showResult(resultDiv, '請輸入要檢測的地址', 'error');
            return;
        }

        // 檢查黑名單是否已載入
        const stats = this.getLoadingStats();
        if (stats.loaded === 0) {
            this.showResult(resultDiv, '❌ 黑名單尚未載入或載入失敗，請重新整理擴展', 'error');
            console.warn('🚨 檢測失敗：沒有載入任何黑名單資料');
            console.log('📊 當前 blocklists 狀態:', this.blocklists);
            return;
        }

        // 顯示載入狀態
        checkBtn.innerHTML = '<span class="spinner"></span>檢測中...';
        checkBtn.classList.add('loading');

        try {
            const addresses = addressInput.split('\n').map(addr => addr.trim()).filter(addr => addr);
            const results = [];

            for (const address of addresses) {
                const isBlacklisted = this.isAddressBlacklisted(address, addressType);
                results.push({
                    address,
                    isBlacklisted
                });
                console.log(`🔍 檢測地址: ${address} (${addressType}) -> ${isBlacklisted ? '❌ 黑名單' : '✅ 安全'}`);
            }

            this.displayCheckResults(results, resultDiv);

        } catch (error) {
            console.error('❌ 檢測過程錯誤:', error);
            this.showResult(resultDiv, '檢測過程中發生錯誤', 'error');
        } finally {
            checkBtn.innerHTML = '🔍 檢測黑名單';
            checkBtn.classList.remove('loading');
        }
    }

    isAddressBlacklisted(address, type) {
        const blocklist = this.blocklists[type] || [];
        
        if (blocklist.length === 0) {
            console.warn(`⚠️ ${type} blocklist is empty or not loaded`);
            return false;
        }
        
        console.log(`🔍 檢查 ${address} 是否在 ${type} 黑名單中 (${blocklist.length} 筆記錄)`);
        
        return blocklist.some(item => {
            // 處理字串格式
            if (typeof item === 'string') {
                const match = item.toLowerCase().trim() === address.toLowerCase().trim();
                if (match) {
                    console.log(`🎯 找到匹配項 (字串): ${item}`);
                }
                return match;
            }
            
            // 處理物件格式 (可能包含額外資訊)
            if (typeof item === 'object' && item !== null) {
                // 支援多種可能的屬性名稱
                const addressFields = ['address', 'id', 'domain', 'package_id', 'coin_type', 'value'];
                for (const field of addressFields) {
                    if (item[field]) {
                        const match = item[field].toLowerCase().trim() === address.toLowerCase().trim();
                        if (match) {
                            console.log(`🎯 找到匹配項 (物件.${field}): ${item[field]}`);
                            return true;
                        }
                    }
                }
            }
            
            return false;
        });
    }

    displayCheckResults(results, resultDiv) {
        const blacklistedCount = results.filter(r => r.isBlacklisted).length;
        const safeCount = results.length - blacklistedCount;

        let html = `
            <div class="result-summary">
                <p><strong>檢測結果摘要:</strong></p>
                <p>✅ 安全地址: ${safeCount} 個</p>
                <p>⚠️ 黑名單地址: ${blacklistedCount} 個</p>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
        `;

        results.forEach((result, index) => {
            const status = result.isBlacklisted ? '⚠️ 黑名單' : '✅ 安全';
            const statusClass = result.isBlacklisted ? 'danger' : 'safe';
            
            html += `
                <div class="address-result" style="margin-bottom: 10px; padding: 8px; border-radius: 4px; background: ${result.isBlacklisted ? '#ffebee' : '#e8f5e8'};">
                    <div style="font-weight: 500; color: ${result.isBlacklisted ? '#c62828' : '#2e7d32'};">
                        ${status}
                    </div>
                    <div style="font-size: 12px; color: #666; word-break: break-all; margin-top: 4px;">
                        ${result.address}
                    </div>
                </div>
            `;
        });

        const overallStatus = blacklistedCount > 0 ? 'danger' : 'safe';
        resultDiv.className = `result-box result-${overallStatus}`;
        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    }

    async reportAddress() {
        const reportType = document.getElementById('reportType').value;
        const reportAddress = document.getElementById('reportAddress').value.trim();
        const reportReason = document.getElementById('reportReason').value.trim();
        const resultDiv = document.getElementById('reportResult');
        const reportBtn = document.getElementById('reportBtn');

        if (!reportAddress) {
            this.showResult(resultDiv, '請輸入要回報的地址', 'error');
            return;
        }

        if (!reportReason) {
            this.showResult(resultDiv, '請描述回報原因', 'error');
            return;
        }

        // 顯示載入狀態
        reportBtn.innerHTML = '<span class="spinner"></span>提交中...';
        reportBtn.classList.add('loading');

        // 模擬提交過程
        setTimeout(() => {
            const reportData = {
                type: reportType,
                address: reportAddress,
                reason: reportReason,
                timestamp: new Date().toISOString(),
                reporter: 'Chrome Extension User'
            };

            // 儲存到本地存儲（實際應用中應該發送到後端）
            this.saveReport(reportData);

            const successMessage = `
                <div>
                    <h4>📝 感謝您的回報！</h4>
                    <p><strong>回報類型:</strong> ${this.getTypeDisplayName(reportType)}</p>
                    <p><strong>可疑地址:</strong> ${reportAddress}</p>
                    <p><strong>回報時間:</strong> ${new Date().toLocaleString('zh-TW')}</p>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">
                        您的回報已記錄，我們會進行審核。感謝您為SUI生態系統的安全做出貢獻！
                    </p>
                </div>
            `;

            this.showResult(resultDiv, successMessage, 'success');

            // 清空表單
            document.getElementById('reportAddress').value = '';
            document.getElementById('reportReason').value = '';

            reportBtn.innerHTML = '📝 提交回報';
            reportBtn.classList.remove('loading');
        }, 1500);
    }

    getTypeDisplayName(type) {
        const names = {
            coin: 'Coin Address',
            object: 'Object ID',
            domain: 'Domain',
            package: 'Package ID'
        };
        return names[type] || type;
    }

    saveReport(reportData) {
        try {
            chrome.storage.local.get(['reports'], (result) => {
                const reports = result.reports || [];
                reports.push(reportData);
                chrome.storage.local.set({ reports }, () => {
                    console.log('📝 Report saved:', reportData);
                });
            });
        } catch (error) {
            console.error('❌ 儲存回報失敗:', error);
        }
    }

    showResult(element, message, type) {
        element.className = `result-box result-${type}`;
        element.innerHTML = message;
        element.style.display = 'block';

        // 自動隱藏成功訊息
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
}

// 測試函數 - 用於除錯
async function testFetch() {
    try {
        console.log('🧪 開始測試直接 fetch...');
        const response = await fetch('https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/coin-list.json');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 成功抓取資料');
            console.log('📄 資料格式:', data);
            console.log('📊 blocklist 長度:', data.blocklist ? data.blocklist.length : 'blocklist 屬性不存在');
            
            // 顯示前幾筆資料作為範例
            if (data.blocklist && data.blocklist.length > 0) {
                console.log('📋 前5筆資料範例:', data.blocklist.slice(0, 5));
            }
        } else {
            console.error('❌ Response 不成功:', response.statusText);
        }
    } catch (error) {
        console.error('❌ Fetch 錯誤:', error);
        console.error('❌ 錯誤類型:', error.name);
        console.error('❌ 錯誤訊息:', error.message);
    }
}

// 初始化擴展
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SUI Guard 擴展啟動中...');
    new SUIBlocklistDetector();
    
    // 5秒後執行網路測試（用於除錯）
    setTimeout(testFetch, 5000);
});