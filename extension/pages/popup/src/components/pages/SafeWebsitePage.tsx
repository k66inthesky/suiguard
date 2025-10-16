import { cn } from "@extension/ui";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { API_URL, FEATURES } from "@src/constants";
import { Page } from "@src/type";
import { useEffect, useState } from "react";
import PageLayout from "../PageLayout";
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
    light?: string;
    timestamp: string;
    confidence: number;
  } | null>(null);
  const [resultError, setResultError] = useState<boolean>(false);
  const [scan, setScan] = useState<{
    scanning: boolean;
    buttonText: string;
    tabUrl: string;
  }>({ scanning: false, buttonText: "Start Scan", tabUrl: "" });

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setScan((prev) => ({ ...prev, tabUrl: tabs[0]?.url ?? "" }));
    });
  }, []);

  const handleThreatScan = async () => {
    setScan((prev) => ({
      ...prev,
      buttonText: "Scanning...",
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

      if (!res.ok) {
        throw new Error("Network response was not ok");
      }

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
      setScan((prev) => ({
        ...prev,
        buttonText: "Start Scan",
        scanning: false,
      }));
      setResultError(false);
    } catch (e) {
      console.error("Threat scan failed:", e);
      setResult(null);
      setResultError(true);
      setScan((prev) => ({
        ...prev,
        buttonText: "Start Scan",
        scanning: false,
      }));
    } finally {
      setScan((prev) => ({
        ...prev,
        buttonText: "Start Scan",
        scanning: false,
      }));
    }
  };

  return (
    <PageLayout
      title={FEATURES.safeWebsite}
      handlePageChange={handlePageChange}
    >
      <button
        onClick={handleThreatScan}
        disabled={scan.scanning}
        className="mt-4 mb-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white transition-transform group-hover:scale-105"
      >
        {scan.scanning ? (
          <>
            <div
              id=""
              className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
            {scan.buttonText}
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="h-5 w-5" />
            {scan.buttonText}
          </>
        )}
      </button>
      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="overflow-clip text-sm text-gray-600">
            Domain URL: {scan.tabUrl}
          </p>
          <div className="pt-4 pb-8 text-center">
            <div className="flex items-center justify-between rounded-lg border p-3">
              {/* TODO: convert from score to light */}
              {result.is_legal ? (
                <div
                  className={cn(
                    "h-5 w-5 animate-pulse rounded-full bg-green-500",
                  )}
                ></div>
              ) : (
                <div
                  className={cn(
                    "h-5 w-5 animate-pulse rounded-full bg-red-400",
                  )}
                ></div>
              )}
              <div className="flex items-center space-x-2">
                {/* TODO: api */}
                {/* <p className="text-sm font-medium">
                  {`風險評分:${result.risk_score}`}
                </p> */}
                <p className="text-sm font-medium">{`Risk Score:90`}</p>
              </div>
            </div>
            {/*  */}
            {/* <div className="mb-4">{result.recommendation}</div> */}
            <div className="flex-col items-baseline">
              {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> */}
              <p className="mt-1 text-xs text-gray-600">
                Green light：Trusted website, safe to sign
              </p>
              <p className="text-xs text-gray-600">
                Yellow light：Moderate risk, please confirm before signing
              </p>
              <p className="text-xs text-gray-600">
                Red light：High risk website, not recommended for signing
              </p>
            </div>
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
