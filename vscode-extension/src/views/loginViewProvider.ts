import * as vscode from 'vscode';
import { ZkLoginProvider } from '../zklogin/zkLoginProvider';

export class LoginViewProvider implements vscode.TreeDataProvider<LoginItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LoginItem | undefined | null | void> = new vscode.EventEmitter<LoginItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LoginItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private zkLoginProvider: ZkLoginProvider
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LoginItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: LoginItem): Thenable<LoginItem[]> {
        const loginStatus = this.zkLoginProvider.getLoginStatus();
        
        if (loginStatus.isLoggedIn) {
            return Promise.resolve([]);
        }

        return Promise.resolve([
            new LoginItem(
                '🔐 會員登入',
                '點擊使用 zkLogin 登入',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.login',
                    title: '登入',
                    arguments: []
                }
            ),
            new LoginItem(
                '📖 什麼是 zkLogin?',
                '了解 Sui 的零知識登入機制',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'vscode.open',
                    title: '開啟文檔',
                    arguments: [vscode.Uri.parse('https://docs.sui.io/concepts/cryptography/zklogin')]
                }
            )
        ]);
    }
}

class LoginItem extends vscode.TreeItem {
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