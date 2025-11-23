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
                '🚀 Real-time Vulnerability Analysis',
                'Analyze security vulnerabilities in current file or selected code',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.realTimeAnalyze',
                    title: 'Real-time Analysis',
                    arguments: []
                },
                '$(run)' // 添加圖標
            ),
            new AuditItem(
                '🔍 Analyze Selected Code',
                'Select code and click for in-depth analysis',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.analyzeCode',
                    title: 'Analyze Code',
                    arguments: []
                },
                '$(search)'
            ),
            new AuditItem(
                '⚡ Quick Security Check',
                'Perform quick risk assessment on selected code',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.quickAnalyze',
                    title: 'Quick Check',
                    arguments: []
                },
                '$(zap)'
            ),
            new AuditItem(
                '⚙️ Configure Backend Service',
                'Configure SuiAudit backend service address',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.configureBackend',
                    title: 'Configure Backend',
                    arguments: []
                },
                '$(gear)'
            ),
            new AuditItem(
                '📊 View Audit History',
                'View past code audit results',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.viewHistory',
                    title: 'Audit History',
                    arguments: []
                },
                '$(history)'
            )
        ]);
    }
}

class AuditItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        iconId?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.description = '';
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId.replace('$(', '').replace(')', ''));
        }
    }
}