import '@mysten/dapp-kit/dist/index.css';
import '@radix-ui/themes/styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { networkConfig } from './networkConfig.ts';
import AuditPage from './pages/AuditPage.tsx';
import BlocklistPage from './pages/BlocklistPage.tsx';
import CertificatePage from './pages/CertificatePage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import PaymentPage from './pages/PaymentPage.tsx';
import SafeWebsitePage from './pages/SafeWebsitePage.tsx';
import StartPage from './pages/StartPage.tsx';
import PackageCheckPage from './pages/PackageCheckPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import SlushCleanup from './pages/SlushCleanup.tsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'get-started',
        element: <StartPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
      {
        path: 'blocklist',
        element: <BlocklistPage />,
      },
      {
        path: 'website-check',
        element: <SafeWebsitePage />,
      },
      {
        path: 'package-check',
        element: <PackageCheckPage />,
      },
      {
        path: 'certificate',
        element: <CertificatePage />,
      },
      {
        path: 'payment',
        element: <PaymentPage />,
      },
      {
        path: 'slush-cleanup-app',
        element: <SlushCleanup />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Theme appearance="light">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <RouterProvider router={router} />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
