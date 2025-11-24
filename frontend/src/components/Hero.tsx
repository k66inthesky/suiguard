import { demoVideoUrl } from '@/constants';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-24 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-8 relative z-10">
        <div className="text-center flex flex-col items-center gap-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700">
              New: AI-Powered Code Audit Features available
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900 mb-6">
            Get Sui-Move Code Audit{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              With AI Solutions
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            Detect vulnerabilities and ensure code quality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/get-started"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg inline-flex items-center justify-center gap-2 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Request Audit
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href={demoVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border border-gray-300 inline-flex items-center justify-center"
            >
              Watch Demo
            </a>
            <Link
              to="/slush-cleanup-app"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors border border-gray-300 inline-flex items-center justify-center"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Explore Sui Wallet Cleanup POC
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '100+', label: 'Audits Completed' },
              { value: '$50M+', label: 'Assets Secured' },
              { value: '500+', label: 'Vulnerabilities Found' },
              { value: '99.9%', label: 'Client Satisfaction' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
