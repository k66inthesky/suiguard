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
import { Suspense, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
  BASE_URL,
  CLOCK_ID,
  PUBLISHER_TESTNET,
  serverObjectIds,
  SUBSCRIPTION_SERVICE_ID,
  SUISCAN_URL_TESTNET,
  USDC_TYPE,
} from './constants';
import { useNetworkVariable } from './networkConfig';
import { MoveCallConstructor, Page, ValidSubscription } from './types';
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
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  /** buy nft */
  async function buyAndVerifySubscription(coins: {
    data: Array<{ coinObjectId: string; balance: string }>;
  }): Promise<{ status: string; data: any }> {
    const ONE_OF_TEN_USDC = 100_000; // 0.1 USDC (6 decimals)

    console.log('coins:', coins);

    if (!coins.data || coins.data.length === 0) {
      throw new Error('No USDC coins found');
    }

    // 找出餘額足夠的 USDC coin
    const suitableCoin = coins.data.find((coin) => BigInt(coin.balance) >= BigInt(ONE_OF_TEN_USDC));
    console.log('suitable coins:', suitableCoin);

    // Case 1: 有單個 coin 餘額足夠 -> split coin
    const tx = new Transaction();
    let coinToUse;

    if (suitableCoin) {
      console.log('Found suitable coin, splitting...');
      [coinToUse] = tx.splitCoins(tx.object(suitableCoin.coinObjectId), [
        tx.pure.u64(ONE_OF_TEN_USDC),
      ]);
    } else {
      // Case 2: 沒有單個 coin 足夠 -> merge coins
      console.log('No single coin sufficient, merging...');
      // 計算總餘額
      const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));

      if (totalBalance < BigInt(ONE_OF_TEN_USDC)) {
        throw new Error(
          `Insufficient total USDC balance. Need: ${ONE_OF_TEN_USDC}, Have: ${totalBalance}`,
        );
      }

      // 取第一個 coin 作為主 coin
      const primaryCoin = coins.data[0];
      const otherCoins = coins.data.slice(1).map((coin) => tx.object(coin.coinObjectId));

      // Merge 其他 coins 到主 coin
      if (otherCoins.length > 0) {
        tx.mergeCoins(tx.object(primaryCoin.coinObjectId), otherCoins);
      }

      // Split 出需要的金額
      [coinToUse] = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [
        tx.pure.u64(ONE_OF_TEN_USDC),
      ]);
    }

    // 2. 調用購買 access NFT的合約
    tx.moveCall({
      target: `${packageId}::main::buy_suiaudit_key`,
      arguments: [
        coinToUse,
        tx.object(SUBSCRIPTION_SERVICE_ID),
        tx.object(CLOCK_ID), // ← Clock
      ],
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
            console.log('Subscription purchased successfully:', result);
            // TODO: 查詢訂閱 nft 狀態
            const service = await suiClient.getObject({
              id: SUBSCRIPTION_SERVICE_ID,
              options: { showContent: true },
            });
            const service_fields = (service.data?.content as { fields: any })?.fields || {};
            console.log('current service obj:', service_fields);

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
            console.log('getOwnedObjects:', res);

            const clock = await suiClient.getObject({
              id: CLOCK_ID,
              options: { showContent: true },
            });
            const fields = (clock.data?.content as { fields: any })?.fields || {};
            const current_ms = fields.timestamp_ms;
            console.log('clock:', clock, 'fields:', fields, 'current_ms:', current_ms);

            const valid_subscription = res.data
              .map((obj) => {
                const fields = (obj!.data!.content as { fields: any }).fields;
                const x = {
                  id: fields?.id.id,
                  created_at: parseInt(fields?.created_at),
                  service_id: fields?.service_id,
                };
                return x;
              })
              .filter((item) => item.service_id === service_fields.id.id)
              .find((item) => {
                return item.created_at + parseInt(service_fields.ttl) > current_ms;
              });

            console.log('valid_subscription:', valid_subscription);
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

    console.log('generateFileReport:', resp);

    if (!resp.ok) {
      throw new Error(`API request failed: ${resp.status} ${resp.statusText}`);
    }

    return resp;
  };

  // walrus write get blob_id
  const uploadWalrus = (encryptedData: Uint8Array<ArrayBuffer>) => {
    console.log('in uploadWalrus');

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
      console.log('in callSealApprove:', id);

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

  // generate report
  const handleCreateReport = async () => {
    setIsLoading(true);

    try {
      // generate report
      const file = await generateFileReport();

      if (!file) {
        throw new Error('Failed to generate report');
      }

      // encrypt report
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(packageId);
      const encryptionId = toHex(new Uint8Array([...policyObjectBytes, ...nonce])); //TODO: service id return by move call
      console.log('encrypted id:', encryptionId);

      const arrayBuffer = await file.arrayBuffer();
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2, // at least 2 verify servers
        packageId: packageId,
        id: encryptionId, // 加密 ID = [服務 ID][隨機 nonce]
        data: new Uint8Array(arrayBuffer),
      });
      // console.log('handleCreateReport.encryptedBytes', encryptedBytes);

      // walrus write get blob_id
      const blobInfo = await uploadWalrus(encryptedBytes);
      if (!blobInfo.data) {
        throw new Error('Failed to upload to walrus', blobInfo.status);
      }
      console.log('upload walrus, blob:', blobInfo);

      const { status, info } = parseBlobInfo(blobInfo.data, file.type);
      setInfo(info);
      if (status === 'error' || !info) {
        throw new Error('Failed to parseBlobInfo');
      }

      console.log('parseBlobInfo:', info);

      // check coins
      const coins = await getAllCoins(currentAccount!.address!, suiClient, USDC_TYPE);

      // 判斷NFT 絕對可否解密
      // Buy NFT first, TODO: if already created
      const { status: validSubscriptionStatus, data: subscription } =
        await buyAndVerifySubscription(coins);
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

  const handleReportDownload = async () => {
    try {
      if (!info || !validSubscription) {
        throw new Error('No storage or valid subscription info available');
      }

      // 解密 & 下載
      // already has sessionkey
      if (
        currentSessionKey &&
        !currentSessionKey.isExpired() &&
        currentSessionKey.getAddress() === currentAccount!.address!
      ) {
        const moveCallConstructor = callSealApprove(
          packageId,
          SUBSCRIPTION_SERVICE_ID, // service id from move call
          validSubscription.id, //subscription nft id
        );
        // get decryptedFileUrls
        const decryptedFileUrl = await downloadAndDecrypt(
          info.blobId,
          currentSessionKey,
          suiClient,
          sealClient,
          moveCallConstructor,
          setDecryptedFileUrls,
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
      console.log('sessionKey:', sessionKey);

      // sign to access subscription nft
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            console.log('tie:', validSubscription);

            // tie session key with subscription nft
            const moveCallConstructor = await callSealApprove(
              packageId,
              SUBSCRIPTION_SERVICE_ID,
              validSubscription.id,
            );
            const decryptedFileUrl = await downloadAndDecrypt(
              info.blobId,
              sessionKey,
              suiClient,
              sealClient,
              moveCallConstructor,
              setDecryptedFileUrls,
            );
            setCurrentSessionKey(sessionKey);
            console.log('session key signed:', result, decryptedFileUrls);

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
            <Button size="3" onClick={handleReportDownload} disabled={isLoading}>
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
