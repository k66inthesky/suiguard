import { LoadingSpinner } from "@extension/ui";
import { blocklistUrls } from "@src/constants";
import { BlocklistData, Page } from "@src/type";
import { useEffect, useState } from "react";
import Layout from "../Layout";

const parseBlocklist = (data: any, type: string) => {
  if (data && data.blocklist && Array.isArray(data.blocklist)) {
    // console.log(
    //   `✅ ${type} blocklist 載入成功: ${data.blocklist.length} 筆記錄`
    // );
    return data.blocklist;
  } else if (Array.isArray(data)) {
    // console.log(
    //   `✅ ${type} blocklist 載入成功 (直接陣列): ${data.length} 筆記錄`
    // );
    return data;
  } else {
    // console.warn(`⚠️ ${type} blocklist 格式錯誤或為空，資料:`, data);
    return [];
  }
};

export default function BlocklistPage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
  const [loading, setLoading] = useState(true);
  const [blocklists, setBlocklists] = useState<BlocklistData | null>(null);
  const [searchResult, setSearchResult] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const isAddressBlacklisted = (address: string, type: string) => {
    if (!blocklists) return false;

    const blocklist = blocklists[type as keyof BlocklistData] || [];

    if (!Array.isArray(blocklist) || blocklist.length === 0) {
      // console.warn(`⚠️ ${type} blocklist is empty or not loaded`);
      return false;
    }

    // console.log(
    //   `🔍 檢查 ${address} 是否在 ${type} 黑名單中 (${blocklist.length} 筆記錄)`
    // );

    const normalizedAddress = address.toLowerCase().trim();

    return blocklist.some((item) => {
      // 處理字串格式
      if (typeof item === "string") {
        const normalizedItem = item.toLowerCase().trim();

        let match = false;

        if (type === "domain") {
          // 域名精確匹配
          match = normalizedItem === normalizedAddress;
        } else if (type === "package") {
          // Package ID 匹配 - 支援精確匹配和從完整地址提取 package ID
          const packageIdFromAddress = normalizedAddress.split("::")[0];
          match =
            normalizedItem === normalizedAddress ||
            normalizedItem === packageIdFromAddress;
        } else if (type === "coin" || type === "object") {
          // Coin 和 Object 使用部分匹配 (檢查 package ID 部分)
          // 格式: 0x...::module::TYPE
          // 我們提取 0x... 部分進行匹配
          const packageIdFromItem = normalizedItem.split("::")[0];
          const packageIdFromAddress = normalizedAddress.split("::")[0];

          // 支援完整匹配或 package ID 匹配
          match =
            normalizedItem === normalizedAddress ||
            packageIdFromItem === normalizedAddress ||
            packageIdFromAddress === normalizedItem ||
            normalizedItem.includes(normalizedAddress) ||
            normalizedAddress.includes(packageIdFromItem);
        }

        // if (match) {
        //   console.log(`🎯 找到匹配項 (${type}): ${item} matches ${address}`);
        // }
        return match;
      }

      // 處理物件格式 (可能包含額外資訊)
      if (typeof item === "object" && item !== null) {
        // 支援多種可能的屬性名稱
        const addressFields = [
          "address",
          "id",
          "domain",
          "package_id",
          "coin_type",
          "value",
        ];
        for (const field of addressFields) {
          if (item[field]) {
            const normalizedFieldValue = item[field].toLowerCase().trim();
            let match = false;

            if (type === "domain") {
              match = normalizedFieldValue === normalizedAddress;
            } else if (type === "package") {
              const packageIdFromAddress = normalizedAddress.split("::")[0];
              match =
                normalizedFieldValue === normalizedAddress ||
                normalizedFieldValue === packageIdFromAddress;
            } else if (type === "coin" || type === "object") {
              const packageIdFromField = normalizedFieldValue.split("::")[0];
              const packageIdFromAddress = normalizedAddress.split("::")[0];

              match =
                normalizedFieldValue === normalizedAddress ||
                packageIdFromField === normalizedAddress ||
                packageIdFromAddress === normalizedFieldValue ||
                normalizedFieldValue.includes(normalizedAddress) ||
                normalizedAddress.includes(packageIdFromField);
            }

            if (match) {
              // console.log(
              //   `🎯 找到匹配項 (物件.${field}): ${item[field]} matches ${address}`
              // );
              return true;
            }
          }
        }
      }

      return false;
    });
  };

  const handleSearchClick = async () => {
    const addressInput = (
      document.getElementById("addressInput") as HTMLTextAreaElement
    ).value.trim();
    const addressType = (
      document.getElementById("addressType") as HTMLSelectElement
    ).value;

    if (!addressInput) {
      setSearchResult("❌ 請輸入要檢測的地址");
      return;
    }

    if (!addressType) {
      setSearchResult("❌ 請選擇地址類型");
      return;
    }

    // 檢查黑名單是否已載入
    if (!blocklists || blocklists.totalRecords === 0) {
      setSearchResult("❌ 黑名單尚未載入或載入失敗，請重新整理擴展");
      return;
    }

    setIsSearching(true);
    setSearchResult("");

    try {
      const addresses = addressInput
        .split("\n")
        .map((addr) => addr.trim())
        .filter((addr) => addr);

      const results = [];

      for (const address of addresses) {
        const typeMap: { [key: string]: string } = {
          basic: "coin",
          deep: "object",
          malware: "domain",
          phishing: "package",
        };

        const blocklistType = typeMap[addressType];
        const isBlacklisted = isAddressBlacklisted(address, blocklistType);

        results.push({
          address,
          isBlacklisted,
          type: blocklistType,
        });

        // console.log(
        //   `🔍 檢測地址: ${address} (${blocklistType}) -> ${isBlacklisted ? "❌ 黑名單" : "✅ 安全"}`
        // );
      }

      // 顯示結果
      const blacklistedCount = results.filter((r) => r.isBlacklisted).length;
      const safeCount = results.length - blacklistedCount;

      let resultText = "";

      if (blacklistedCount > 0) {
        resultText += `⚠️ 發現 ${blacklistedCount} 個黑名單地址！\n\n`;
        results
          .filter((r) => r.isBlacklisted)
          .forEach((r) => {
            resultText += `❌ ${r.address} (${r.type})\n`;
          });

        if (safeCount > 0) {
          resultText += `\n✅ ${safeCount} 個地址安全\n`;
          results
            .filter((r) => !r.isBlacklisted)
            .forEach((r) => {
              resultText += `✅ ${r.address}\n`;
            });
        }
      } else {
        resultText = `✅ 所有 ${results.length} 個地址都是安全的！\n\n`;
        results.forEach((r) => {
          resultText += `✅ ${r.address}\n`;
        });
      }

      setSearchResult(resultText);
    } catch (error) {
      // console.error("❌ 檢測過程錯誤:", error);
      setSearchResult("❌ 檢測過程中發生錯誤");
    } finally {
      setIsSearching(false);
    }
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
              placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
              maxLength={200}
              rows={2}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Github 黑名單成功載入
              {!!blocklists?.totalRecords ? blocklists.totalRecords : 0}筆
            </p>
          </div>
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer disabled:opacity-50"
            onClick={handleSearchClick}
            disabled={isSearching}
          >
            {isSearching ? "檢測中..." : "🔍 檢測黑名單"}
          </button>
        </div>

        {/* 檢測結果區域 */}
        {searchResult && (
          <div className="mt-4 p-4 rounded-xl border-2 bg-gray-50">
            <h3 className="font-medium text-gray-800 mb-2">檢測結果：</h3>
            <pre
              className="whitespace-pre-wrap text-sm text-gray-700 font-mono overflow-auto break-words"
              style={{ maxHeight: 240, wordBreak: "break-all" }}
            >
              {searchResult}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
}
