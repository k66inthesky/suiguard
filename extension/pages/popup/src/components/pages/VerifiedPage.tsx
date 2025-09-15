import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { Page } from "@src/type";
import { useState } from "react";
import Layout from "../Layout";
import { API_URL } from "@src/constants";
import { convertTimestamp } from "@src/utils";

export default function VerifiedPage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
  const [result, setResult] = useState<{
    package_ids: string[];
    is_legal: boolean;
    recommendation: string;
    timestamp: string;
  } | null>(null);
  const [input, setInput] = useState<{
    value: string;
    submitBtnText: string;
    submitStatus: boolean;
  }>({
    value: "",
    submitBtnText: "提交合約",
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
    const ids = packageIdInput.split(",").map((id) => id.trim());

    setInput((prev) => ({
      ...prev,
      value: packageIdInput,
      submitStatus: true,
      submitBtnText: "Submitting...",
    }));

    // TODO: input validation

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
      const { risk_level, recommendation, timestamp } = data;
      const notLegal = risk_level === "HIGH" || risk_level === "MEDIUM";
      const { formatted } = convertTimestamp(timestamp);

      setResult((prev) => ({
        ...prev,
        package_ids: [...ids],
        is_legal: !notLegal,
        recommendation,
        timestamp: formatted,
      }));
    } catch (e) {
      console.error("failed:", e);
      setResult(null);
    } finally {
      setInput((prev) => ({
        ...prev,
        value: "",
        submitStatus: false,
        submitBtnText: "提交合約",
      }));
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
          maxLength={100}
          value={input.value}
          onChange={handleInputChange}
        />
        <button
          className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50${!input.value.trim() || input.submitStatus ? "" : " cursor-pointer"}`}
          disabled={!input.value.trim() || input.submitStatus}
          onClick={handleButtonClick}
        >
          {input.submitBtnText}
        </button>
      </div>
      {result && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-overflow-x-scroll">
          <div className="flex justify-center items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <CheckBadgeIcon
              className={`w-5 h-5 ${result.is_legal ? "text-blue-600" : "text-red-600"}`}
            />
            <h3 className="font-semibold text-gray-900 ">
              {result.is_legal
                ? "已通過 Sui Guard 認證"
                : "未通過 Sui Guard 認證"}
            </h3>
          </div>
          <p className="text-gray-900 mb-3 mt-3">
            合約:{" "}
            <span
              className="inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle"
              style={{ verticalAlign: "middle" }}
            >
              {result.package_ids.join(", ")}
            </span>
          </p>
          <p className=" text-gray-900 mb-3 mt-3">{result.recommendation}</p>
          <p className=" text-gray-900 mb-3">認證時間: {result.timestamp}</p>
        </div>
      )}
    </Layout>
  );
}
