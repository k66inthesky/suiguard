import { cn } from "@extension/ui";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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

export default function SafeWebsitePage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  const [scan, setScan] = useState<{
    package_ids: string[];
    is_legal: boolean;
    recommendation: string;
    scanning: boolean;
    light?: string; //bg-green-500
    timestamp: string;
    confidence: number;
  } | null>(null);

  const handleThreatScan = async () => {
    const packageIdInput =
      (document.getElementById("packageIdInput") as HTMLInputElement)?.value ??
      "";
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.textContent = "Submitting...";
      submitBtn.setAttribute("disabled", "true");
      setScan(null);
    }

    // const ids = packageIdInput.split(",").map((id) => id.trim());

    try {
      const res = await fetch(`${API_URL}/api/analyze-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_ids: [
            // TODO:
            "0xfa65cb2d62f4d39e60346fb7d501c12538ca2bbc646eaa37ece2aec5f897814e",
          ],
        }),
      });
      const data = await res.json();
      console.log("API 回傳結果:", data);
      const { risk_level, confidence, recommendation, timestamp } = data;
      const notLegal = risk_level === "HIGH" || risk_level === "MEDIUM";

      const { formatted } = convertTimestamp(timestamp);
      console.log(confidence);

      setScan({
        ...scan,
        package_ids: [
          "0xfa65cb2d62f4d39e60346fb7d501c12538ca2bbc646eaa37ece2aec5f897814e",
        ],
        is_legal: !notLegal,
        timestamp: formatted,
        recommendation,
        scanning: false,
        confidence,
      });
    } catch (e) {
      console.error("API 請求失敗", e);
      setScan(null);
    } finally {
      if (submitBtn) {
        submitBtn.textContent = "提交合約";
        submitBtn.removeAttribute("disabled");
      }
    }
  };

  return (
    <Layout title="網站安全性查詢" handlePageChange={handlePageChange}>
      <button
        onClick={handleThreatScan}
        disabled={scan?.scanning}
        className="w-full h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform cursor-pointer"
      >
        {scan?.scanning ? (
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
            一鍵查詢
          </>
        )}
      </button>
      {scan && (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 overflow-x-scroll">
            Domain URL: https://suia.io/
          </h3>
          {/* <p className="text-sm text-gray-600 overflow-clip">
            Domain URL: {window.location.href}
          </p> */}
          <div className="text-center py-8">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div
                className={cn("w-5 h-5 bg-red-400 rounded-full animate-pulse")}
              ></div>
              <div className="flex items-center space-x-2">
                {/* <p className="text-sm font-medium">
                    {`風險評分:${scan.risk_score}11`}
                  </p> */}
                <p className="text-sm text-muted-foreground">{`風險評分:90`}</p>
              </div>
            </div>
            {/*  */}
            {/* <div className="mb-4">{scan.recommendation}</div> */}
            <div className="flex-col justify-baseline">
              {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> */}
              <p className="text-xs text-muted-foreground">
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
