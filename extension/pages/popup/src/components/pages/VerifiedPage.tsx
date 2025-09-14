import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { API_URL, Page } from "@src/type";
import { useState } from "react";
import Layout from "../Layout";

export const convertTimestamp = (tstr: string) => {
  const date = new Date(tstr);
  const formatted = date
    .toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-")
    .replace(/,/, "");
  const unix = Math.floor(date.getTime() / 1000);
  return { formatted, unix };
};

export default function VerifiedPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  const [result, setResult] = useState<{
    package_ids: string[];
    is_legal: Boolean;
    recommendation: string;
    timestamp: string;
  } | null>(null);

  const handleButtonClick = async () => {
    const packageIdInput =
      (document.getElementById("packageIdInput") as HTMLInputElement)?.value ??
      "";
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.textContent = "Submitting...";
      submitBtn.setAttribute("disabled", "true");
      setResult(null);
    }

    const ids = packageIdInput.split(",").map((id) => id.trim());

    try {
      const res = await fetch(`${API_URL}/api/analyze-connection`, {
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
      const { risk_level, recommendation, timestamp } = data;
      const notLegal = risk_level === "HIGH" || risk_level === "MEDIUM";

      const { formatted } = convertTimestamp(timestamp);

      setResult({
        ...result,
        package_ids: [...ids],
        is_legal: !notLegal,
        recommendation,
        timestamp: formatted,
      });
    } catch (e) {
      console.error("API 請求失敗", e);
      setResult(null);
    } finally {
      if (submitBtn) {
        submitBtn.textContent = "提交合約";
        submitBtn.removeAttribute("disabled");
      }
    }
  };

  return (
    <Layout title="Sui Guard 認證" handlePageChange={handlePageChange}>
      <div className="flex gap-2">
        <input
          id="packageIdInput"
          type="text"
          placeholder="0xyour_package_id"
          className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          id="submitBtn"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer"
          onClick={handleButtonClick}
        >
          提交合約
        </button>
      </div>
      {result && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-overflow-x-scroll">
          <div className="flex justify-center items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <CheckBadgeIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 ">
              已通過 Sui Guard 認證
            </h3>
          </div>
          <p className=" text-gray-900 mb-3 mt-3">
            合約
            <span className="text-ellipsis overflow-hidden">{`${result.package_ids.join(", ")}`}</span>
          </p>
          <p className=" text-gray-900 mb-3 mt-3">{result.recommendation}</p>
          <p className=" text-gray-900 mb-3">認證時間: {result.timestamp}</p>
        </div>
      )}
    </Layout>
  );
}
