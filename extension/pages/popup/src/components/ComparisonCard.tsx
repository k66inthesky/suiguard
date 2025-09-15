import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

export default function ComparisonCard({
  version,
  pkgId,
  pkgTime,
}: {
  version?: number;
  pkgId?: string;
  pkgTime?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-2">
      <h3 className="font-semibold text-gray-900 mb-4">Package Analysis</h3>

      <div className="space-y-4">
        <div key={pkgId} className="space-y-2">
          <div className={`p-3 rounded-lg border}`}>
            <div className="flex-col items-center gap-2">
              <div className="font-medium text-gray-900">合約：{pkgId}</div>
              <div className="text-sm text-gray-600">
                版本號：{version ?? "N/A"}
              </div>
              <div className="text-sm  text-gray-600">發佈時間：{pkgTime}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          window.open(`https://suivision.xyz/package/${pkgId ?? ""}`, "_blank")
        }
        className="w-full mt-4 flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">View Package Details</span>
      </button>
    </div>
  );
}
