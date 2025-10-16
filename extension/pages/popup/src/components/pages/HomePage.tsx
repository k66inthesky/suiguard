import {
  CodeBracketIcon,
  CursorArrowRaysIcon,
  DocumentCheckIcon,
  FlagIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import {
  BLOCKLIST_REPORT_URL,
  EXTENSION_DESCRIPTION,
  FEATURES,
} from "@src/constants";
import { Page } from "@src/type";
import FeatureCard from "../FeatureCard";
import Footer from "../Footer";
import Header from "../Header";
import MainFeatureCard from "../MainFeatureCard";
import OperationStatus from "../OperationStatus";

export default function HomePage({
  handlePageChange,
}: Readonly<{
  handlePageChange: (page: Page) => void;
}>) {
  const menuIconClassName = "h-8 w-8 text-gray-400";

  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex flex-col gap-4 p-6 pt-0">
        <OperationStatus status="protected" />
        <MainFeatureCard
          icon={<CodeBracketIcon className="h-5 w-5 text-[hsl(217,53%,35%)]" />}
          title={FEATURES.audit}
          description={EXTENSION_DESCRIPTION}
          onClick={() => handlePageChange("audit")}
        />
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="text-xs text-gray-500">Other Tools</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>
        <FeatureCard
          title={FEATURES.blocklist}
          icon={<NoSymbolIcon className={menuIconClassName} />}
          onClick={() => handlePageChange("blocklist")}
        />
        <FeatureCard
          title={FEATURES.safeWebsite}
          icon={<CursorArrowRaysIcon className={menuIconClassName} />}
          onClick={() => handlePageChange("safeWebsite")}
        />

        <FeatureCard
          title={FEATURES.packageCheck}
          icon={<DocumentCheckIcon className={menuIconClassName} />}
          onClick={() => handlePageChange("packageCheck")}
        />
        <FeatureCard
          title="Blocklist Report"
          icon={<FlagIcon className={menuIconClassName} />}
          onClick={() => window.open(BLOCKLIST_REPORT_URL, "_blank")}
        />
      </div>
      <Footer />
    </div>
  );
}
