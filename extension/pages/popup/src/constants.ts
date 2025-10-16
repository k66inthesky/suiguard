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
  "https://docs.google.com/forms/d/e/1FAIpQLSdrJcdsDCP4lq5t6nAltO-Ozab1kCgEhxmFfgml9mRqiISseg/viewform?usp=send_form";

// apis
export const API_URL = "https://suiguard-385906975905.asia-east1.run.app";
// export const API_URL = "http://localhost:8080";
