import FeatureCard from '@/components/FeatureCard';
import MainFeatureCard from '@/components/MainFeatureCard';
import OperationStatus from '@/components/OperationStatus';
import { APP_DESCRIPTION, BLOCKLIST_REPORT_URL, FEATURES } from '@/constants';
import {
  CodeBracketIcon,
  CursorArrowRaysIcon,
  DocumentCheckIcon,
  FlagIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function StartPage() {
  const navigate = useNavigate();
  const menuIconClassName = 'h-8 w-8 text-gray-400';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto px-10 py-10">
        <div className="flex flex-col gap-5">
          <OperationStatus status="protected" />
          <MainFeatureCard
            icon={<CodeBracketIcon className="h-5 w-5 text-[hsl(217,53%,35%)]" />}
            title={FEATURES.audit}
            description={APP_DESCRIPTION}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/audit');
            }}
          />
          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-xs text-gray-500">Other Tools</span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>
          <FeatureCard
            title={FEATURES.blocklist}
            icon={<NoSymbolIcon className={menuIconClassName} />}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/blocklist');
            }}
          />
          <FeatureCard
            title={FEATURES.safeWebsite}
            icon={<CursorArrowRaysIcon className={menuIconClassName} />}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/website-check');
            }}
          />
          <FeatureCard
            title={FEATURES.packageCheck}
            icon={<DocumentCheckIcon className={menuIconClassName} />}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/package-check');
            }}
          />
          <FeatureCard
            title="Blocklist Report"
            icon={<FlagIcon className={menuIconClassName} />}
            onClick={() => window.open(BLOCKLIST_REPORT_URL, '_blank')}
          />
        </div>
      </div>
    </div>
  );
}
