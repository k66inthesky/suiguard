#!/bin/bash

# SuiAudit NFT Subscription System Deployment Guide
# 使用指南：如何部署和使用 SuiAudit Key NFT

echo "🚀 SuiAudit NFT Subscription System"
echo "===================================="

# 顏色定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 部署步驟:${NC}"

echo -e "${BLUE}1. 發布合約:${NC}"
echo "sui client publish --gas-budget 100000000"

echo ""
echo -e "${BLUE}2. 初始化 SuiAudit 服務 (管理員):${NC}"
echo "sui client call \\"
echo "  --package [PACKAGE_ID] \\"
echo "  --module main \\"
echo "  --function setup_suiaudit_service \\"
echo "  --gas-budget 10000000"

echo ""
echo -e "${GREEN}💰 用戶購買 SuiAudit Key NFT:${NC}"
echo "sui client call \\"
echo "  --package [PACKAGE_ID] \\"
echo "  --module main \\"
echo "  --function buy_suiaudit_key \\"
echo "  --args [USDC_COIN_ID] [SERVICE_OBJECT_ID] [CLOCK_ID] \\"
echo "  --gas-budget 10000000"

echo ""
echo -e "${YELLOW}📝 說明:${NC}"
echo "• 費用: 固定 0.1 USDC (100,000 units，因為 USDC 有 6 位小數)"
echo "• 有效期: 24 小時"
echo "• NFT 圖片: SuiAudit-keyNFT.png"
echo "• 功能: 持有此 NFT 可以訪問 SuiAudit 高級審計服務"

echo ""
echo -e "${BLUE}🔍 取得必要的 Object IDs:${NC}"
echo "# 取得 USDC Coin ID:"
echo "sui client gas --json | jq '.[] | select(.coinType==\"USDC\") | .coinObjectId'"

echo ""
echo "# 取得 Clock Object ID (固定):"
echo "# 0x6"

echo ""
echo "# 取得 Service Object ID (從初始化交易的輸出中獲得)"

echo ""
echo -e "${GREEN}✅ 成功後用戶會收到一個 SuiAudit Key NFT！${NC}"