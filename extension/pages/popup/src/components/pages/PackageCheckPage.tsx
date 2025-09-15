import { API_URL } from "@src/constants";
import { Page } from "@src/type";
import { useState } from "react";
import ComparisonCard from "../ComparisonCard";
import Layout from "../Layout";

export default function PackageCheckPage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
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
  const [input, setInput] = useState<{
    value: string;
    submitBtnText: string;
    submitStatus: boolean;
    isLatest: boolean;
    checked: boolean;
  }>({
    value: "",
    submitBtnText: "Search",
    submitStatus: false,
    isLatest: false,
    checked: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prev) => ({
      ...prev,
      value: e.target.value,
    }));
  };

  const handleButtonClick = async () => {
    const packageIdInput =
      (document.getElementById("packageIdInput") as HTMLInputElement)?.value ??
      "";
    const ids = packageIdInput.split(",").map((id) => id.trim());

    setInput((prev) => ({
      ...prev,
      value: packageIdInput,
      submitStatus: true,
      submitBtnText: "Checking...",
    }));

    try {
      const res = await fetch(`${API_URL}/api/analyze-versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_ids: [...ids],
        }),
      });
      const data = await res.json();
      const { results, timestamp } = data;
      const {
        CUR_PKG_ID: cur_pkg_id,
        CUR_PKG_VERSION: cur_pkg_version,
        CUR_PKG_TIME: cur_pkg_time,
        LAST_PKG_ID: last_pkg_id,
        LAST_PKG_VERSION: last_pkg_version,
        LAST_PKG_TIME: last_pkg_time,
      } = results[0];

      if (results && results.length > 0) {
        if (typeof results[0] === "string") {
          setResult(null);
          setInput((prev) => ({ ...prev, isLatest: true }));
        } else {
          setResult((prev) => ({
            ...prev,
            package_ids: [...ids],
            cur_pkg_id,
            cur_pkg_version,
            cur_pkg_time,
            last_pkg_id,
            last_pkg_version,
            last_pkg_time,
            timestamp,
          }));
          setInput((prev) => ({
            ...prev,
            isLatest: cur_pkg_version === last_pkg_version,
            checked: true,
          }));
        }
      } else {
        setResult(null);
      }
    } catch (e) {
      console.error("error:", e);
      setResult(null);
      setInput((prev) => ({ ...prev, isLatest: false }));
    } finally {
      setInput((prev) => ({
        ...prev,
        value: "",
        submitStatus: false,
        submitBtnText: "Search",
        checked: false,
      }));
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
            maxLength={100}
            value={input.value}
            onChange={handleInputChange}
          />
          <button
            className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 ${!input.value.trim() || input.submitStatus ? "" : "cursor-pointer"}`}
            disabled={!input.value.trim() || input.submitStatus}
            onClick={handleButtonClick}
          >
            {input.submitBtnText}
          </button>
        </div>
        {!input.isLatest && input.checked && (
          <>
            <ComparisonCard
              version={result?.cur_pkg_version}
              pkgId={result?.cur_pkg_id}
              pkgTime={result?.cur_pkg_time}
            />
            <ComparisonCard
              version={result?.last_pkg_version}
              pkgId={result?.last_pkg_id}
              pkgTime={result?.last_pkg_time}
            />
          </>
        )}
        {input.isLatest && (
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
            <p className="text-green-800 font-semibold">
              🎉 你的合約是最新版本，沒有被偷升級！
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
