import { getFullnodeUrl } from '@mysten/sui/client';
import { TESTNET_PACKAGE_ID } from './constants';
import { createNetworkConfig } from '@mysten/dapp-kit';

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      packageId: TESTNET_PACKAGE_ID,
    },
  },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
