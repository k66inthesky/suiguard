import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Footer from "./Footer";
import { Page } from "@src/type";

export default function PageLayout({
  title,
  children,
  handlePageChange,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  handlePageChange: (page: Page) => void;
}>) {
  return (
    <div className="flex h-screen flex-col p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handlePageChange("home")}
          className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">Protected</span>
        </div>
      </div>
      <hr className="mb-6 border-t border-gray-100" />
      <div className="flex-1 overflow-y-auto">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}
