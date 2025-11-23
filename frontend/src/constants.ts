import { WalrusService } from './types';

export const EXTENSION_NAME = 'SuiAudit';
export const EXTENSION_DESCRIPTION =
  'Comprehensive smart contract security analysis powered by advanced AI. Detect vulnerabilities and ensure code quality.';

export const FEATURES = {
  home: '',
  blocklist: 'Blocklist Detection',
  safeWebsite: 'Website Security Checker',
  packageCheck: 'Sui-Move Version Validator',
  audit: 'AI-Powered Sui-Move Code Audit',
};
// Blocklist
export const BLOCKLIST_URLS = {
  coin: 'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/coin-list.json',
  object:
    'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/object-list.json',
  domain:
    'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/domain-list.json',
  package:
    'https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/package-list.json',
};

export const BLOCKLIST_REPORT_URL =
  'https://docs.google.com/forms/d/1HSsrqDwzCAP-axAI0pUbpRm-x4ktZVaX2xjwiNMAaI4/edit?hl=zh-tw';

//
export const DEVNET_PACKAGE_ID =
  '0x33a29593d06ba454a50f3e03d19e96af72710335777692566bb3125d78610782';
export const MAINNET_PACKAGE_ID = '0xTODO';

export const TESTNET_PACKAGE_ID =
  '0xc173db0c6886cf0ba5dba6c4a80d7037e63f332847e176cebe0acd9043a01b78';

// Certificate Contract on Sui Testnet
export const CERTIFICATE_CONTRACT = {
  PACKAGE_ID: '0xc5bc1fa69949801087a87b623d08a00109d766323a349737e1344adac8373e4b',
  MODULE: 'certificate',
  FUNCTION: 'issue_certificate',
  NETWORK: 'testnet',
};

export const SUISCAN_URL_TESTNET = `https://suiscan.xyz/testnet`;
export const SUISCAN_URL_MAINNET = `https://suiscan.xyz/mainnet`;

export const SUIVISION_URL_TESTNET = 'https://testnet.suivision.xyz';
export const SUIVISION_URL_MAINNET = 'https://suivision.xyz';

export const DEVNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; // replace with the RPC URL you want to use
export const TESTNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; // replace with the RPC URL you want to use
export const MAINNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; // replace with the RPC URL you want to use

export const CLIENT_ID = '573120070871-0k7ga6ns79ie0jpg1ei6ip5vje2ostt6.apps.googleusercontent.com';

export const KEY_PAIR_SESSION_STORAGE_KEY = 'demo_ephemeral_key_pair';

export const MAX_EPOCH_LOCAL_STORAGE_KEY = 'demo_max_epoch_key_pair';

export const USER_SALT_LOCAL_STORAGE_KEY = 'demo_user_salt_key_pair';

export const STEPS_LABELS_TRANS_KEY = [
  '16e758e8',
  '9b8b5398',
  '8adf5b45',
  '8b72e7cd',
  '66f6b490',
  'af802c7a',
  'c649dd70',
];

export const SUI_DEVNET_FAUCET = 'https://faucet.devnet.sui.io/gas';

export const SUI_PROVER_DEV_ENDPOINT = 'https://prover-dev.mystenlabs.com/v1';

export const RANDOMNESS_SESSION_STORAGE_KEY = 'demo_randomness_key_pair';

export const REDIRECT_URI = 'http://localhost:5173/'; //back to your app URL

// verify key server object IDs
export const serverObjectIds = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

export const AGGREGATOR_TESTNET = 'https://aggregator.walrus-testnet.walrus.space';
export const PUBLISHER_TESTNET = 'https://publisher.walrus-testnet.walrus.space';

export const BASE_URL = 'http://localhost:8080';

export const aggregators = [
  'aggregator1',
  'aggregator2',
  'aggregator3',
  'aggregator4',
  'aggregator5',
  'aggregator6',
];

export const walrusServices: WalrusService[] = [
  {
    id: 'service1',
    name: 'walrus.space',
    publisherUrl: '/publisher1',
    aggregatorUrl: '/aggregator1',
  },
  {
    id: 'service2',
    name: 'staketab.org',
    publisherUrl: '/publisher2',
    aggregatorUrl: '/aggregator2',
  },
  {
    id: 'service3',
    name: 'redundex.com',
    publisherUrl: '/publisher3',
    aggregatorUrl: '/aggregator3',
  },
  {
    id: 'service4',
    name: 'nodes.guru',
    publisherUrl: '/publisher4',
    aggregatorUrl: '/aggregator4',
  },
  {
    id: 'service5',
    name: 'banansen.dev',
    publisherUrl: '/publisher5',
    aggregatorUrl: '/aggregator5',
  },
  {
    id: 'service6',
    name: 'everstake.one',
    publisherUrl: '/publisher6',
    aggregatorUrl: '/aggregator6',
  },
];

export const USDC_TYPE =
  '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';

export const CLOCK_ID = '0x6';
