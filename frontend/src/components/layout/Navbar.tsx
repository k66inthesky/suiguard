import { APP_NAME } from '@/constants';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };
  const isLandingPage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <nav className="flex h-16 items-center justify-between px-8 max-w-7xl mx-auto">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/images/logo48.png" alt="SuiAudit Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-[#0857aa]">{APP_NAME}</h1>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {isLandingPage && (
            <>
              <button
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-gray-900 hover:cursor-pointer transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-gray-900 hover:cursor-pointer transition-colors font-medium"
              >
                Pricing
              </button>
            </>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center">
          {isLandingPage && (
            <Link
              to="/get-started"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
