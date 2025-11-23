// Auto-query Service ID from blockchain
// Usage: npx tsx query_service.ts <PACKAGE_ID>

import { SuiClient } from '@mysten/sui/client';

const PACKAGE_ID = process.argv[2] || '0x0a59862c4ccdc34a79aa4dceb8b78fd3bcc89ea45ff9ebce02b0f30fef74f3dd';

async function findServiceId() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  
  console.log('🔍 Searching for Service objects...');
  console.log(`Package ID: ${PACKAGE_ID}\n`);
  
  // Query all objects of type Service
  const serviceType = `${PACKAGE_ID}::subscription::Service`;
  
  const response = await client.getOwnedObjects({
    owner: '0x0000000000000000000000000000000000000000000000000000000000000000', // Try to query shared objects
    filter: { StructType: serviceType },
    options: { showContent: true, showType: true }
  });
  
  console.log('Response:', JSON.stringify(response, null, 2));
}

// Alternative: Query from dynamic field or events
async function findServiceFromEvents() {
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
  
  console.log('🔍 Searching Service from transaction events...');
  
  // Query transactions that called setup_suiaudit_service
  const txs = await client.queryTransactionBlocks({
    filter: {
      MoveFunction: {
        package: PACKAGE_ID,
        module: 'main',
        function: 'setup_suiaudit_service'
      }
    },
    options: {
      showObjectChanges: true,
      showEffects: true
    },
    limit: 10
  });
  
  console.log(`Found ${txs.data.length} transactions\n`);
  
  for (const tx of txs.data) {
    console.log(`Transaction: ${tx.digest}`);
    
    if (tx.objectChanges) {
      for (const change of tx.objectChanges) {
        if (change.type === 'created' && 
            'objectType' in change && 
            change.objectType.includes('::subscription::Service')) {
          console.log(`\n✅ Found Service ID: ${change.objectId}`);
          console.log(`   Type: ${change.objectType}`);
          console.log(`   Owner: ${JSON.stringify(change.owner)}\n`);
          
          // Generate config
          console.log('📝 Frontend Config:');
          console.log(`export const SERVICE_ID = "${change.objectId}";`);
          return change.objectId;
        }
      }
    }
  }
  
  console.log('❌ No Service found');
}

findServiceFromEvents().catch(console.error);
