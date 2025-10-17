import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { getWallets } from "@mysten/wallet-standard";
import { registerSlushWallet } from "@mysten/slush-wallet";

// Import constants
const API_URL = "http://localhost:8080";
const CERTIFICATE_CONTRACT = {
  PACKAGE_ID: "0xfa3e12bc4632fc5b4c8bb0e39255c22a2e09d93657a5a7f8206b347e526b8a45",
  MODULE: "certificate",
  FUNCTION: "issue_certificate",
};

interface CertificateData {
  recipient: string;
  package_id: string;
  risk_level: string;
  security_score: number;
  recommendation: string;
  analyzer_version: string;
  timestamp: string;
  reasons: string[];
  confidence: number;
}

export default function CertificatePage() {
  const [packageId, setPackageId] = useState<string>("");
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [txDigest, setTxDigest] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<any>(null);

  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

  // 註冊 Slush Wallet
  useEffect(() => {
    try {
      console.log('📝 註冊 Slush Wallet...');
      registerSlushWallet('SuiAudit', {
        network: 'testnet'
      });
      console.log('✅ Slush Wallet 已註冊');
    } catch (err) {
      console.warn('註冊 Slush Wallet 失敗:', err);
    }
  }, []);

  // 從 URL 參數獲取 packageId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("packageId");
    if (id) {
      setPackageId(id);
    }
  }, []);

  // 檢查錢包是否已連接
  useEffect(() => {
    // 延遲檢測，確保錢包擴展已載入
    const timer = setTimeout(() => {
      checkWalletConnection();
    }, 1000); // 增加到 1 秒
    
    return () => clearTimeout(timer);
  }, []);

  // 當錢包連接後，自動請求證書數據
  useEffect(() => {
    if (walletConnected && walletAddress && packageId && !certificateData) {
      fetchCertificateData();
    }
  }, [walletConnected, walletAddress, packageId]);

  // 獲取可用的錢包（使用 Wallet Standard）
  const getAvailableWallets = () => {
    console.log('🔍 使用 Wallet Standard 檢查錢包...');
    const wallets = getWallets().get();
    console.log(`找到 ${wallets.length} 個錢包:`, wallets.map(w => w.name));
    return wallets;
  };

  const checkWalletConnection = async () => {
    console.log('檢查錢包連接狀態...');
    const wallets = getAvailableWallets();
    
    if (wallets.length === 0) {
      console.warn('❌ 未找到任何錢包');
      return;
    }

    // 嘗試找到已有授權帳戶的錢包
    for (const wallet of wallets) {
      console.log(`檢查 ${wallet.name} 的帳戶...`);
      if (wallet.accounts && wallet.accounts.length > 0) {
        console.log(`✅ ${wallet.name} 已有授權帳戶:`, wallet.accounts[0].address);
        setCurrentWallet(wallet);
        setWalletAddress(wallet.accounts[0].address);
        setWalletConnected(true);
        return;
      }
    }
    
    console.log('沒有找到已授權的帳戶');
  };

  const connectWallet = async () => {
    console.log('=== 開始連接錢包（Wallet Standard）===');
    const wallets = getAvailableWallets();
    
    if (wallets.length === 0) {
      const errorMsg = "未檢測到 Sui 錢包，請安裝 Slush、Sui Wallet 或 Suiet";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // 優先使用 Slush Wallet
    let targetWallet = wallets.find(w => w.name.toLowerCase().includes('slush'));
    if (!targetWallet) {
      targetWallet = wallets[0]; // 使用第一個可用錢包
    }

    console.log(`🔗 嘗試連接 ${targetWallet.name}...`);

    try {
      setError("");
      
      // 使用 Wallet Standard 的 connect 功能
      const connectFeature = targetWallet.features['standard:connect'];
      if (!connectFeature) {
        throw new Error('錢包不支援 standard:connect 功能');
      }

      console.log('請求連接權限...');
      const result = await connectFeature.connect();
      console.log('連接結果:', result);

      // 獲取帳戶
      if (targetWallet.accounts && targetWallet.accounts.length > 0) {
        const account = targetWallet.accounts[0];
        setCurrentWallet(targetWallet);
        setWalletAddress(account.address);
        setWalletConnected(true);
        console.log(`✅ 成功連接 ${targetWallet.name}:`, account.address);
      } else {
        throw new Error('未獲取到帳戶地址');
      }
    } catch (err: any) {
      console.error("❌ 錢包連接錯誤:", err);
      setError("錢包連接失敗：" + (err.message || "用戶拒絕"));
    }
  };

  const disconnectWallet = () => {
    setCurrentWallet(null);
    setWalletAddress("");
    setWalletConnected(false);
    setCertificateData(null);
  };

  const fetchCertificateData = async () => {
    if (!walletAddress || !packageId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/request-certificate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_id: packageId,
          wallet_address: walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certificate data");
      }

      const data = await response.json();
      setCertificateData(data);
    } catch (err) {
      console.error("Error fetching certificate:", err);
      setError("無法獲取證書數據，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleMintCertificate = async () => {
    if (!currentWallet || !walletAddress || !certificateData) return;

    setMinting(true);
    setError("");

    try {
      const tx = new Transaction();

      // 獲取 Clock object ID (Sui 系統 object)
      const CLOCK_ID = "0x6";

      // 調用智能合約鑄造NFT
      tx.moveCall({
        target: `${CERTIFICATE_CONTRACT.PACKAGE_ID}::${CERTIFICATE_CONTRACT.MODULE}::${CERTIFICATE_CONTRACT.FUNCTION}`,
        arguments: [
          tx.pure.address(walletAddress), // recipient
          tx.pure.string(certificateData.package_id), // package_id
          tx.pure.string(certificateData.risk_level), // risk_level
          tx.pure.u8(certificateData.security_score), // security_score
          tx.pure.string(certificateData.recommendation), // recommendation
          tx.pure.string(certificateData.analyzer_version), // analyzer_version
          tx.object(CLOCK_ID), // clock
        ],
      });

      console.log(`使用 ${currentWallet.name} 簽名交易...`);

      // 使用 Wallet Standard 的 signAndExecuteTransaction 功能
      const signFeature = currentWallet.features['sui:signAndExecuteTransaction'];
      if (!signFeature) {
        throw new Error('錢包不支援 sui:signAndExecuteTransaction 功能');
      }

      const account = currentWallet.accounts[0];
      
      // 找到 Sui Testnet chain
      const suiTestnetChain = account.chains.find((chain: string) => 
        chain.includes('sui:testnet')
      ) || 'sui:testnet';
      
      console.log('使用 chain:', suiTestnetChain);
      console.log('Account chains:', account.chains);
      
      const result = await signFeature.signAndExecuteTransaction({
        transaction: tx,
        account: account,
        chain: suiTestnetChain,
      });

      console.log("Certificate minted successfully:", result);
      setTxDigest(result.digest);
      setMintSuccess(true);
      setMinting(false);
    } catch (err: any) {
      console.error("Error minting certificate:", err);
      setError("鑄造失敗：" + (err.message || "未知錯誤"));
      setMinting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-600 bg-green-50";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50";
      case "HIGH":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "LOW":
        return "低風險";
      case "MEDIUM":
        return "中風險";
      case "HIGH":
        return "高風險";
      default:
        return level;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎖️ 領取 SuiAudit NFT 證書
          </h1>
          <p className="text-gray-600">
            驗證智能合約安全性並獲得專屬 NFT 證書
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Package ID Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              審計的合約 Package ID
            </label>
            <div className="p-3 bg-gray-50 rounded-lg break-all font-mono text-sm">
              {packageId || "未指定"}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              連接錢包
            </label>
            <div className="flex flex-col gap-3">
              {!walletConnected ? (
                <>
                  <button
                    onClick={connectWallet}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                  >
                    🔗 Connect Wallet
                  </button>
                  <button
                    onClick={() => {
                      console.log('=== 手動檢測錢包（Wallet Standard）===');
                      const wallets = getWallets().get();
                      console.log(`找到 ${wallets.length} 個錢包`);
                      wallets.forEach((wallet, index) => {
                        console.log(`\n錢包 ${index + 1}:`);
                        console.log('  名稱:', wallet.name);
                        console.log('  版本:', wallet.version);
                        console.log('  圖示:', wallet.icon);
                        console.log('  帳戶數:', wallet.accounts?.length || 0);
                        console.log('  功能:', Object.keys(wallet.features));
                        if (wallet.accounts && wallet.accounts.length > 0) {
                          console.log('  地址:', wallet.accounts[0].address);
                        }
                      });
                      
                      checkWalletConnection();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    🔍 除錯：檢測錢包
                  </button>
                  <p className="text-xs text-gray-500">
                    支援 Slush、Sui Wallet、Suiet 等錢包
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    ✅ 已連接: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                  >
                    斷開
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Data Display */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">正在獲取證書數據...</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {certificateData && !mintSuccess && (
            <div className="space-y-6">
              {/* Risk Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  風險等級
                </label>
                <div
                  className={`inline-block px-4 py-2 rounded-lg font-semibold ${getRiskColor(
                    certificateData.risk_level
                  )}`}
                >
                  {getRiskLabel(certificateData.risk_level)}
                </div>
              </div>

              {/* Security Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  安全分數
                </label>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {certificateData.security_score}/100
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all"
                      style={{ width: `${certificateData.security_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  安全建議
                </label>
                <p className="p-4 bg-gray-50 rounded-lg text-gray-700">
                  {certificateData.recommendation}
                </p>
              </div>

              {/* Reasons */}
              {certificateData.reasons && certificateData.reasons.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分析原因
                  </label>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {certificateData.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-500">
                分析時間: {new Date(certificateData.timestamp).toLocaleString("zh-TW")}
              </div>

              {/* Mint Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleMintCertificate}
                  disabled={minting || !walletConnected}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {minting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      鑄造中...
                    </span>
                  ) : (
                    "🎖️ 領取 NFT 證書"
                  )}
                </button>
                {!walletConnected && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    請先連接錢包
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {mintSuccess && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                證書鑄造成功！
              </h2>
              <p className="text-gray-600 mb-6">
                NFT 證書已成功發送到你的錢包
              </p>
              <div className="space-y-3">
                <a
                  href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  在 Sui Explorer 查看交易
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Transaction: {txDigest.slice(0, 8)}...{txDigest.slice(-6)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>證書有效期：30 天</p>
          <p className="mt-1">由 SuiGuard 安全分析系統提供</p>
        </div>
      </div>
    </div>
  );
}
