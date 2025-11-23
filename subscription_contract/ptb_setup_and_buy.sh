#!/bin/bash

# PTB: Setup SuiAudit Service and Buy Key in one transaction
# This uses Sui's Programmable Transaction Block to chain two function calls

sui client ptb \
  --gas-budget 100000000 \
  --assign service \
  --move-call 0x0a59862c4ccdc34a79aa4dceb8b78fd3bcc89ea45ff9ebce02b0f30fef74f3dd::main::setup_suiaudit_service \
  --assign coin \
  --split-coins gas "[20]" \
  --move-call 0x0a59862c4ccdc34a79aa4dceb8b78fd3bcc89ea45ff9ebce02b0f30fef74f3dd::main::buy_suiaudit_key@0x2::sui::SUI coin service 0x6

