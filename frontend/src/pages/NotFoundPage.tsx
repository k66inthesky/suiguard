import { HomeIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl min-w-screen text-center flex flex-col gap-8">
        {/* 404  */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            404
          </h1>
        </div>
        {/* error msg */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-2">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-500">Please check the URL or navigate back to our homepage.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center ">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <HomeIcon className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
        {/* quick links*/}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Quick Links:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/get-started" className="text-blue-600 hover:text-blue-700 hover:underline">
              Get Started
            </Link>
            <Link to="/pricing" className="text-blue-600 hover:text-blue-700 hover:underline">
              Pricing
            </Link>
            <Link to="/audit" className="text-blue-600 hover:text-blue-700 hover:underline">
              Audit Service
            </Link>
            <Link to="/blocklist" className="text-blue-600 hover:text-blue-700 hover:underline">
              Blocklist Detection
            </Link>
            <Link to="/safe-website" className="text-blue-600 hover:text-blue-700 hover:underline">
              Website Security
            </Link>
          </div>
        </div>
        {/* 裝飾性圖示 */}
        <div className="mt-12 flex justify-center gap-8 opacity-20">
          <div className="w-16 h-16 bg-blue-200 rounded-full"></div>
          <div className="w-12 h-12 bg-blue-300 rounded-full"></div>
          <div className="w-20 h-20 bg-blue-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
