import { cn } from "@extension/ui/lib/utils";
import Layout from "../Layout";
import { CubeIcon } from "@heroicons/react/24/outline";

export default function PackageCheckPage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  return (
    <Layout title="檢查合約是否偷升級？" handlePageChange={handlePageChange}>
      <div className="lg:col-span-2 ">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="package_id"
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
            Search
          </button>
        </div>
        {/* TODO: results then display */}
        <div
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            "shadow-elegant"
          )}
        >
          <div className="flex flex-col space-y-1.5 p-6"></div>
        </div>
      </div>
    </Layout>
  );
}
