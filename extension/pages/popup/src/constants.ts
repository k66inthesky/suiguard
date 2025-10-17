export const EXTENSION_NAME = "SuiAudit";
export const EXTENSION_DESCRIPTION =
  "Comprehensive smart contract security analysis powered by advanced AI. Detect vulnerabilities and ensure code quality.";

export const FEATURES = {
  home: "",
  blocklist: "Blocklist Detection",
  safeWebsite: "Website Security Checker",
  packageCheck: "Sui-Move Version Validator",
  audit: "AI-Powered Sui-Move Code Audit",
};

// Blocklist
export const BLOCKLIST_URLS = {
  coin: "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/coin-list.json",
  object:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/object-list.json",
  domain:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/domain-list.json",
  package:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/package-list.json",
};

export const BLOCKLIST_REPORT_URL =
  "https://docs.google.com/forms/d/1HSsrqDwzCAP-axAI0pUbpRm-x4ktZVaX2xjwiNMAaI4/edit?hl=zh-tw";

// apis
// export const API_URL = "https://suiguard-385906975905.asia-east1.run.app";
export const API_URL = "http://localhost:8080";

// Certificate Contract on Sui Testnet
export const CERTIFICATE_CONTRACT = {
  PACKAGE_ID: "0xc5bc1fa69949801087a87b623d08a00109d766323a349737e1344adac8373e4b",
  MODULE: "certificate",
  FUNCTION: "issue_certificate",
  NETWORK: "testnet",
};
