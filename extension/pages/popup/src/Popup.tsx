import { withErrorBoundary, withSuspense } from "@extension/shared";
import { ErrorDisplay, LoadingSpinner } from "@extension/ui";
import "@src/Popup.css";
import { useState } from "react";
import BlocklistPage from "./components/pages/BlocklistPage";
import HomePage from "./components/pages/HomePage";
import PackageCheckPage from "./components/pages/PackageCheckPage";
import SafeWebsitePage from "./components/pages/SafeWebsitePage";
import VerifiedPage from "./components/pages/VerifiedPage";
import { Page } from "./type";

const Popup = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage handlePageChange={handlePageChange} />;
      case "blocklist":
        return <BlocklistPage handlePageChange={handlePageChange} />;
      case "safeWebsite":
        return <SafeWebsitePage handlePageChange={handlePageChange} />;
      case "packageCheck":
        return <PackageCheckPage handlePageChange={handlePageChange} />;
      case "verified":
        return <VerifiedPage handlePageChange={handlePageChange} />;
      default:
        return <HomePage handlePageChange={handlePageChange} />;
    }
  };

  return <div className=" bg-gray-50 p-6 font-sans">{renderPage()}</div>;
};

export default withErrorBoundary(
  withSuspense(Popup, <LoadingSpinner />),
  ErrorDisplay
);
