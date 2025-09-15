import { cn } from "@extension/ui";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { API_URL } from "@src/constants";
import { Page } from "@src/type";
import { useEffect, useState } from "react";
import Layout from "../Layout";
import { convertTimestamp } from "@src/utils";

export default function SafeWebsitePage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
  const [result, setResult] = useState<{
    package_ids: string[];
    is_legal: boolean;
    recommendation: string;
    light?: string; //bg-green-500
    timestamp: string;
    confidence: number;
  } | null>(null);
  const [scan, setScan] = useState<{
    scanning: boolean;
    buttonText: string;
    tabUrl: string;
  }>({ scanning: false, buttonText: "一鍵搜尋", tabUrl: "" });

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setScan((prev) => ({ ...prev, tabUrl: tabs[0]?.url ?? "" }));
    });
  }, []);

  const handleThreatScan = async () => {
    setScan((prev) => ({
      ...prev,
      buttonText: "Submitting...",
      scanning: true,
    }));

    try {
      const res = await fetch(`${API_URL}/api/analyze-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_ids: [
            // TODO: poc purpose only
            "0xfa65cb2d62f4d39e60346fb7d501c12538ca2bbc646eaa37ece2aec5f897814e",
          ],
        }),
      });
      const data = await res.json();

      const { risk_level, confidence, recommendation, timestamp } = data;
      const notLegal = risk_level === "HIGH" || risk_level === "MEDIUM";
      const { formatted } = convertTimestamp(timestamp);

      setResult({
        ...result,
        package_ids: [
          "0xfa65cb2d62f4d39e60346fb7d501c12538ca2bbc646eaa37ece2aec5f897814e",
        ],
        is_legal: !notLegal,
        timestamp: formatted,
        recommendation,
        confidence,
      });
      setScan((prev) => ({ ...prev, buttonText: "一鍵搜尋", scanning: false }));
    } catch (e) {
      console.error("Threat scan failed:", e);
      setResult(null);
      setScan((prev) => ({ ...prev, buttonText: "一鍵搜尋", scanning: false }));
    } finally {
      setScan((prev) => ({ ...prev, buttonText: "一鍵搜尋", scanning: false }));
    }
  };

  return (
    <Layout title="網站安全性查詢" handlePageChange={handlePageChange}>
      <button
        onClick={handleThreatScan}
        disabled={scan.scanning}
        className="w-full h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform cursor-pointer"
      >
        {scan.scanning ? (
          <>
            <div
              id=""
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
            ></div>
            Searching...
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" />
            {scan.buttonText}
          </>
        )}
      </button>
      {result && (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 overflow-x-scroll">
            Domain URL: {scan.tabUrl}
          </h3>
          <p className="text-sm text-gray-600 overflow-clip">
            Domain URL: {scan.tabUrl}
          </p>
          <div className="text-center py-8">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              {/* TODO: convert from score to light */}
              {result.is_legal ? (
                <div
                  className={cn(
                    "w-5 h-5 bg-green-500 rounded-full animate-pulse"
                  )}
                ></div>
              ) : (
                <div
                  className={cn(
                    "w-5 h-5 bg-red-400 rounded-full animate-pulse"
                  )}
                ></div>
              )}
              <div className="flex items-center space-x-2">
                {/* TODO: api */}
                {/* <p className="text-sm font-medium">
                  {`風險評分:${result.risk_score}`}
                </p> */}
                <p className="text-sm font-medium">{`風險評分:90`}</p>
              </div>
            </div>
            {/*  */}
            {/* <div className="mb-4">{result.recommendation}</div> */}
            <div className="flex-col justify-baseline">
              {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> */}
              <p className="text-xs text-muted-foreground mt-1">
                綠燈：可信任網站，可安全簽署
              </p>
              <p className="text-xs text-muted-foreground">
                黃燈：中度風險，簽署前請再確認
              </p>
              <p className="text-xs text-muted-foreground">
                紅燈：高風險網站，不建議簽署
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
