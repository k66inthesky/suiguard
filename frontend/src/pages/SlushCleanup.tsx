import FeatureCard from '@/components/FeatureCard';
import OperationStatus from '@/components/OperationStatus';
import { BLOCKLIST_REPORT_URL, FEATURES } from '@/constants';
import {
  FlagIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function SlushCleanup() {
  const navigate = useNavigate();
  const menuIconClassName = 'h-8 w-8 text-gray-400';

  return (
    <div className="flex flex-col min-h-screen max-w-3xl mx-auto px-10 py-10 overflow-hidden">
      <div className="flex flex-col gap-5 flex-1">
        <OperationStatus status="protected" />
        <FeatureCard
          title={FEATURES.blocklist}
          icon={<NoSymbolIcon className={menuIconClassName} />}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate('/blocklist');
          }}
        />
        <FeatureCard
          title="Blocklist Report"
          icon={<FlagIcon className={menuIconClassName} />}
          onClick={() => window.open(BLOCKLIST_REPORT_URL, '_blank')}
        />
      </div>
    </div>
  );
}
