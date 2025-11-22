import { SealClient, SessionKey, NoAccessError, EncryptedObject } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import React from 'react';
import { aggregators, SUISCAN_URL_TESTNET, walrusServices } from './constants';

export type MoveCallConstructor = (tx: Transaction, id: string) => void;

export const downloadAndDecrypt = async (
  blobId: string,
  sessionKey: SessionKey,
  suiClient: SuiClient,
  sealClient: SealClient,
  moveCallConstructor: (tx: Transaction, id: string) => void,
  setDecryptedFileUrls: (urls: string[]) => void,
) => {
  // First, download all files in parallel (ignore errors)
  const download = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const randomAggregator = aggregators[Math.floor(Math.random() * aggregators.length)];
    const aggregatorUrl = `/${randomAggregator}/v1/blobs/${blobId}`;
    const response = await fetch(aggregatorUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return null;
    }
    return await response.arrayBuffer();
  };

  const downloadResult = await download();

  console.log('download result:', downloadResult);

  if (!downloadResult) {
    const errorMsg =
      'Cannot retrieve files from this Walrus aggregator, try again (a randomly selected aggregator will be used). Files uploaded more than 1 epoch ago have been deleted from Walrus.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Then, decrypt files sequentially Step 3: 本地解密檔案
  const decryptedFileUrls: string[] = [];

  const fullId = EncryptedObject.parse(new Uint8Array(downloadResult)).id;

  console.log('fullId:', fullId);

  const tx = new Transaction();
  moveCallConstructor(tx, fullId);

  const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
  console.log('txBytes:', txBytes);

  try {
    // Step 1: 先獲取密鑰
    await sealClient.fetchKeys({ ids: [fullId], txBytes, sessionKey, threshold: 2 });
    // // 本地解密（已有金鑰碎片）
    // console.log('in seal decrypt');

    const decryptedFile = await sealClient.decrypt({
      data: new Uint8Array(downloadResult),
      sessionKey,
      txBytes,
    });
    // console.log('decryptedFile:', decryptedFile);

    const blob = new Blob([new Uint8Array(decryptedFile)]); //TODO:limit only to PDF

    // encrypted file
    // const blob = new Blob([new Uint8Array(downloadResult)]); //TODO:limit only to PDF
    console.log('blob:', blob);

    decryptedFileUrls.push(URL.createObjectURL(blob));
  } catch (err) {
    console.log(err);
    const errorMsg =
      err instanceof NoAccessError
        ? 'No access to decryption keys'
        : 'Unable to decrypt files, try again';
    console.error(errorMsg, err);
    throw new Error(errorMsg);
  }

  if (decryptedFileUrls.length > 0) {
    console.log('setting decrypted file urls:', decryptedFileUrls);
    return decryptedFileUrls;
  }
  console.log('decryptedFileUrls:', decryptedFileUrls);
};

export const getObjectExplorerLink = (id: string): React.ReactElement => {
  return React.createElement(
    'a',
    {
      href: `${SUISCAN_URL_TESTNET}/object/${id}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      style: { textDecoration: 'underline' },
    },
    id.slice(0, 10) + '...',
  );
};

// 生成檔案名稱
export const generateFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `report_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
};

export function getAggregatorUrl(path: string, selectedService: string): string {
  const service = walrusServices.find((s) => s.id === selectedService);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.aggregatorUrl}/v1/${cleanPath}`;
}

export function getPublisherUrl(path: string, selectedService: string): string {
  const service = walrusServices.find((s) => s.id === selectedService);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.publisherUrl}/v1/${cleanPath}`;
}

/** get all coins from wallet */
export async function getAllCoins(address: string, suiClient: SuiClient, coinType: string) {
  return address
    ? suiClient.getCoins({
        owner: address,
        coinType: coinType,
      })
    : { data: [] };
}

export const convertTimestamp = (tstr: string) => {
  const date = new Date(tstr);
  const formatted = date
    .toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-')
    .replace(/,/, '');
  const unix = Math.floor(date.getTime() / 1000);
  return { formatted, unix };
};

export const isValidSuiPackageId = (input: string) => {
  const suiPackageIdRegex = /^(0x|0X)?[a-fA-F0-9]{1,64}$/;
  return suiPackageIdRegex.test(input);
};
