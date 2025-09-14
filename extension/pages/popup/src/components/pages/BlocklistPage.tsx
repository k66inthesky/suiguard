import Layout from "../Layout";

export default function BlocklistPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  return (
    <Layout title="黑名單檢測" handlePageChange={handlePageChange}>
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        {/* <h3 className="font-semibold text-gray-900 mb-3">Submit New Scan</h3> */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地址類型
            </label>
            <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select scan type...</option>
              <option value="basic">Coin Address</option>
              <option value="deep">Object ID</option>
              <option value="malware">Domain</option>
              <option value="phishing">Package ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              輸入地址
            </label>
            <textarea
              placeholder="0x0"
              maxLength={50}
              rows={1}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Github 黑名單成功載入幾筆
            </p>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer">
            搜尋
          </button>
        </div>
      </div>
    </Layout>
  );
}
