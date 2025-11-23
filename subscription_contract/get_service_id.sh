#!/bin/bash

# Quick script to extract Service ID from existing deployment
# Usage: ./get_service_id.sh

PACKAGE_ID="0x0a59862c4ccdc34a79aa4dceb8b78fd3bcc89ea45ff9ebce02b0f30fef74f3dd"

echo "🔍 Querying Service ID for package: $PACKAGE_ID"

# Query transactions that called setup_suiaudit_service
SERVICE_ID=$(sui client call \
  --package "$PACKAGE_ID" \
  --module main \
  --function setup_suiaudit_service \
  --gas-budget 100000000 \
  --json 2>&1 | jq -r '.objectChanges[] | select(.objectType | contains("::subscription::Service")) | .objectId')

if [ -n "$SERVICE_ID" ] && [ "$SERVICE_ID" != "null" ]; then
  echo "✅ Service ID: $SERVICE_ID"
  
  # Generate config file
  cat > service_config.json << EOF
{
  "packageId": "$PACKAGE_ID",
  "serviceId": "$SERVICE_ID",
  "clockId": "0x6"
}
EOF
  
  echo "📝 Config saved to service_config.json"
else
  echo "⚠️  Creating new service..."
  # If not found, create new one
  SERVICE_ID=$(sui client call \
    --package "$PACKAGE_ID" \
    --module main \
    --function setup_suiaudit_service \
    --gas-budget 100000000 \
    --json | jq -r '.objectChanges[] | select(.objectType | contains("::subscription::Service")) | .objectId')
  
  echo "✅ New Service created: $SERVICE_ID"
fi
