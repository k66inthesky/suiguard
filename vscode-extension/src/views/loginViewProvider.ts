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
                '🔐 Member Login',
                'Click to login with zkLogin',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'suiguard.login',
                    title: 'Login',
                    arguments: []
                }
            ),
            new LoginItem(
                '📖 What is zkLogin?',
                'Learn about Sui zero-knowledge login mechanism',
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'vscode.open',
                    title: 'Open Documentation',
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