import * as vscode from 'vscode';
import { ZkLoginProvider } from './zklogin/zkLoginProvider';
import { CodeAnalyzer } from './analyzer/codeAnalyzer';
import { LoginViewProvider } from './views/loginViewProvider';
import { AuditViewProvider } from './views/auditViewProvider';

let zkLoginProvider: ZkLoginProvider;
let codeAnalyzer: CodeAnalyzer;

export function activate(context: vscode.ExtensionContext) {
    console.log('SuiAudit extension is now active!');

    // 初始化服務
    zkLoginProvider = new ZkLoginProvider(context);
    codeAnalyzer = new CodeAnalyzer();

    // 註冊視圖提供者
    const loginViewProvider = new LoginViewProvider(context, zkLoginProvider);
    const auditViewProvider = new AuditViewProvider(context, codeAnalyzer);

    // 註冊樹視圖
    vscode.window.createTreeView('suiguardLogin', {
        treeDataProvider: loginViewProvider,
        showCollapseAll: false
    });

    vscode.window.createTreeView('suiguardAudit', {
        treeDataProvider: auditViewProvider,
        showCollapseAll: false
    });

    // 註冊命令
    registerCommands(context);

    // 初始狀態設定
    vscode.commands.executeCommand('setContext', 'suiguard.loggedIn', false);
}

function registerCommands(context: vscode.ExtensionContext) {
    // 會員登入命令
    const loginCommand = vscode.commands.registerCommand('suiguard.login', async () => {
        try {
            const result = await zkLoginProvider.login();
            if (result.success) {
                vscode.commands.executeCommand('setContext', 'suiguard.loggedIn', true);
                vscode.window.showInformationMessage(`✅ 登入成功！歡迎 ${result.userInfo?.name || 'User'}`);
            } else {
                vscode.window.showErrorMessage(`❌ 登入失敗: ${result.error}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`❌ 登入錯誤: ${error}`);
        }
    });

    // AI 代碼審計命令
    const analyzeCommand = vscode.commands.registerCommand('suiguard.analyzeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('請先選擇要審計的代碼');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('請先選中要審計的代碼區塊');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const fileName = editor.document.fileName;
        const startLine = selection.start.line + 1;
        const endLine = selection.end.line + 1;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `🔍 正在審計第 ${startLine}-${endLine} 行代碼...`,
                cancellable: false
            }, async (progress) => {
                const result = await codeAnalyzer.analyzeCode({
                    code: selectedText,
                    fileName,
                    startLine,
                    endLine,
                    language: editor.document.languageId
                });

                if (result.success) {
                    showAnalysisResult(result.analysis!, startLine, endLine);
                } else {
                    vscode.window.showErrorMessage(`❌ 審計失敗: ${result.error}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`❌ 審計錯誤: ${error}`);
        }
    });

    // 快速審計命令
    const quickAnalyzeCommand = vscode.commands.registerCommand('suiguard.quickAnalyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            return;
        }

        const selectedText = editor.document.getText(selection);
        const startLine = selection.start.line + 1;
        const endLine = selection.end.line + 1;

        try {
            const result = await codeAnalyzer.quickAnalyze(selectedText);
            if (result.riskLevel === 'HIGH') {
                vscode.window.showErrorMessage(`🚨 高風險代碼 (第 ${startLine}-${endLine} 行): ${result.summary}`);
            } else if (result.riskLevel === 'MEDIUM') {
                vscode.window.showWarningMessage(`⚠️  中風險代碼 (第 ${startLine}-${endLine} 行): ${result.summary}`);
            } else {
                vscode.window.showInformationMessage(`✅ 代碼安全 (第 ${startLine}-${endLine} 行)`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`❌ 快速審計失敗: ${error}`);
        }
    });

    // 即時分析命令 - 分析當前整個文件或選中的代碼
    const realTimeAnalyzeCommand = vscode.commands.registerCommand('suiguard.realTimeAnalyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Please open a Move code file to analyze');
            return;
        }

        // 獲取選中的代碼，如果沒有選中則分析整個文件
        const selection = editor.selection;
        const sourceCode = selection.isEmpty 
            ? editor.document.getText() 
            : editor.document.getText(selection);
        
        const fileName = editor.document.fileName.split('/').pop() || 'unknown.move';
        const analysisScope = selection.isEmpty ? 'Entire file' : `Lines ${selection.start.line + 1}-${selection.end.line + 1}`;

        if (!sourceCode.trim()) {
            vscode.window.showWarningMessage('No code available for analysis');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `🔍 Analyzing ${fileName} ${analysisScope}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Connecting to analysis service...' });
                
                const result = await codeAnalyzer.analyzeRealTime(sourceCode, fileName);

                if (result.success) {
                    progress.report({ increment: 100, message: 'Analysis complete!' });
                    showRealTimeAnalysisResult(result.analysis, fileName, analysisScope);
                } else {
                    vscode.window.showErrorMessage(`❌ Analysis failed: ${result.error}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Analysis error: ${error}`);
        }
    });

    context.subscriptions.push(loginCommand, analyzeCommand, quickAnalyzeCommand, realTimeAnalyzeCommand);
}

function showAnalysisResult(analysis: any, startLine: number, endLine: number) {
    const panel = vscode.window.createWebviewPanel(
        'suiguardAnalysis',
        `SuiAudit Analysis Result (Lines ${startLine}-${endLine})`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getAnalysisWebviewContent(analysis, startLine, endLine);
}

function showRealTimeAnalysisResult(analysis: any, fileName: string, scope: string) {
    const panel = vscode.window.createWebviewPanel(
        'suiguardRealTimeAnalysis',
        `🔍 SuiAudit Real-time Analysis - ${fileName}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getRealTimeAnalysisWebviewContent(analysis, fileName, scope);
}

