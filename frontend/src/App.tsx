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
import { Box, Button, Container, Flex, Heading } from '@radix-ui/themes';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
  BASE_URL,
  CLOCK_ID,
  PUBLISHER_TESTNET,
  serverObjectIds,
  SUISCAN_URL_TESTNET,
  USDC_TYPE,
} from './constants';
import { useNetworkVariable } from './networkConfig';
import { MoveCallConstructor, ValidSubscription } from './types';
import { downloadAndDecrypt, generateFileName, getAggregatorUrl, getAllCoins } from './utils';

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

function App() {
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
    verifyKeyServers: false,
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

  /** buy nft - merge all coins -> split exact amount -> buy */
  async function buyAndVerifySubscription(
    coins: {
      data: Array<{ coinObjectId: string; balance: string }>;
    },
    serviceId: string,
  ): Promise<{ status: string; data: any }> {
    const ONE_OF_TEN_USDC = 100_000; // 0.1 USDC (6 decimals)
    if (!coins.data || coins.data.length === 0) {
      throw new Error('No USDC coins found');
    }

    // 計算總餘額
    const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    console.log('Total USDC balance:', totalBalance.toString());

    if (totalBalance < BigInt(ONE_OF_TEN_USDC)) {
      throw new Error(
        `Insufficient total USDC balance. Need: ${ONE_OF_TEN_USDC}, Have: ${totalBalance}`,
      );
    }

    const tx = new Transaction();

    // 主流做法：先 merge 所有 coins，再 split 精確金額
    const primaryCoin = coins.data[0];
    const primaryCoinArg = tx.object(primaryCoin.coinObjectId);

    // Merge 其他所有 coins 到主 coin
    if (coins.data.length > 1) {
      const otherCoins = coins.data.slice(1).map((coin) => tx.object(coin.coinObjectId));
      tx.mergeCoins(primaryCoinArg, otherCoins);
    }

    // Split 出精確需要的金額
    const [coinToUse] = tx.splitCoins(primaryCoinArg, [tx.pure.u64(ONE_OF_TEN_USDC)]);

    // 調用購買 NFT 的合約
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
            const service = await suiClient.getObject({
              id: serviceId,
              options: { showContent: true },
            });
            const service_fields = (service.data?.content as { fields: any })?.fields || {};

            const res = await suiClient.getOwnedObjects({
              owner: currentAccount?.address!,
              options: {
                showContent: true,
                showType: true,
              },
              filter: {
                StructType: `${packageId}::subscription::Subscription`,
              },
            });

            const clock = await suiClient.getObject({
              id: CLOCK_ID,
              options: { showContent: true },
            });
            const fields = (clock.data?.content as { fields: any })?.fields || {};
            const current_ms = fields.timestamp_ms;

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
                  console.log(`Attempt ${i + 1}/${maxRetries}: Fetching subscription ${id}...`);
                  const obj = await suiClient.getObject({
                    id,
                    options: { showContent: true },
                  });

                  if (obj.data?.content) {
                    console.log(`✓ Successfully fetched subscription on attempt ${i + 1}`);
                    return obj;
                  }

                  console.log(`Attempt ${i + 1}: Object exists but no content yet, retrying...`);
                } catch (error) {
                  console.error(`Attempt ${i + 1} failed:`, error);
                }

                if (i < maxRetries - 1) {
                  const delay = initialDelay * Math.pow(1.5, i); // 指數退避：1s, 1.5s, 2.25s, 3.375s, 5.06s
                  console.log(`Waiting ${delay}ms before next retry...`);
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

            console.log('valid_subscription:', valid_subscription);
            console.log('service_fields:', service_fields);

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

  const generateFileReport = async () => {
    const resp = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package_id: packageId,
      }),
    });

    if (!resp.ok) {
      throw new Error(`API request failed: ${resp.status} ${resp.statusText}`);
    }
    return resp;
  };

  // walrus write get blob_id
  const uploadWalrus = (encryptedData: Uint8Array<ArrayBuffer>) => {
    return fetch(`${PUBLISHER_TESTNET}/v1/blobs?epochs=1`, {
      //service1
      method: 'PUT',
      body: encryptedData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json().then((info) => {
            return { data: info, status: 'ok' };
          });
        } else {
          alert('Error publishing the blob on Walrus, please select a different Walrus service.');
          throw new Error('Something went wrong when storing the blob!');
        }
      })
      .catch((error) => {
        return { data: null, status: error };
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
      const file = await generateFileReport();

      if (!file) {
        throw new Error('Failed to generate report');
      }

      // create service id onchain
      const { status: serviceStatus, data: serviceId } = await createService();
      if (serviceStatus !== 'ok') {
        throw new Error('Failed to create service id');
      }

      // encrypt report
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(serviceId);
      const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce])); //service id return by move call
      console.log('encrypted id:', encryptionId);

      const arrayBuffer = await file.arrayBuffer();
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId: packageId,
        id: encryptionId,
        data: new Uint8Array(arrayBuffer),
      });

      // walrus write get blob_id
      const blobInfo = await uploadWalrus(encryptedBytes);
      if (!blobInfo.data) {
        throw new Error('Failed to upload to walrus', blobInfo.status);
      }

      const { status, info } = parseBlobInfo(blobInfo.data, file.type);
      setInfo(info);
      if (status === 'error' || !info) {
        throw new Error('Failed to parseBlobInfo');
      }

      console.log('parseBlobInfo:', info);

      // check coins
      const coins = await getAllCoins(currentAccount!.address!, suiClient, USDC_TYPE);

      // 判斷NFT 絕對可否解密
      const { status: validSubscriptionStatus, data: subscription } =
        await buyAndVerifySubscription(coins, serviceId);
      if (validSubscriptionStatus !== 'ok') {
        setValidSubscription(undefined);
        setValidStatus('invalid');
        throw new Error('Failed to purchase SuiAudit Access Key NFT', subscription);
      }
      setValidSubscription(subscription);
      setValidStatus('valid');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportDownload = async (serviceId: string) => {
    try {
      if (!info || !validSubscription) {
        throw new Error('No storage or valid subscription info available');
      }

      // already has sessionkey
      if (
        currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === currentAccount!.address!
      ) {
        const moveCallConstructor = callSealApprove(
          packageId,
          serviceId, // service id from move call
          validSubscription.id, //subscription nft id
        );
        const decryptedFileUrl = await downloadAndDecrypt(
          info.blobId,
          currentSessionKey,
          suiClient,
          sealClient,
          moveCallConstructor,
        );

        if (decryptedFileUrl && decryptedFileUrl.length > 0) {
          const a = document.createElement('a');
          a.href = decryptedFileUrl[0];
          a.download = generateFileName();
          a.click();
        }
      }

      // first create session key
      console.log('Creating new session key...');
      setCurrentSessionKey(null);

      const sessionKey = await SessionKey.create({
        address: currentAccount!.address!,
        packageId,
        ttlMin: SESSION_KEY_TTL_MIN,
        suiClient,
      });

      // sign to access subscription nft
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);

            // tie session key with subscription nft
            const moveCallConstructor = callSealApprove(packageId, serviceId, validSubscription.id);
            const decryptedFileUrl = await downloadAndDecrypt(
              info.blobId,
              sessionKey,
              suiClient,
              sealClient,
              moveCallConstructor,
            );
            setCurrentSessionKey(sessionKey);
            console.log('session key signed:', result, decryptedFileUrl);

            if (decryptedFileUrl && decryptedFileUrl.length > 0) {
              const a = document.createElement('a');
              a.href = decryptedFileUrl[0];
              a.download = generateFileName();
              a.click();
            }
          },
        },
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container size="3">
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: '1px solid var(--gray-a2)',
        }}
      >
        <Box>
          <Heading>SuiAudit</Heading>
        </Box>

        <Box style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/">Home</Link>
          {currentAccount && (!validStatus || validStatus === 'invalid') && (
            <Button size="3" onClick={handleCreateReport} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Report'}
            </Button>
          )}
          {validStatus === 'valid' && (
            <Button size="3" onClick={() => handleReportDownload(serviceId)} disabled={isLoading}>
              {isLoading ? 'Downloading...' : 'Download Report'}
            </Button>
          )}
          <ConnectButton />
        </Box>
      </Flex>

      <Box px="4" py="4">
        <Outlet />
      </Box>
    </Container>
  );
}
export default App;
