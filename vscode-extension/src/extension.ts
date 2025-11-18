import * as vscode from 'vscode';
import { ZkLoginProvider } from './zklogin/zkLoginProvider';
import { CodeAnalyzer } from './analyzer/codeAnalyzer';
import { LoginViewProvider } from './views/loginViewProvider';
import { AuditViewProvider } from './views/auditViewProvider';

let zkLoginProvider: ZkLoginProvider;
let codeAnalyzer: CodeAnalyzer;

export function activate(context: vscode.ExtensionContext) {
    console.log('SuiGuard extension is now active!');

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

    context.subscriptions.push(loginCommand, analyzeCommand, quickAnalyzeCommand);
}

function showAnalysisResult(analysis: any, startLine: number, endLine: number) {
    const panel = vscode.window.createWebviewPanel(
        'suiguardAnalysis',
        `SuiGuard 審計結果 (第 ${startLine}-${endLine} 行)`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getAnalysisWebviewContent(analysis, startLine, endLine);
}

function getAnalysisWebviewContent(analysis: any, startLine: number, endLine: number): string {
    const riskColor = analysis.riskLevel === 'HIGH' ? '#ff4757' : 
                     analysis.riskLevel === 'MEDIUM' ? '#ffa502' : '#2ed573';
    
    return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SuiGuard 審計結果</title>
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
            <h2>🛡️ SuiGuard AI 審計報告</h2>
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
    console.log('SuiGuard extension is now deactivated');
}