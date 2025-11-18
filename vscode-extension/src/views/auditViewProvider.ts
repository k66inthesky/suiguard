import * as vscode from 'vscode';
import { CodeAnalyzer } from '../analyzer/codeAnalyzer';

export class AuditViewProvider implements vscode.TreeDataProvider<AuditItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AuditItem | undefined | null | void> = new vscode.EventEmitter<AuditItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AuditItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private codeAnalyzer: CodeAnalyzer
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AuditItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AuditItem): Thenable<AuditItem[]> {
        return Promise.resolve([
            new AuditItem(
                '🔍 分析選中代碼',
                '選擇代碼後點擊進行深度分析',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.analyzeCode',
                    title: '分析代碼',
                    arguments: []
                }
            ),
            new AuditItem(
                '⚡ 快速安全檢查',
                '對選中代碼進行快速風險評估',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.quickAnalyze',
                    title: '快速檢查',
                    arguments: []
                }
            ),
            new AuditItem(
                '⚙️ 設定後端服務',
                '配置 SuiGuard 後端服務地址',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.configureBackend',
                    title: '設定後端',
                    arguments: []
                }
            ),
            new AuditItem(
                '📊 查看審計記錄',
                '查看過往的代碼審計結果',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.viewHistory',
                    title: '審計記錄',
                    arguments: []
                }
            )
        ]);
    }
}

class AuditItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.description = tooltip;
    }
}