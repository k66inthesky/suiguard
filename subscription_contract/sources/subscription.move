// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// Based on the subscription pattern.
// TODO: document and add tests

// Published by @SuiAudit Lab.

module walrus::subscription;

use std::string::String;
use sui::{
    clock::Clock, 
    coin::Coin, 
    dynamic_field as df,
    display,
    package,
    url::{Self, Url}
};
use walrus::utils::is_prefix;

const EInvalidCap: u64 = 0;
const EInvalidFee: u64 = 1;
const ENoAccess: u64 = 2;
const MARKER: u64 = 3;

// OTW for Display
public struct SUBSCRIPTION has drop {}

// 使用泛型來支援任何代幣類型（如真實的 USDC）

const USDC_FEE: u64 = 100_000; // 0.1 USDC (6 位小數)
const TTL_24_HOURS: u64 = 24 * 60 * 60 * 1000; // 24 小時 (毫秒)

public struct Service has key {
    id: UID,
    fee: u64,
    ttl: u64,
    owner: address,
    name: String,
}

public struct Subscription has key, store {
    id: UID,
    service_id: ID,
    created_at: u64,
    name: String,
    description: String,
    image_url: Url,
}

public struct Cap has key {
    id: UID,
    service_id: ID,
}

/// Init function to set up NFT Display
fun init(otw: SUBSCRIPTION, ctx: &mut TxContext) {
    let keys = vector[
        b"name".to_string(),
        b"description".to_string(),
        b"image_url".to_string(),
        b"creator".to_string(),
    ];

    let values = vector[
        b"{name}".to_string(),
        b"{description}".to_string(),
        b"{image_url}".to_string(),
        b"SuiAudit Lab".to_string(),
    ];

    let publisher = package::claim(otw, ctx);
    let mut display = display::new_with_fields<Subscription>(
        &publisher, keys, values, ctx
    );
    display::update_version(&mut display);

    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(display, ctx.sender());
}

//////////////////////////////////////////
/////// Simple a service

/// Create a service with fixed 0.1 USDC fee and 24 hours TTL.
/// The associated key-ids are [pkg id]::[service id][nonce] for any nonce (thus
/// many key-ids can be created for the same service).
#[allow(unused_variable)]
public fun create_service(_fee: u64, _ttl: u64, name: String, ctx: &mut TxContext): Cap {
    let service = Service {
        id: object::new(ctx),
        fee: USDC_FEE,        // 固定 0.1 USDC
        ttl: TTL_24_HOURS,    // 固定 24 小時
        owner: ctx.sender(),
        name: name,
    };
    let cap = Cap {
        id: object::new(ctx),
        service_id: object::id(&service),
    };
    transfer::share_object(service);
    cap
}

// convenience function to create a service and share it (simpler ptb for cli)
public entry fun create_service_entry(fee: u64, ttl: u64, name: String, ctx: &mut TxContext) {
    transfer::transfer(create_service(fee, ttl, name, ctx), ctx.sender());
}

public fun subscribe<T>(
    fee: Coin<T>,
    service: &Service,
    c: &Clock,
    ctx: &mut TxContext,
): Subscription {
    assert!(fee.value() == service.fee, EInvalidFee);
    transfer::public_transfer(fee, service.owner);
    Subscription {
        id: object::new(ctx),
        service_id: object::id(service),
        created_at: c.timestamp_ms(),
        name: b"SuiAudit Access Key".to_string(),
        description: b"24-hour premium access to SuiAudit AI auditing services".to_string(),
        image_url: url::new_unsafe_from_bytes(
            b"https://raw.githubusercontent.com/k66inthesky/suiguard/main/seal_contract/sources/SuiAudit-keyNFT.png"
        ),
    }
}

// 便捷入口函數：直接訂閱並獲得 NFT
public entry fun subscribe_and_get_nft<T>(
    fee: Coin<T>,
    service: &Service,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let subscription = subscribe<T>(fee, service, c, ctx);
    transfer::transfer(subscription, ctx.sender());
}

#[allow(lint(custom_state_change))]
public fun transfer_subscription(sub: Subscription, to: address) {
    transfer::transfer(sub, to);
}

#[test_only]
public fun destroy_for_testing(ser: Service, sub: Subscription) {
    let Service { id, .. } = ser;
    object::delete(id);
    let Subscription { id, .. } = sub;
    object::delete(id);
}

//////////////////////////////////////////////////////////
/// Access control
/// key format: [pkg id]::[service id][random nonce]

/// All allowlisted addresses can access all IDs with the prefix of the allowlist
fun approve_internal(id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock): bool {
    if (object::id(service) != sub.service_id) {
        return false
    };
    if (c.timestamp_ms() > sub.created_at + service.ttl) {
        return false
    };

    // Check if the id has the right prefix
    is_prefix(service.id.to_bytes(), id)
}

entry fun seal_approve(id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock) {
    assert!(approve_internal(id, sub, service, c), ENoAccess);
}

/// Encapsulate a blob into a Sui object and attach it to the Subscription
public fun publish(service: &mut Service, cap: &Cap, blob_id: String) {
    assert!(cap.service_id == object::id(service), EInvalidCap);
    df::add(&mut service.id, blob_id, MARKER);
}