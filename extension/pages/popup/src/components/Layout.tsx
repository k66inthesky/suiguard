import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Footer from "./Footer";

export default function Layout({
  title,
  children,
  handlePageChange,
}: {
  title: string;
  children: React.ReactNode;
  handlePageChange: (page: Page) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between ">
        <button
          onClick={() => handlePageChange("home")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">Protected</span>
        </div>
      </div>
      <hr className="border-t border-gray-100 mb-6" />

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      {children}
      <Footer />
    </div>
  );
}
