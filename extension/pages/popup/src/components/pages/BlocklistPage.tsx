import { LoadingSpinner } from "@extension/ui";
import { BlocklistData, blocklistUrls, Page } from "@src/type";
import { useEffect, useState } from "react";
import Layout from "../Layout";

const parseBlocklist = (data: any, type: string) => {
  if (data && data.blocklist && Array.isArray(data.blocklist)) {
    console.log(
      `✅ ${type} blocklist 載入成功: ${data.blocklist.length} 筆記錄`
    );
    return data.blocklist;
  } else if (Array.isArray(data)) {
    console.log(
      `✅ ${type} blocklist 載入成功 (直接陣列): ${data.length} 筆記錄`
    );
    return data;
  } else {
    console.warn(`⚠️ ${type} blocklist 格式錯誤或為空，資料:`, data);
    return [];
  }
};

export default function BlocklistPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [blocklists, setBlocklists] = useState<BlocklistData | null>(null);

  const handleSearchClick = () => {
    const addressInput = (
      document.getElementById("addressInput") as HTMLTextAreaElement
    ).value.trim();
    const addresses = addressInput
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr);
    const results = [];

    // TODO:
  };

  useEffect(() => {
    async function fetchBlocklists() {
      setLoading(true);

      try {
        const [coinRaw, objectRaw, domainRaw, pkgRaw] = await Promise.all([
          fetch(blocklistUrls.coin).then((r) => r.json()),
          fetch(blocklistUrls.object).then((r) => r.json()),
          fetch(blocklistUrls.domain).then((r) => r.json()),
          fetch(blocklistUrls.package).then((r) => r.json()),
        ]);
        const coin = parseBlocklist(coinRaw, "coin");
        const object = parseBlocklist(objectRaw, "object");
        const domain = parseBlocklist(domainRaw, "domain");
        const pkg = parseBlocklist(pkgRaw, "package");

        setBlocklists({
          coin,
          object,
          domain,
          package: pkg,
          totalRecords:
            coin.length + object.length + domain.length + pkg.length,
        });
      } catch (e) {
        setBlocklists({
          coin: [],
          object: [],
          domain: [],
          package: [],
          totalRecords: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBlocklists();
  }, []);

  if (loading) {
    return <LoadingSpinner size={60} />;
  }

  return (
    <Layout title="黑名單檢測" handlePageChange={handlePageChange}>
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="space-y-3">
          <div>
            <label
              htmlFor="addressType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              地址類型
            </label>
            <select
              id="addressType"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選擇類型...</option>
              <option value="basic">Coin Address</option>
              <option value="deep">Object ID</option>
              <option value="malware">Domain</option>
              <option value="phishing">Package ID</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="addressInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              輸入地址
            </label>
            <textarea
              id="addressInput"
              placeholder="0x0"
              maxLength={50}
              rows={1}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Github 黑名單成功載入
              {!!blocklists?.totalRecords ? blocklists.totalRecords : 0}筆
            </p>
          </div>
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
            onClick={handleSearchClick}
          >
            搜尋
          </button>
        </div>
      </div>
    </Layout>
  );
}
