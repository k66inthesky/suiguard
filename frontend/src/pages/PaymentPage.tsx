import {
  BASE_URL,
  CLOCK_ID,
  PUBLISHER_TESTNET,
  serverObjectIds,
  SUISCAN_URL_TESTNET,
  USDC_TYPE,
} from '@/constants';
import { useNetworkVariable } from '@/networkConfig';
import {  MoveCallConstructor, ValidSubscription } from '@/types';
import {  downloadAndDecrypt, generateFileName, getAggregatorUrl, getAllCoins } from '@/utils';
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSuiClient,
} from '@mysten/dapp-kit';
import { SealClient, SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from '@mysten/sui/utils';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export type StorageInfo = {
  status: string;
  blobId: string;
  endEpoch: string;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;
  blobUrl: string;
  suiUrl: string;
  isImage: string;
};

const SESSION_KEY_TTL_MIN = 10;

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const [selectedService, setSelectedService] = useState<string>('service1');
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const [validStatus, setValidStatus] = useState<'valid' | '' | 'invalid'>('');
  const [validSubscription, setValidSubscription] = useState<ValidSubscription | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serviceId, setServiceId] = useState<string>('');

  useEffect(() => {
    const state = location.state as { from?: string; packageIds?: string[] } | null;
    if (!state || state.from !== '/audit') {
      navigate('/get-started', { replace: true });
    }
    setSelectedService;
    ('service1');
  }, [location, navigate]);

  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const sealClient = new SealClient({
    suiClient,
    serverConfigs: serverObjectIds.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false, // Trust testnet key servers
  });

  async function createService(): Promise<{ status: string; data: any }> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::main::setup_suiaudit_service`,
    });
    tx.setGasBudget(10000000);

    return new Promise<{ status: string; data: any }>((resolve, reject) => {
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            const subscriptionObject = result.effects?.created?.find(
              (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
            );
            const createdObjectId = subscriptionObject?.reference?.objectId;
            if (createdObjectId) {
              setServiceId(createdObjectId);
              return resolve({ status: 'ok', data: createdObjectId });
            }
            return resolve({ status: 'error', data: createdObjectId });
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            reject({ status: 'error', data: error });
          },
        },
      );
    });
  }

  async function buyAndVerifySubscription(
    coins: {
      data: Array<{ coinObjectId: string; balance: string }>;
    },
    serviceId: string,
  ): Promise<{ status: string; data: any }> {
    const ONE_OF_TEN_USDC = 100_000;
    if (!coins.data || coins.data.length === 0) {
      throw new Error('No USDC coins found');
    }

    const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    if (totalBalance < BigInt(ONE_OF_TEN_USDC)) {
      throw new Error(
        `Insufficient total USDC balance. Need: ${ONE_OF_TEN_USDC}, Have: ${totalBalance}`,
      );
    }

    const tx = new Transaction();
    const primaryCoin = coins.data[0];
    const primaryCoinArg = tx.object(primaryCoin.coinObjectId);

    if (coins.data.length > 1) {
      const otherCoins = coins.data.slice(1).map((coin) => tx.object(coin.coinObjectId));
      tx.mergeCoins(primaryCoinArg, otherCoins);
    }

    const [coinToUse] = tx.splitCoins(primaryCoinArg, [tx.pure.u64(ONE_OF_TEN_USDC)]);

    tx.moveCall({
      target: `${packageId}::main::buy_suiaudit_key`,
      arguments: [coinToUse, tx.object(serviceId), tx.object(CLOCK_ID)],
      typeArguments: [USDC_TYPE],
    });

    tx.setGasBudget(10000000);

    return new Promise<{ status: string; data: any }>((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            // console.log('Subscription purchased successfully:', result);
            // 查詢訂閱 nft 狀態
            // const service = await suiClient.getObject({
            //   id: serviceId,
            //   options: { showContent: true },
            // });
            // const service_fields = (service.data?.content as { fields: any })?.fields || {};

            // const res = await suiClient.getOwnedObjects({
            //   owner: currentAccount?.address!,
            //   options: {
            //     showContent: true,
            //     showType: true,
            //   },
            //   filter: {
            //     StructType: `${packageId}::subscription::Subscription`,
            //   },
            // });

            // const clock = await suiClient.getObject({
            //   id: CLOCK_ID,
            //   options: { showContent: true },
            // });
            // const fields = (clock.data?.content as { fields: any })?.fields || {};
            // const current_ms = fields.timestamp_ms;

            // 從交易結果中找出剛創建的 Subscription 物件
            const createdSubscription = result.effects?.created?.find(
              (item) =>
                item.owner && typeof item.owner === 'object' && 'AddressOwner' in item.owner,
            );

            if (!createdSubscription) {
              console.error('No subscription object created in transaction');
              reject({ status: 'error', data: 'No subscription created' });
              return;
            }

            const subscriptionId = createdSubscription.reference?.objectId;

            // 使用重試機制獲取新創建的訂閱物件
            const fetchSubscriptionWithRetry = async (
              id: string,
              maxRetries = 3,
              initialDelay = 1000,
            ) => {
              for (let i = 0; i < maxRetries; i++) {
                try {
                  // console.log(`Attempt ${i + 1}/${maxRetries}: Fetching subscription ${id}...`);
                  const obj = await suiClient.getObject({
                    id,
                    options: { showContent: true },
                  });

                  if (obj.data?.content) {
                    // console.log(`✓ Successfully fetched subscription on attempt ${i + 1}`);
                    return obj;
                  }

                  // console.log(`Attempt ${i + 1}: Object exists but no content yet, retrying...`);
                } catch (error) {
                  console.error(`Attempt ${i + 1} failed:`, error);
                }

                if (i < maxRetries - 1) {
                  const delay = initialDelay * Math.pow(1.5, i); // 指數退避：1s, 1.5s, 2.25s, 3.375s, 5.06s
                  // console.log(`Waiting ${delay}ms before next retry...`);
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
              return null;
            };

            // 直接從鏈上獲取剛創建的訂閱物件詳細資訊
            const subscriptionDetail = await fetchSubscriptionWithRetry(subscriptionId!);

            if (!subscriptionDetail?.data?.content) {
              console.error('Cannot fetch subscription object from chain after retries');
              reject({ status: 'error', data: 'Cannot fetch subscription after retries' });
              return;
            }

            const subFields = (subscriptionDetail.data.content as { fields: any })?.fields;

            if (!subFields) {
              console.error('Subscription object has no fields');
              reject({ status: 'error', data: 'Invalid subscription object structure' });
              return;
            }

            const valid_subscription = {
              id: subFields.id?.id || subscriptionId,
              created_at: parseInt(subFields.created_at || '0'),
              service_id: subFields.service_id,
            };

            // console.log('valid_subscription:', valid_subscription);
            // console.log('service_fields:', service_fields);

            resolve({ status: 'ok', data: valid_subscription });
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            reject({ status: 'error', data: error });
          },
        },
      );
    });
  }

  const generateFileReport = async (packageIdToAudit: string) => {
    const resp = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package_id: packageIdToAudit,
      }),
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${resp.status} ${resp.statusText}`);
    }
    return resp;
  };

  const uploadWalrus = (encryptedData: Uint8Array<ArrayBuffer>) => {
    return fetch(`${PUBLISHER_TESTNET}/v1/blobs?epochs=1`, {
      method: 'PUT',
      body: encryptedData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((info) => {
            return { data: info, status: 'ok' };
          });
        } else {
          throw new Error('Something went wrong when storing the blob!');
        }
      })
      .catch(() => {
        return { data: null, status: 'error' };
      });
  };

  const parseBlobInfo = (storage_info: any, media_type: any) => {
    let info;
    if ('alreadyCertified' in storage_info) {
      info = {
        status: 'Already certified',
        blobId: storage_info.alreadyCertified.blobId,
        endEpoch: storage_info.alreadyCertified.endEpoch,
        suiRefType: 'Previous Sui Certified Event',
        suiRef: storage_info.alreadyCertified.event.txDigest,
        suiBaseUrl: `${SUISCAN_URL_TESTNET}/tx`,
        blobUrl: getAggregatorUrl(
          `/v1/blobs/${storage_info.alreadyCertified.blobId}`,
          selectedService,
        ),
        suiUrl: `${SUISCAN_URL_TESTNET}/object/${storage_info.alreadyCertified.event.txDigest}`,
        isImage: media_type.startsWith('image'),
      };
    } else if ('newlyCreated' in storage_info) {
      info = {
        status: 'Newly created',
        blobId: storage_info.newlyCreated.blobObject.blobId,
        endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: 'Associated Sui Object',
        suiRef: storage_info.newlyCreated.blobObject.id,
        suiBaseUrl: `${SUISCAN_URL_TESTNET}/object`,
        blobUrl: getAggregatorUrl(
          `/v1/blobs/${storage_info.newlyCreated.blobObject.blobId}`,
          selectedService,
        ),
        suiUrl: `${SUISCAN_URL_TESTNET}/object/${storage_info.newlyCreated.blobObject.id}`,
        isImage: media_type.startsWith('image'),
      };
    } else {
      return { status: 'error', info: null };
    }
    return { status: 'ok', info };
  };

  const callSealApprove = (
    packageId: string,
    serviceId: string,
    subscriptionId: string,
  ): MoveCallConstructor => {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::subscription::seal_approve`,
        arguments: [
          tx.pure.vector('u8', fromHex(id)),
          tx.object(subscriptionId),
          tx.object(serviceId),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
    };
  };

  const handleCreateReport = async () => {
    setIsLoading(true);

    try {
      const state = location.state as { from?: string; packageIds?: string[] } | null;
      const packageIds = state?.packageIds;
      // const packageIds = ['0x1234567890abcdef']; // Placeholder for testing

      if (!packageIds || packageIds.length === 0) {
        throw new Error('No package ID found. Please return to audit page.');
      }

      const packageIdToAudit = packageIds[0];
      // console.log('📦 Generating report for package:', packageIdToAudit);

      // Step 1: Generate PDF report from backend
      const file = await generateFileReport(packageIdToAudit);
      if (!file) {
        throw new Error('Failed to generate report');
      }
      // console.log('✓ Report generated');

      // Step 2: Create service object on-chain
      const { status: serviceStatus, data: serviceId } = await createService();
      if (serviceStatus !== 'ok') {
        throw new Error('Failed to create service');
      }
      setServiceId(serviceId);
      // console.log('✓ Service created:', serviceId);

      // Step 3: Encrypt report with Seal
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(serviceId);
      const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      // console.log('🔐 Encryption ID:', encryptionId);

  

      const arrayBuffer = await file.arrayBuffer();
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2, 
        packageId: packageId,
        id: encryptionId,
        data: new Uint8Array(arrayBuffer),
      });
      // console.log('✓ Report encrypted');

      // Step 4: Upload to Walrus
      const blobInfo = await uploadWalrus(encryptedBytes);
      if (!blobInfo.data) {
        throw new Error(`Failed to upload to Walrus: ${blobInfo.status}`);
      }

      const { status, info } = parseBlobInfo(blobInfo.data, file.type);
      setInfo(info);
      if (status === 'error' || !info) {
        throw new Error('Failed to parse blob info');
      }
      // console.log('✓ Uploaded to Walrus:', info.blobId);

      // Step 5: Purchase subscription NFT with USDC
      const coins = await getAllCoins(currentAccount!.address!, suiClient, USDC_TYPE);
      const { status: validSubscriptionStatus, data: subscription } =
        await buyAndVerifySubscription(coins, serviceId);

      if (validSubscriptionStatus !== 'ok') {
        setValidSubscription(undefined);
        setValidStatus('invalid');
        throw new Error('Failed to purchase subscription');
      }

      setValidSubscription(subscription);
      setValidStatus('valid');
      // console.log('✓ Subscription purchased:', subscription.id);
    } catch (error) {
      console.error('❌ Report creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportDownload = async (serviceId: string) => {
    setIsLoading(true);

    try {
      if (!info || !validSubscription) {
        throw new Error('No storage or valid subscription info available');
      }

      if (
        currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === currentAccount!.address!
      ) {
        const moveCallConstructor = callSealApprove(packageId, serviceId, validSubscription.id);

        const decryptedFileUrl = await downloadAndDecrypt(
          info.blobId,
          currentSessionKey,
          suiClient,
          sealClient,
          moveCallConstructor,
        );

        if (decryptedFileUrl && decryptedFileUrl.length > 0) {
          // ✅ Open in new tab and trigger download
          const newTab = window.open(decryptedFileUrl[0], '_blank');

          if (newTab) {
            // ✅ Wait for new tab to load, then trigger download via JavaScript
            newTab.onload = () => {
              const a = newTab.document.createElement('a');
              a.href = decryptedFileUrl[0];
              a.download = generateFileName();
              newTab.document.body.appendChild(a);
              a.click();
              newTab.document.body.removeChild(a);

              // console.log('✅ Download triggered in new tab');

              // ✅ Clean up
              setTimeout(() => {
                URL.revokeObjectURL(decryptedFileUrl[0]);
                newTab.close(); // Optional: auto-close tab after download starts
              }, 1000);
            };
          } else {
            // ✅ Fallback: popup blocked, use current tab
            console.warn('⚠️ Popup blocked, using fallback download');
            const a = document.createElement('a');
            a.href = decryptedFileUrl[0];
            a.download = generateFileName();
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(decryptedFileUrl[0]);
            }, 100);
          }

          setIsLoading(false);
          return;
        }
      }

      // console.log('🔑 Creating new session key...');
      setCurrentSessionKey(null);

      const sessionKey = await SessionKey.create({
        address: currentAccount!.address!,
        packageId,
        ttlMin: SESSION_KEY_TTL_MIN,
        suiClient,
      });

      // ✅ Sign with wallet to prove ownership
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            try {
              await sessionKey.setPersonalMessageSignature(result.signature);
              // console.log('✓ Session key signed');

              const moveCallConstructor = callSealApprove(
                packageId,
                serviceId,
                validSubscription.id,
              );

              const decryptedFileUrl = await downloadAndDecrypt(
                info.blobId,
                sessionKey,
                suiClient,
                sealClient,
                moveCallConstructor,
              );
              // console.log('decryptedFileUrl:', decryptedFileUrl);
              

              setCurrentSessionKey(sessionKey);
              

              if (decryptedFileUrl && decryptedFileUrl.length > 0) {
                const newTab = window.open(decryptedFileUrl[0], '_blank');
                if (newTab) {
                  // ✅ Wait for new tab to load, then trigger download
                  newTab.onload = () => {
                    const a = newTab.document.createElement('a');
                    a.href = decryptedFileUrl[0];
                    a.download = generateFileName();
                    newTab.document.body.appendChild(a);
                    a.click();
                    newTab.document.body.removeChild(a);

                    // ✅ Clean up and optionally close tab
                    setTimeout(() => {
                      URL.revokeObjectURL(decryptedFileUrl[0]);
                    }, 1000);
                  };
                } else {
                  // ✅ Fallback: popup blocked
                  console.warn('⚠️ Popup blocked, using fallback download');
                  const a = document.createElement('a');
                  a.href = decryptedFileUrl[0];
                  a.download = generateFileName();
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();

                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(decryptedFileUrl[0]);
                  }, 100);
                }
              }
            } catch (error) {
              console.error('❌ Download error:', error);
              alert(
                error instanceof Error
                  ? `Download failed: ${error.message}`
                  : 'Download failed. Please try again.',
              );
            } finally {
              setIsLoading(false);
            }
          },
          onError: (error) => {
            console.error('❌ Signature failed:', error);
            alert('Wallet signature cancelled. Please try again.');
            setIsLoading(false);
          },
        },
      );
    } catch (error) {
      console.error('❌ Download preparation error:', error);
      alert(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to prepare download. Please try again.',
      );
      setIsLoading(false);
    }
  };
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="w-full max-w-4xl mx-auto px-6">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment</h1>
            <p className="text-xl text-gray-600">
              Get your comprehensive smart contract security report
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-[#0857aa] mb-2">0.1 USDC</div>
              <div className="text-gray-600">per audit report</div>
            </div>
            <div className="space-y-4 mb-8">
              {[
                'AI-powered vulnerability detection',
                'Comprehensive security analysis',
                'Encrypted report storage on Walrus',
                'Instant download access',
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {currentAccount && validStatus !== 'valid' && (
                <button
                  onClick={handleCreateReport}
                  disabled={isLoading}
                  className="w-full bg-[#0857aa] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#064a8c] hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <ReloadIcon className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Creating Report...' : 'Create Report'}
                </button>
              )}

              {validStatus === 'valid' && (
                <button
                  onClick={() => handleReportDownload(serviceId)}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <ReloadIcon className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Downloading...' : 'Download Report'}
                </button>
              )}
            </div>
            <div className="text-center py-4">
              <ConnectButton />
            </div>
            <Link
              to="/get-started"
              className="mt-6 text-blue-600 hover:underline hover:cursor-pointer block text-center"
            >
              Start another audit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
