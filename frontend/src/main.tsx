import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@mysten/dapp-kit/dist/index.css';
import '@radix-ui/themes/styles.css';
// import './index.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { networkConfig } from './networkConfig.ts';
import App from './App.tsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // {
      //   index: true,
      //   element: <HomePage />,
      // },
      // {
      //   path: 'audit',
      //   element: <AuditPage />,
      // },
      // {
      //   path: 'blocklist',
      //   element: <BlocklistPage />,
      // },
      // {
      //   path: 'website-check',
      //   element: <SafeWebsitePage />,
      // },
      // {
      //   path: 'certificate',
      //   element: <CertificatePage />,
      // },
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
