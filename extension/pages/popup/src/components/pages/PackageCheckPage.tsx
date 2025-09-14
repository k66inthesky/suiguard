import { cn } from "@extension/ui/lib/utils";
import { API_URL, Page } from "@src/type";
import Layout from "../Layout";
import ComparisonCard from "../ComparisonCard";
import { useState } from "react";

export default function PackageCheckPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  const [result, setResult] = useState<{
    package_ids: string[];
    cur_pkg_id: string;
    cur_pkg_version: number;
    cur_pkg_time: string;
    last_pkg_id: string;
    last_pkg_version: number;
    last_pkg_time: string;
    timestamp: string;
  } | null>(null);

  const handleButtonClick = async () => {
    const packageIdInput =
      (document.getElementById("packageIdInput") as HTMLInputElement)?.value ??
      "";

    const ids = packageIdInput.split(",").map((id) => id.trim());

    try {
      const res = await fetch(`${API_URL}/analyze-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_ids: [...ids],
        }),
      });
      const data = await res.json();
      console.log("API 回傳結果:", data);
      const { results, timestamp } = data;

      if (results && results.length > 0) {
        setResult({
          ...result,
          package_ids: [...ids],
          cur_pkg_id: results[0].CUR_PKG_ID,
          cur_pkg_version: results[0].CUR_PKG_VERSION,
          cur_pkg_time: results[0].CUR_PKG_TIME,
          last_pkg_id: results[0].LAST_PKG_ID,
          last_pkg_version: results[0].LAST_PKG_VERSION,
          last_pkg_time: results[0].LAST_PKG_TIME,
          timestamp,
        });
      } else {
        setResult(null);
      }
    } catch (e) {
      console.error("API 請求失敗", e);
      setResult(null);
    }
  };

  return (
    <Layout title="檢查合約是否偷升級？" handlePageChange={handlePageChange}>
      <div className="lg:col-span-2 ">
        <div className="flex gap-2 mb-4">
          <input
            id="packageIdInput"
            type="text"
            placeholder="package_id"
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
            onClick={handleButtonClick}
          >
            Search
          </button>
        </div>

        {result && (
          <>
            <ComparisonCard
              version={2}
              pkgId={result?.cur_pkg_id}
              pkgTime={result?.cur_pkg_time}
            />
            <ComparisonCard
              version={1}
              pkgId={result?.last_pkg_id}
              pkgTime={result?.last_pkg_time}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
