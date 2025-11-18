const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

class ZkLoginService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // 健康檢查
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', service: 'zkLogin Integration' });
        });

        // 初始化 zkLogin 流程
        this.app.post('/auth/initiate', async (req, res) => {
            try {
                const { provider } = req.body;
                const authUrl = await this.initiateOAuth(provider);
                res.json({ success: true, authUrl });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 處理 OAuth 回調
        this.app.get('/auth/callback', async (req, res) => {
            try {
                const { code, state } = req.query;
                const result = await this.handleOAuthCallback(code, state);
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 驗證 zkLogin 令牌
        this.app.post('/auth/verify', async (req, res) => {
            try {
                const { token } = req.body;
                const result = await this.verifyZkLoginToken(token);
                res.json(result);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 獲取用戶資訊
        this.app.get('/user/profile', async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    return res.status(401).json({ success: false, error: 'No authorization header' });
                }

                const token = authHeader.split(' ')[1];
                const userInfo = await this.getUserProfile(token);
                res.json({ success: true, userInfo });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    async initiateOAuth(provider) {
        // 模擬 OAuth 初始化
        const stateParam = Math.random().toString(36).substring(7);
        
        const authUrls = {
            google: `https://accounts.google.com/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid%20email%20profile&state=${stateParam}`,
            github: `https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&redirect_uri=http://localhost:3000/auth/callback&scope=user:email&state=${stateParam}`,
            'sui-wallet': 'suiwallet://zklogin/connect' // 自定義 Sui 錢包協議
        };

        return authUrls[provider] || authUrls.google;
    }

    async handleOAuthCallback(code, state) {
        // 模擬處理 OAuth 回調
        console.log(`處理 OAuth 回調 - Code: ${code}, State: ${state}`);
        
        // 在實際實作中，這裡會：
        // 1. 用 code 換取 access token
        // 2. 獲取用戶資訊
        // 3. 生成 JWT
        // 4. 創建 zkLogin proof
        // 5. 生成 Sui 地址
        
        const mockUserData = {
            id: '12345',
            email: 'user@example.com',
            name: 'Demo User',
            picture: 'https://via.placeholder.com/100'
        };

        const zkLoginToken = this.generateZkLoginToken(mockUserData);
        const suiAddress = await this.generateSuiAddress(mockUserData);

        return {
            success: true,
            token: zkLoginToken,
            suiAddress,
            userInfo: mockUserData
        };
    }

    generateZkLoginToken(userData) {
        const payload = {
            sub: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小時
        };

        // 在實際實作中使用真正的私鑰
        return jwt.sign(payload, 'YOUR_SECRET_KEY', { algorithm: 'HS256' });
    }

    async generateSuiAddress(userData) {
        // 在實際實作中，這會使用 zkLogin 來生成真正的 Sui 地址
        // 這裡返回一個模擬的地址
        const hash = Buffer.from(userData.id + userData.email).toString('hex').substring(0, 40);
        return `0x${hash}`;
    }

    async verifyZkLoginToken(token) {
        try {
            const decoded = jwt.verify(token, 'YOUR_SECRET_KEY');
            return {
                success: true,
                valid: true,
                userData: decoded
            };
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error.message
            };
        }
    }

    async getUserProfile(token) {
        const verification = await this.verifyZkLoginToken(token);
        if (!verification.valid) {
            throw new Error('Invalid token');
        }

        return verification.userData;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 zkLogin Integration Service 運行於 http://localhost:${this.port}`);
            console.log('📱 可用端點:');
            console.log('   POST /auth/initiate - 初始化登入流程');
            console.log('   GET  /auth/callback - OAuth 回調處理');
            console.log('   POST /auth/verify   - 驗證 zkLogin 令牌');
            console.log('   GET  /user/profile  - 獲取用戶資訊');
        });
    }
}

// 如果直接執行此文件，啟動服務
if (require.main === module) {
    const service = new ZkLoginService();
    service.start();
}

module.exports = { ZkLoginService };