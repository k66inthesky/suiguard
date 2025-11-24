import { ConnectButton } from '@mysten/dapp-kit';
import { registerSlushWallet } from '@mysten/slush-wallet';
import { Transaction } from '@mysten/sui/transactions';
import { getWallets } from '@mysten/wallet-standard';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL, SUIVISION_URL_TESTNET } from '../constants';

// Import constants
const CERTIFICATE_CONTRACT = {
  PACKAGE_ID: '0xfa3e12bc4632fc5b4c8bb0e39255c22a2e09d93657a5a7f8206b347e526b8a45',
  MODULE: 'certificate',
  FUNCTION: 'issue_certificate',
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
  const navigate = useNavigate();
  const [packageId, setPackageId] = useState<string>('');
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [txDigest, setTxDigest] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<any>(null);

  // 註冊 Slush Wallet
  useEffect(() => {
    try {
      console.log('📝 Register Slush Wallet...');
      registerSlushWallet('SuiAudit');
      console.log('✅ Slush Wallet registered');
    } catch (err) {
      console.warn('Failed to register Slush Wallet:', err);
    }
  }, []);

  // Get packageId from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('packageId');
    if (id) {
      setPackageId(id);
      return;
    }
    navigate('/get-started');
  }, []);

  // Check wallet connection
  useEffect(() => {
    // Delay check to ensure wallet extension is loaded
    const timer = setTimeout(() => {
      checkWalletConnection();
    }, 1000); // Increased to 1 second

    return () => clearTimeout(timer);
  }, []);

  // When wallet is connected, automatically request certificate data
  useEffect(() => {
    if (walletConnected && walletAddress && packageId && !certificateData) {
      fetchCertificateData();
    }
  }, [walletConnected, walletAddress, packageId]);

  // Get available wallets (using Wallet Standard)
  const getAvailableWallets = () => {
    console.log('🔍 Checking wallets using Wallet Standard...');
    const wallets = getWallets().get();
    console.log(
      `Found ${wallets.length} wallets:`,
      wallets.map((w) => w.name),
    );
    return wallets;
  };

  const checkWalletConnection = async () => {
    console.log('Checking wallet connection status...');
    const wallets = getAvailableWallets();

    if (wallets.length === 0) {
      console.warn('❌ No wallets found');
      return;
    }

    // Try to find a wallet with an authorized account
    for (const wallet of wallets) {
      console.log(`Checking accounts for ${wallet.name}...`);
      if (wallet.accounts && wallet.accounts.length > 0) {
        console.log(`✅ ${wallet.name} has authorized account:`, wallet.accounts[0].address);
        setCurrentWallet(wallet);
        setWalletAddress(wallet.accounts[0].address);
        setWalletConnected(true);
        return;
      }
    }
    console.log('No authorized accounts found');
  };

  const handleConnectWallet = async () => {
    console.log('=== Starting wallet connection (Wallet Standard) ===');
    const wallets = getAvailableWallets();

    if (wallets.length === 0) {
      const errorMsg = 'No Sui wallet detected. Please install Slush, Sui Wallet, or Suiet.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Prioritize using Slush Wallet
    let targetWallet = wallets.find((w) => w.name.toLowerCase().includes('slush'));
    if (!targetWallet) {
      targetWallet = wallets[0]; // Use the first available wallet
    }

    console.log(`🔗 Trying to connect to ${targetWallet.name}...`);

    try {
      setError('');

      // Use Wallet Standard's connect feature
      const connectFeature = targetWallet.features['standard:connect'] as {
        connect: () => Promise<{ accounts: readonly { address: string }[] }>;
      };
      if (!connectFeature) {
        throw new Error('Wallet does not support standard:connect feature');
      }

      console.log('Requesting connection permission...');
      const result = await connectFeature.connect();
      console.log('Connection result:', result);

      // Get account
      if (targetWallet.accounts && targetWallet.accounts.length > 0) {
        const account = targetWallet.accounts[0];
        setCurrentWallet(targetWallet);
        setWalletAddress(account.address);
        setWalletConnected(true);
        console.log(`✅ Successfully connected to ${targetWallet.name}:`, account.address);
      } else {
        throw new Error('Failed to get account address');
      }
    } catch (err: any) {
      console.error('❌ Wallet connection error:', err);
      setError('Wallet connection failed: ' + (err.message || 'User rejected'));
    }
  };

  const disconnectWallet = () => {
    setCurrentWallet(null);
    setWalletAddress('');
    setWalletConnected(false);
    setCertificateData(null);
  };

  const fetchCertificateData = async () => {
    if (!walletAddress || !packageId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/request-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: packageId,
          wallet_address: walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificate data');
      }

      const data = await response.json();
      setCertificateData(data);
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError('Failed to fetch certificate data, please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleMintCertificate = async () => {
    if (!currentWallet || !walletAddress || !certificateData) return;

    setMinting(true);
    setError('');

    try {
      const tx = new Transaction();

      // Get Clock object ID (Sui system object)
      const CLOCK_ID = '0x6';

      // Call smart contract to mint NFT
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

      console.log(`Using ${currentWallet.name} to sign the transaction...`);

      // Use Wallet Standard's signAndExecuteTransaction feature
      const signFeature = currentWallet.features['sui:signAndExecuteTransaction'];
      if (!signFeature) {
        throw new Error('Wallet does not support sui:signAndExecuteTransaction feature');
      }

      const account = currentWallet.accounts[0];

      // Find Sui Testnet chain
      const suiTestnetChain =
        account.chains.find((chain: string) => chain.includes('sui:testnet')) || 'sui:testnet';

      console.log('Using chain:', suiTestnetChain);
      console.log('Account chains:', account.chains);

      const result = await signFeature.signAndExecuteTransaction({
        transaction: tx,
        account: account,
        chain: suiTestnetChain,
      });

      console.log('Certificate minted successfully:', result);
      setTxDigest(result.digest);
      setMintSuccess(true);
      setMinting(false);
    } catch (err: any) {
      console.error('Error minting certificate:', err);
      setError('Minting failed: ' + (err.message || 'Unknown error'));
      setMinting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'Low Risk';
      case 'MEDIUM':
        return 'Medium Risk';
      case 'HIGH':
        return 'High Risk';
      default:
        return level;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-indigo-100 py-12 px-4">
      <div className="mx-auto flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎖️ Claim Your SuiAudit NFT Certificate
          </h1>
          <p className="text-gray-600">
            Verify smart contract security and receive a unique NFT certificate
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Package ID Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audited Contract Package ID
            </label>
            <div className="p-3 bg-gray-50 rounded-lg break-all font-mono text-sm">
              {packageId || 'Not specified'}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Connect Wallet</label>
            <div className="flex flex-col gap-3">
              {!walletConnected ? (
                <>
                  {/* <button
                    onClick={handleConnectWallet}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                  >
                    🔗 Connect Wallet
                  </button> */}
                  <ConnectButton onClick={handleConnectWallet} />
                  <button
                    onClick={() => {
                      console.log('=== Manual Wallet Check (Wallet Standard) ===');
                      const wallets = getWallets().get();
                      console.log(`Found ${wallets.length} wallets`);
                      wallets.forEach((wallet, index) => {
                        console.log(`\nWallet ${index + 1}:`);
                        console.log('  Name:', wallet.name);
                        console.log('  Version:', wallet.version);
                        console.log('  Icon:', wallet.icon);
                        console.log('  Accounts:', wallet.accounts?.length || 0);
                        console.log('  Features:', Object.keys(wallet.features));
                        if (wallet.accounts && wallet.accounts.length > 0) {
                          console.log('  Address:', wallet.accounts[0].address);
                        }
                      });

                      checkWalletConnection();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    🔍 除錯：檢測錢包
                  </button>
                  <p className="text-xs text-gray-500">支援 Slush、Sui Wallet、Suiet 等錢包</p>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    ✅ Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
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
              <p className="mt-4 text-gray-600">Fetching certificate...</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <div
                  className={`inline-block px-4 py-2 rounded-lg font-semibold ${getRiskColor(
                    certificateData.risk_level,
                  )}`}
                >
                  {getRiskLabel(certificateData.risk_level)}
                </div>
              </div>

              {/* Security Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Score
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
                  Recommendation
                </label>
                <p className="p-4 bg-gray-50 rounded-lg text-gray-700">
                  {certificateData.recommendation}
                </p>
              </div>

              {/* Reasons */}
              {certificateData.reasons && certificateData.reasons.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analysis Reasons
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
                Timestamp: {new Date(certificateData.timestamp).toLocaleString('en-US')}
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
                      Minting...
                    </span>
                  ) : (
                    '🎖️ Claim NFT Certificate'
                  )}
                </button>
                {!walletConnected && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Please connect your wallet first
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {mintSuccess && (
            <div className="text-center py-8 flex flex-col items-center gap-2">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Certificate Minted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                The NFT certificate has been successfully sent to your wallet
              </p>
              <div className="space-y-3">
                <a
                  href={`${SUIVISION_URL_TESTNET}/txblock/${txDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Transaction on Sui Explorer
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
          <p>Certificate Validity: 30 days</p>
          <p className="mt-1">Provided by SuiGuard</p>
        </div>
      </div>
    </div>
  );
}
