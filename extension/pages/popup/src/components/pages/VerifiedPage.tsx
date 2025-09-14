import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import Layout from "../Layout";

export default function VerifiedPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  return (
    <Layout title="Sui Guard 認證" handlePageChange={handlePageChange}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="0xyour_package_id"
          className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
          提交合約
        </button>
      </div>
      {/* TODO: display when results */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <CheckBadgeIcon className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {`合約 xxx 已通過 Sui Guard 認證`}
            </h3>
          </div>
        </div>
        <p className=" text-gray-900 mb-3">認證時間: 2024/09/01 12:00:00</p>
      </div>
    </Layout>
  );
}
