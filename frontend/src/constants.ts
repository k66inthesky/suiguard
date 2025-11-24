import { WalrusService } from './types';

export const APP_NAME = 'SuiAudit';
export const APP_DESCRIPTION =
  'Comprehensive smart contract security analysis powered by advanced AI. Detect vulnerabilities and ensure code quality.';

// page route
export const POC_BASE_PATH = '/sui-wallet-cleanup-app';

export const demoVideoUrl = 'https://www.youtube.com/watch?v=K3_QJftZTKo';
export const githubRepoUrl = 'https://github.com/k66inthesky/suiguard';
export const contactEmail = 'suiaudit.ai@gmail.com';
export const twitterUrl = 'https://x.com/suiaudit';

export const FEATURES = {
  home: '',
  blocklist: 'Blocklist Detection',
  safeWebsite: 'Website Security Checker',
  packageCheck: 'Sui-Move Version Validator',
  audit: 'AI-Powered Sui-Move Code Audit',
};

export const cleanupAppFeatures = {
  home: '',
  blocklist: 'Blocklist Detection',
  blocklistReport: 'Blocklist Report',
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

export const BLOCKLIST_REPORT_URL = 'https://forms.gle/H1Jxch47dHvfpe2c8';

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

export const DEVNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; 
export const TESTNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; 
export const MAINNET_FULLNODE_URL = 'https://fullnode.devnet.sui.io'; 

// verify key server object IDs
export const serverObjectIds = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // https://seal-docs.wal.app/Pricing/#testnet
  '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2',
  '0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007',
  '0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2',
  '0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105',
  '0x39cef09b24b667bc6ed54f7159d82352fe2d5dd97ca9a5beaa1d21aa774f25a2',
  '0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46',
  '0x3c93ec1474454e1b47cf485a4e5361a5878d722b9492daf10ef626a76adc3dad',
  '0x6a0726a1ea3d62ba2f2ae51104f2c3633c003fb75621d06fde47f04dc930ba06',
];

export const AGGREGATOR_TESTNET = 'https://aggregator.walrus-testnet.walrus.space';
export const PUBLISHER_TESTNET = 'https://publisher.walrus-testnet.walrus.space';

export const BASE_URL = 'http://localhost:8080';

// export const aggregators = [
//   'aggregator1',
//   'aggregator2',
//   'aggregator3',
//   'aggregator4',
//   'aggregator5',
//   'aggregator6',
// ];

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
