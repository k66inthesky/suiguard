import * as vscode from 'vscode';
import * as path from 'path';

export class ZkLoginProvider {
    private context: vscode.ExtensionContext;
    private isLoggedIn: boolean = false;
    private userInfo: any = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadLoginState();
    }

    async login(): Promise<{ success: boolean; userInfo?: any; error?: string }> {
        try {
            // 顯示登入選項
            const loginMethod = await vscode.window.showQuickPick([
                { label: '🔐 Sui Wallet (zkLogin)', description: '使用 Sui 錢包的 zkLogin 功能登入' },
                { label: '🌐 Google 登入', description: '使用 Google 帳戶登入 (zkLogin)' },
                { label: '👤 GitHub 登入', description: '使用 GitHub 帳戶登入 (zkLogin)' }
            ], {
                placeHolder: '選擇登入方式',
                title: 'SuiGuard 會員登入'
            });

            if (!loginMethod) {
                return { success: false, error: '用戶取消登入' };
            }

            // 顯示登入進度
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '正在連接 zkLogin...',
                cancellable: true
            }, async (progress, token) => {
                
                progress.report({ increment: 20, message: '初始化 zkLogin 連接...' });
                
                // 模擬連接到 zklogin-integration 服務
                await this.delay(1000);
                
                if (token.isCancellationRequested) {
                    return { success: false, error: '用戶取消登入' };
                }

                progress.report({ increment: 40, message: '驗證錢包連接...' });
                
                // 這裡會實際調用 zklogin-integration 服務
                const zkLoginResult = await this.connectToZkLoginService(loginMethod.label);
                
                await this.delay(1000);
                
                progress.report({ increment: 80, message: '完成身份驗證...' });
                
                if (zkLoginResult.success) {
                    this.isLoggedIn = true;
                    this.userInfo = zkLoginResult.userInfo;
                    this.saveLoginState();
                    
                    progress.report({ increment: 100, message: '登入成功！' });
                    
                    return {
                        success: true,
                        userInfo: this.userInfo
                    };
                } else {
                    return { success: false, error: zkLoginResult.error };
                }
            });

        } catch (error) {
            return { success: false, error: `登入失敗: ${error}` };
        }
    }

    async logout(): Promise<void> {
        this.isLoggedIn = false;
        this.userInfo = null;
        this.clearLoginState();
        vscode.commands.executeCommand('setContext', 'suiguard.loggedIn', false);
        vscode.window.showInformationMessage('已成功登出 SuiGuard');
    }

    private async connectToZkLoginService(method: string): Promise<{ success: boolean; userInfo?: any; error?: string }> {
        try {
            // 這裡會連接到 ../zklogin-integration/ 資料夾中的服務
            const zkloginPath = path.join(this.context.extensionPath, '..', 'zklogin-integration');
            
            // 模擬 zkLogin 流程
            // 實際實作中會：
            // 1. 啟動本地 zkLogin 服務
            // 2. 開啟瀏覽器進行 OAuth 流程
            // 3. 處理回調並驗證 JWT
            // 4. 生成 Sui 地址和私鑰
            
            await this.delay(2000); // 模擬網絡請求
            
            // 模擬成功的登入結果
            const mockUserInfo = {
                name: 'Demo User',
                email: 'demo@example.com',
                suiAddress: '0x1234567890abcdef1234567890abcdef12345678',
                provider: method.includes('Google') ? 'google' : method.includes('GitHub') ? 'github' : 'sui-wallet',
                loginTime: new Date().toISOString()
            };

            return {
                success: true,
                userInfo: mockUserInfo
            };
            
        } catch (error) {
            return {
                success: false,
                error: `zkLogin 連接失敗: ${error}`
            };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private loadLoginState(): void {
        const savedState = this.context.globalState.get<any>('suiguard.loginState');
        if (savedState) {
            this.isLoggedIn = savedState.isLoggedIn;
            this.userInfo = savedState.userInfo;
            if (this.isLoggedIn) {
                vscode.commands.executeCommand('setContext', 'suiguard.loggedIn', true);
            }
        }
    }

    private saveLoginState(): void {
        this.context.globalState.update('suiguard.loginState', {
            isLoggedIn: this.isLoggedIn,
            userInfo: this.userInfo
        });
    }

    private clearLoginState(): void {
        this.context.globalState.update('suiguard.loginState', undefined);
    }

    public getLoginStatus(): { isLoggedIn: boolean; userInfo: any } {
        return {
            isLoggedIn: this.isLoggedIn,
            userInfo: this.userInfo
        };
    }
}