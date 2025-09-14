import {
  CheckCircleIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/24/outline";
import { Page } from "@src/type";
import Footer from "../Footer";
import FunctionCard from "../FunctionCard";
import Logo from "../Logo";

export default function HomePage({
  handlePageChange,
}: {
  handlePageChange: (page: Page) => void;
}) {
  return (
    <div className="space-y-6">
      <Logo />

      <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />

          <div>
            <p className="font-semibold text-gray-900">Protected</p>
            <p className="text-sm text-gray-600">All systems operational</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FunctionCard
          title="黑名單檢測"
          icon={<MagnifyingGlassCircleIcon className="w-6 h-6" />}
          onClick={() => handlePageChange("blocklist")}
        />
        <FunctionCard
          title="網站安全性查詢"
          icon={<GlobeAltIcon className="w-6 h-6" />}
          onClick={() => handlePageChange("safeWebsite")}
        />
        <FunctionCard
          title="Sui Guard 認證"
          icon={<LockClosedIcon className="w-6 h-6" />}
          onClick={() => handlePageChange("verified")}
        />
        <FunctionCard
          title="合約版本檢查"
          icon={<DocumentCheckIcon className="w-6 h-6" />}
          onClick={() => handlePageChange("packageCheck")}
        />
      </div>
      <button
        onClick={() =>
          window.open(
            "https://docs.google.com/forms/d/e/1FAIpQLSdrJcdsDCP4lq5t6nAltO-Ozab1kCgEhxmFfgml9mRqiISseg/viewform?usp=send_form",
            "_blank"
          )
        }
        className="w-full border-2 border-red-500 text-red-500 py-3 px-4 rounded-xl font-medium hover:bg-red-50 hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <ExclamationTriangleIcon className="w-5 h-5" />
        回報可疑地址
      </button>
      <Footer />
    </div>
  );
}
