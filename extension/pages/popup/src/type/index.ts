type PageItem = {
  home: "";
  blocklist: "黑名單檢測";
  safeWebsite: "網站安全性查詢";
  packageCheck: "合約版本檢查";
  verified: "Sui Guard 認證";
};

type Page = {
  [K in keyof PageItem]: K;
}[keyof PageItem];

type apiUrl = "https://suiguard-385906975905.asia-east1.run.app/";
type githubUrl = "https://raw.githubusercontent.com/k66inthesky/suiguard/main/";
