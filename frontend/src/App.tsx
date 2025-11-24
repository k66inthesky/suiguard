import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <div className="min-h-screen min-w-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 bg-gray-50 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function WithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <App />
    </Suspense>
  );
}
