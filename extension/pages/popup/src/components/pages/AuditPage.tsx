import { CheckBadgeIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { API_URL } from "@src/constants";
import { Page } from "@src/type";
import { convertTimestamp, isValidSuiPackageId } from "@src/utils";
import { useState } from "react";
import PageLayout from "../PageLayout";

export default function AuditPage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
  const [result, setResult] = useState<{
    package_ids: string[];
    is_legal: boolean;
    recommendation: string;
    timestamp: string;
    risk_level?: string;
    security_score?: number;
  } | null>(null);
  const [resultError, setResultError] = useState<boolean>(false);
  const [input, setInput] = useState<{
    value: string;
    submitBtnText: string;
    submitStatus: boolean;
    inputError?: string;
  }>({
    value: "",
    submitBtnText: "Submit",
    submitStatus: false,
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

    setInput((prev) => ({
      ...prev,
      value: packageIdInput,
      submitStatus: true,
      submitBtnText: "Processing..",
    }));

    // TODO: support multiple package ids input
    const ids = packageIdInput.split(",").map((id) => id.trim());
    if (!ids.every(isValidSuiPackageId)) {
      setInput((prev) => ({
        ...prev,
        submitStatus: false,
        submitBtnText: "Submit",
        inputError: "Package ID not valid",
      }));
      return;
    }

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

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await res.json();
      const { risk_level, recommendation, timestamp } = data;
      const notLegal = risk_level === "HIGH" || risk_level === "MEDIUM";
      const { formatted } = convertTimestamp(timestamp);

      setResult((prev) => ({
        ...prev,
        package_ids: [...ids],
        is_legal: !notLegal,
        recommendation,
        timestamp: formatted,
        risk_level,
        security_score: data.confidence ? Math.round(data.confidence * 100) : undefined,
      }));
      setResultError(false);
    } catch (e) {
      console.error("failed:", e);
      setResult(null);
      setResultError(true);
    } finally {
      setInput((prev) => ({
        ...prev,
        value: "",
        submitStatus: false,
        submitBtnText: "Submit",
        inputError: undefined,
      }));
    }
  };

  const handleViewCertificate = async () => {
    // 開啟新分頁顯示證書頁面
    const packageId = result?.package_ids[0] || "";
    const url = `/certificate/index.html?packageId=${encodeURIComponent(packageId)}`;
    
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL(url) });
    } catch (e) {
      console.error("Failed to open certificate page:", e);
      // Fallback: 如果在開發環境，使用 window.open
      window.open(url, '_blank');
    }
  };

  return (
    <PageLayout title="Sui-Move Code Audit" handlePageChange={handlePageChange}>
      <div className="mb-2 flex gap-2">
        <div className="mx-2 flex flex-1 flex-col">
          <input
            id="packageIdInput"
            type="text"
            placeholder="0x{package_id}"
            className="rounded-lg border border-gray-200 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            maxLength={200}
            value={input.value}
            onChange={handleInputChange}
          />
          {input.inputError && (
            <div className="mt-1 text-xs text-red-500">{input.inputError}</div>
          )}
        </div>
        <button
          className={`rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-50${!input.value.trim() || input.submitStatus ? "" : "cursor-pointer"}`}
          disabled={!input.value.trim() || input.submitStatus}
          onClick={handleButtonClick}
        >
          {input.submitBtnText}
        </button>
      </div>
      {result && (
        <div className="text-overflow-x-scroll rounded-xl border border-gray-200 bg-white p-4">
          <div
            className={`flex items-center justify-center gap-3 rounded-lg ${result.is_legal ? "bg-blue-50" : "bg-red-50"} p-3`}
          >
            {result.is_legal ? (
              <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-600" />
            )}
            <h3 className="font-semibold text-gray-900">
              {result.is_legal ? "Pass SuiAudit" : "Fail to pass SuiAudit"}
            </h3>
          </div>
          <p className="mt-3 mb-3 pl-3 text-gray-900">
            Package ID:{" "}
            <span
              className="inline-block max-w-full overflow-x-auto align-middle whitespace-nowrap"
              style={{ verticalAlign: "middle" }}
            >
              {result.package_ids.join(", ")}
            </span>
          </p>
          <p className="mt-3 mb-3 pl-3 text-gray-900">
            {result.recommendation}
          </p>
          <p className="mb-3 pl-3 text-gray-900">
            Audit Time: {result.timestamp}
          </p>
          {/* 查看NFT證書按鈕 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleViewCertificate}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🎖️ 查看 NFT 證書
            </button>
          </div>
        </div>
      )}
      {resultError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
          An error occurred, please try again later
        </div>
      )}
    </PageLayout>
  );
}