// 漏洞類型定義 (與 backend ML 模型一致)
interface VulnerabilityClassification {
    type: string;
    icon: string;
    color: string;
    description: string;
}

const VULNERABILITY_TYPES: { [key: string]: VulnerabilityClassification } = {
    'Resource Leak': {
        type: 'Resource Leak',
        icon: '💧',
        color: '#ff6b6b',
        description: 'Resource Leak - Resources not properly released or managed'
    },
    'Arithmetic Overflow': {
        type: 'Arithmetic Overflow',
        icon: '🔢',
        color: '#ee5a6f',
        description: 'Arithmetic Overflow - Numeric calculations may exceed limits'
    },
    'Unchecked Return': {
        type: 'Unchecked Return',
        icon: '⚠️',
        color: '#feca57',
        description: 'Unchecked Return - Function return values not validated'
    },
    'Cross-Module Pollution': {
        type: 'Cross-Module Pollution',
        icon: '🔀',
        color: '#ff9ff3',
        description: 'Cross-Module Pollution - Unsafe dependencies or data flow between modules'
    },
    'Capability Leak': {
        type: 'Capability Leak',
        icon: '🔐',
        color: '#ff4757',
        description: 'Capability Leak - Privilege management vulnerabilities'
    }
};

// 檢測漏洞類型
function detectVulnerabilityType(vulnerability: string): string {
    const vulnLower = vulnerability.toLowerCase();
    
    // 資源洩漏關鍵字
    if (vulnLower.includes('resource') || vulnLower.includes('資源') || 
        vulnLower.includes('leak') || vulnLower.includes('洩漏') || vulnLower.includes('泄漏')) {
        return 'Resource Leak';
    }
    
    // 算術溢位關鍵字
    if (vulnLower.includes('overflow') || vulnLower.includes('溢位') || vulnLower.includes('溢出') ||
        vulnLower.includes('arithmetic') || vulnLower.includes('算術')) {
        return 'Arithmetic Overflow';
    }
    
    // 未檢查返回值關鍵字
    if (vulnLower.includes('unchecked') || vulnLower.includes('未檢查') || vulnLower.includes('未检查') ||
        vulnLower.includes('return') || vulnLower.includes('返回值')) {
        return 'Unchecked Return';
    }
    
    // 跨模組污染關鍵字
    if (vulnLower.includes('cross-module') || vulnLower.includes('跨模組') || vulnLower.includes('跨模块') ||
        vulnLower.includes('pollution') || vulnLower.includes('污染')) {
        return 'Cross-Module Pollution';
    }
    
    // 權限洩漏關鍵字
    if (vulnLower.includes('capability') || vulnLower.includes('權限') || vulnLower.includes('权限') ||
        vulnLower.includes('permission') || vulnLower.includes('access control')) {
        return 'Capability Leak';
    }
    
    return 'Unknown';
}

// 分類漏洞
function classifyVulnerabilities(vulnerabilities: string[]): { [key: string]: string[] } {
    const classified: { [key: string]: string[] } = {};
    
    vulnerabilities.forEach(vuln => {
        const type = detectVulnerabilityType(vuln);
        if (!classified[type]) {
            classified[type] = [];
        }
        classified[type].push(vuln);
    });
    
    return classified;
}

