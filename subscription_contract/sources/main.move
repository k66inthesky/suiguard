// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Main entry point for SuiAudit NFT Subscription System
// Published by @SuiAudit Lab.

module walrus::main;

use walrus::subscription::{Self, Service};
use sui::{clock::Clock, coin::Coin};

/// Main entry point: Pay 0.1 USDC to get SuiAudit Key NFT
/// This is the primary function users will call
public entry fun buy_suiaudit_key<T>(
    usdc_payment: Coin<T>,
    service: &Service,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    subscription::subscribe_and_get_nft<T>(usdc_payment, service, clock, ctx);
}

/// Initialize the SuiAudit service (admin function)
entry fun setup_suiaudit_service(ctx: &mut TxContext) {
    subscription::create_service_entry(0, 0, b"SuiAudit Premium Service".to_string(), ctx);
}