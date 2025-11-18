import * as vscode from 'vscode';
import axios from 'axios';

export interface CodeAnalysisRequest {
    code: string;
    fileName: string;
    startLine: number;
    endLine: number;
    language: string;
}

export interface CodeAnalysisResult {
    success: boolean;
    analysis?: any;
    error?: string;
}

export interface QuickAnalysisResult {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    summary: string;
}

export class CodeAnalyzer {
    private backendUrl: string;

    constructor() {
        // 從設定中獲取後端 URL，預設為本地開發環境
        this.backendUrl = vscode.workspace.getConfiguration('suiguard')
            .get('backendUrl', 'http://localhost:8080');
    }

    async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult> {
        try {
            const response = await axios.post(`${this.backendUrl}/api/analyze-connection`, {
                code: request.code,
                fileName: request.fileName,
                startLine: request.startLine,
                endLine: request.endLine,
                language: request.language,
                analysisType: 'full'
            }, {
                timeout: 30000, // 30秒超時
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'SuiGuard-VSCode-Extension/0.0.1'
                }
            });

            if (response.status === 200 && response.data) {
                return {
                    success: true,
                    analysis: this.processAnalysisResponse(response.data)
                };
            } else {
                return {
                    success: false,
                    error: `後端服務回應異常: ${response.status}`
                };
            }

        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: '無法連接到後端服務，請確認 backend/main.py 是否正在運行'
                };
            } else if (error.response) {
                return {
                    success: false,
                    error: `後端錯誤 (${error.response.status}): ${error.response.data?.message || '未知錯誤'}`
                };
            } else {
                return {
                    success: false,
                    error: `網絡錯誤: ${error.message}`
                };
            }
        }
    }

    async quickAnalyze(code: string): Promise<QuickAnalysisResult> {
        try {
            // 快速分析：本地規則檢查 + 簡單後端調用
            const localRisks = this.performLocalAnalysis(code);
            
            if (localRisks.riskLevel === 'HIGH') {
                return localRisks;
            }

            // 如果本地分析沒有發現高風險，進行輕量級後端分析
            const response = await axios.post(`${this.backendUrl}/api/analyze-connection`, {
                code: code,
                analysisType: 'quick'
            }, {
                timeout: 5000, // 快速分析只給5秒
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data) {
                return {
                    riskLevel: response.data.riskLevel || 'LOW',
                    summary: response.data.summary || '代碼看起來是安全的'
                };
            }

            return localRisks;

        } catch (error) {
            // 快速分析失敗時，返回本地分析結果
            return this.performLocalAnalysis(code);
        }
    }

    private performLocalAnalysis(code: string): QuickAnalysisResult {
        const highRiskPatterns = [
            /unsafe\s+/gi,
            /\.unwrap\(\)/gi,
            /panic!/gi,
            /\.expect\(/gi,
            /unsafe_.*\(/gi,
            /transfer_to_object_id/gi,
            /sui::coin::mint/gi
        ];

        const mediumRiskPatterns = [
            /\.clone\(\)/gi,
            /mut\s+/gi,
            /public\s+entry/gi,
            /abort\s+/gi
        ];

        let highRiskCount = 0;
        let mediumRiskCount = 0;

        for (const pattern of highRiskPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                highRiskCount += matches.length;
            }
        }

        for (const pattern of mediumRiskPatterns) {
            const matches = code.match(pattern);
            if (matches) {
                mediumRiskCount += matches.length;
            }
        }

        if (highRiskCount > 0) {
            return {
                riskLevel: 'HIGH',
                summary: `發現 ${highRiskCount} 個高風險模式`
            };
        } else if (mediumRiskCount > 2) {
            return {
                riskLevel: 'MEDIUM',
                summary: `發現 ${mediumRiskCount} 個中風險模式`
            };
        } else {
            return {
                riskLevel: 'LOW',
                summary: '未發現明顯的安全風險'
            };
        }
    }

    private processAnalysisResponse(rawData: any): any {
        // 處理和標準化後端回應
        return {
            riskLevel: rawData.risk_level || rawData.riskLevel || 'LOW',
            summary: rawData.summary || rawData.message || '分析完成',
            vulnerabilities: rawData.vulnerabilities || rawData.issues || [],
            recommendations: rawData.recommendations || rawData.suggestions || [],
            securityScore: rawData.security_score || rawData.securityScore || null,
            analysisTime: rawData.analysis_time || rawData.timestamp || new Date().toISOString(),
            details: rawData.details || rawData
        };
    }

    public updateBackendUrl(url: string): void {
        this.backendUrl = url;
    }
}