function getRealTimeAnalysisWebviewContent(analysis: any, fileName: string, scope: string): string {
    const riskLevel = analysis.risk_level || 'UNKNOWN';
    const riskColor = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? '#ff4757' : 
                     riskLevel === 'MEDIUM' ? '#ffa502' : '#2ed573';
    
    // 分析漏洞並分類
    const classifiedVulnerabilities = classifyVulnerabilities(analysis.vulnerabilities || []);
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SuiAudit Real-time Analysis Result</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            .header {
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .risk-badge {
                background-color: ${riskColor};
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .score-container {
                display: flex;
                align-items: center;
                gap: 15px;
                margin: 15px 0;
            }
            .score-circle {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: conic-gradient(${riskColor} ${analysis.risk_score * 3.6}deg, var(--vscode-input-background) 0deg);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
            }
            .score-inner {
                width: 65px;
                height: 65px;
                border-radius: 50%;
                background-color: var(--vscode-editor-background);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .section {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
            }
            .section h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .vulnerability {
                background-color: var(--vscode-inputValidation-errorBackground);
                border-left: 4px solid #ff4757;
                padding: 12px;
                margin: 10px 0;
                border-radius: 0 4px 4px 0;
            }
            .security-issue {
                background-color: var(--vscode-inputValidation-warningBackground);
                border-left: 4px solid #ffa502;
                padding: 12px;
                margin: 10px 0;
                border-radius: 0 4px 4px 0;
            }
            .recommendation {
                background-color: var(--vscode-inputValidation-infoBackground);
                border-left: 4px solid #3742fa;
                padding: 12px;
                margin: 10px 0;
                border-radius: 0 4px 4px 0;
            }
            .meta-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .meta-item {
                padding: 10px;
                background-color: var(--vscode-textCodeBlock-background);
                border-radius: 4px;
            }
            .meta-label {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 5px;
            }
            .meta-value {
                font-size: 14px;
                font-weight: 500;
            }
            .empty-state {
                text-align: center;
                padding: 30px;
                color: var(--vscode-descriptionForeground);
            }
            .vulnerability-classification {
                margin: 20px 0;
                padding: 15px;
                background-color: var(--vscode-textCodeBlock-background);
                border-radius: 8px;
            }
            .vulnerability-classification h4 {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--vscode-textLink-foreground);
            }
            .classification-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
                margin-top: 10px;
            }
            .classification-card {
                background-color: var(--vscode-editor-background);
                padding: 12px;
                border-radius: 6px;
                border-left-width: 4px;
                border-left-style: solid;
            }
            .classification-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .classification-icon {
                font-size: 20px;
            }
            .classification-name {
                font-weight: 600;
                flex: 1;
            }
            .classification-count {
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            .classification-desc {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                line-height: 1.4;
            }
            .vuln-type-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                color: white;
                margin-bottom: 8px;
            }
            .vuln-content {
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>🛡️ SuiAudit Real-time Security Analysis Report</h2>
            <div class="risk-badge">${riskLevel} RISK</div>
            <p><strong>File Name:</strong> ${fileName}</p>
            <p><strong>Analysis Scope:</strong> ${scope}</p>
            
            <div class="score-container">
                <div class="score-circle">
                    <div class="score-inner">
                        ${analysis.risk_score}
                    </div>
                </div>
                <div>
                    <div><strong>Risk Score:</strong> ${analysis.risk_score}/100</div>
                    ${analysis.ml_analysis && analysis.ml_analysis.vulnerability_type ? 
                        `<div><strong>Vulnerability Type:</strong> ${analysis.ml_analysis.vulnerability_type}</div>` : 
                        '<div><strong>Vulnerability Type:</strong> No obvious vulnerabilities found</div>'
                    }
                </div>
            </div>
        </div>

        ${analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? `
        <div class="section">
            <h3>🚨 Vulnerabilities Found (${analysis.vulnerabilities.length})</h3>
            
            <!-- Vulnerability Classification Statistics -->
            ${Object.keys(classifiedVulnerabilities).length > 0 ? `
            <div class="vulnerability-classification">
                <h4>📊 Vulnerability Classification Statistics</h4>
                <div class="classification-grid">
                    ${Object.entries(classifiedVulnerabilities).map(([type, vulns]: [string, any]) => {
                        const vulnType = VULNERABILITY_TYPES[type];
                        if (!vulnType || vulns.length === 0) return '';
                        return `
                        <div class="classification-card" style="border-left: 4px solid ${vulnType.color}">
                            <div class="classification-header">
                                <span class="classification-icon">${vulnType.icon}</span>
                                <span class="classification-name">${vulnType.type}</span>
                                <span class="classification-count">${vulns.length}</span>
                            </div>
                            <div class="classification-desc">${vulnType.description}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Detailed Vulnerability List -->
            <h4 style="margin-top: 20px;">📝 Detailed Vulnerability List</h4>
            ${analysis.vulnerabilities.map((vuln: string) => {
                const vulnType = detectVulnerabilityType(vuln);
                const typeInfo = VULNERABILITY_TYPES[vulnType];
                return `
                <div class="vulnerability" style="border-left-color: ${typeInfo?.color || '#ff4757'}">
                    ${typeInfo ? `<span class="vuln-type-badge" style="background-color: ${typeInfo.color}">${typeInfo.icon} ${typeInfo.type}</span>` : ''}
                    <div class="vuln-content">${vuln}</div>
                </div>
                `;
            }).join('')}
        </div>
        ` : ''}

        ${analysis.security_issues && analysis.security_issues.length > 0 ? `
        <div class="section">
            <h3>⚠️  Security Issues (${analysis.security_issues.length})</h3>
            ${analysis.security_issues.map((issue: string) => `
                <div class="security-issue">
                    ${issue}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${analysis.recommendations && analysis.recommendations.length > 0 ? `
        <div class="section">
            <h3>💡 Remediation Recommendations (${analysis.recommendations.length})</h3>
            ${analysis.recommendations.map((rec: string) => `
                <div class="recommendation">
                    ${rec}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${!analysis.vulnerabilities?.length && !analysis.security_issues?.length ? `
        <div class="section">
            <div class="empty-state">
                <h3>✅ Great!</h3>
                <p>No obvious security vulnerabilities or issues found</p>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h3>📊 Analysis Details</h3>
            <div class="meta-info">
                <div class="meta-item">
                    <div class="meta-label">Analysis Method</div>
                    <div class="meta-value">${analysis.ml_analysis?.analysis_method || 'N/A'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Model Version</div>
                    <div class="meta-value">${analysis.ml_analysis?.model_version || 'N/A'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Processing Time</div>
                    <div class="meta-value">${analysis.ml_analysis?.processing_time?.toFixed(2) || 0}s</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Analysis Time</div>
                    <div class="meta-value">${new Date(analysis.timestamp).toLocaleString('en-US')}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

function getAnalysisWebviewContent(analysis: any, startLine: number, endLine: number): string {
    const riskColor = analysis.riskLevel === 'HIGH' ? '#ff4757' : 
                     analysis.riskLevel === 'MEDIUM' ? '#ffa502' : '#2ed573';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SuiAudit Analysis Result</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
            }
            .header {
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .risk-badge {
                background-color: ${riskColor};
                color: white;
                padding: 5px 15px;
                border-radius: 15px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 10px;
            }
            .section {
                margin-bottom: 25px;
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
            }
            .section h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
            }
            .vulnerability {
                background-color: var(--vscode-inputValidation-errorBackground);
                border-left: 4px solid #ff4757;
                padding: 10px;
                margin: 10px 0;
                border-radius: 0 4px 4px 0;
            }
            .recommendation {
                background-color: var(--vscode-inputValidation-infoBackground);
                border-left: 4px solid #3742fa;
                padding: 10px;
                margin: 10px 0;
                border-radius: 0 4px 4px 0;
            }
            .code-line {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 2px 5px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>🛡️ SuiAudit AI 審計報告</h2>
            <div class="risk-badge">${analysis.riskLevel} RISK</div>
            <p><strong>審計範圍:</strong> 第 ${startLine} - ${endLine} 行</p>
        </div>

        <div class="section">
            <h3>📋 總結</h3>
            <p>${analysis.summary || '代碼審計完成'}</p>
        </div>

        ${analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? `
        <div class="section">
            <h3>🚨 發現的漏洞</h3>
            ${analysis.vulnerabilities.map((vuln: any) => `
                <div class="vulnerability">
                    <h4>${vuln.type}</h4>
                    <p><strong>描述:</strong> ${vuln.description}</p>
                    <p><strong>嚴重性:</strong> ${vuln.severity}</p>
                    ${vuln.lineNumber ? `<p><strong>位置:</strong> <span class="code-line">第 ${vuln.lineNumber} 行</span></p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${analysis.recommendations && analysis.recommendations.length > 0 ? `
        <div class="section">
            <h3>💡 建議修復</h3>
            ${analysis.recommendations.map((rec: string) => `
                <div class="recommendation">
                    ${rec}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h3>📊 安全評分</h3>
            <p><strong>風險等級:</strong> ${analysis.riskLevel}</p>
            <p><strong>安全評分:</strong> ${analysis.securityScore || 'N/A'}/100</p>
            <p><strong>審計時間:</strong> ${new Date().toLocaleString('zh-TW')}</p>
        </div>
    </body>
    </html>
    `;
}

export function deactivate() {
    console.log('SuiAudit extension is now deactivated');
}