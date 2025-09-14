export type PageItem = {
  home: "";
  blocklist: "黑名單檢測";
  safeWebsite: "網站安全性查詢";
  packageCheck: "合約版本檢查";
  verified: "Sui Guard 認證";
};

export type Page = {
  [K in keyof PageItem]: K;
}[keyof PageItem];

// export const API_URL = "https://suiguard-385906975905.asia-east1.run.app";
export const API_URL = "http://localhost:8000";

const GITHUB_URL =
  "https://raw.githubusercontent.com/k66inthesky/suiguard/main/";

export type BlocklistData = {
  coin: any[];
  object: any[];
  domain: any[];
  package: any[];
  totalRecords: number;
};

export const blocklistUrls = {
  coin: "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/coin-list.json",
  object:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/object-list.json",
  domain:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/domain-list.json",
  package:
    "https://raw.githubusercontent.com/MystenLabs/wallet_blocklist/main/blocklists/package-list.json",
};
