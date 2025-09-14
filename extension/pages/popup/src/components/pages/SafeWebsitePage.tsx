import { useState } from "react";
import Layout from "../Layout";
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@extension/ui";

export default function SafeWebsitePage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  const [scan, setScan] = useState<{
    isThreat: boolean;
    results: any;
    scanning: boolean;
    light?: string; //bg-green-500
  } | null>(null);

  const handleThreatScan = async () => {
    setScan({ isThreat: false, results: {}, scanning: true });
    // try {
    //   const response = await fetch(
    //     "https://api.suiguard.com/api/v1/scan/website",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         url: "https://suiguard.com",
    //       }),
    //     }
    //   );
    //   const data = await response.json();
    //   console.log("Scan results:", data);
    //   setScan({ isThreat: false, results: data, scanning: false });
    // } catch (error) {
    //   console.error("Error during scan:", error);
    //   setScan({ isThreat: false, results: null, scanning: false });
    // }
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
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Searching...
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" />
            一鍵查詢
          </>
        )}
      </button>
      {scan?.results && (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 overflow-x-scroll">
            Domain URL: {window.location.href}
          </h3>
          {/* <p className="text-sm text-gray-600 overflow-clip">
            Domain URL: {window.location.href}
          </p> */}
          <div className="text-center py-8">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div
                className={cn(
                  "w-5 h-5 bg-green-400 rounded-full animate-pulse"
                )}
              ></div>
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm font-medium">
                    {`風險評分:${scan.results.risk_score}11`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {`機器學習信心指數:${scan.results.confidence_score}11`}
                  </p>
                </div>
              </div>
            </div>
            {/*  */}
            <div className="mb-4">{scan.results.recommendation}</div>
            <div className="flex-col justify-baseline">
              {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> */}
              <p className="text-xs text-muted-foreground">
                綠燈：可信任網站，可安全簽署
              </p>
              <p className="text-xs text-muted-foreground">
                黃燈：中度風險，簽署前請再確認
              </p>
              <p className="text-xs text-muted-foreground">
                綠燈：高風險網站，不建議簽署
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
