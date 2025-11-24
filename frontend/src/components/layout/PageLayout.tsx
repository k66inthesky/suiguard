import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export default function PageLayout({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen min-w-screen max-w-3xl mx-auto px-6 flex-col p-6">
      <div className="flex items-center justify-between">
        <Link
          to="/get-started"
          className="hover:cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">Protected</span>
        </div>
      </div>
      <hr className="mb-6 border-t border-gray-100" />
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-3">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
