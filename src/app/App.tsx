import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import i18n from './core/services/i18n.service';
import '@stylesheet/styles.scss';

import appRoutes from './app.routes';
import AppSuspense from './AppSuspense';

import { AuthProvider } from './shared/contexts/auth.context';
import { renderChildren } from './core/modules/custom-router-dom/RouterOutlet';
import AppErrorBoundaryFallback from './AppErrorBoundaryFallback';

export const Root = () => {
  return (
    <>
      <ErrorBoundary FallbackComponent={AppErrorBoundaryFallback}>
        <AppSuspense fallback={<></>}>
          <Outlet />
        </AppSuspense>
      </ErrorBoundary>
    </>
  );
};

const router = createBrowserRouter([
  { path: '/', Component: Root, children: renderChildren(appRoutes) },
]);

const root = createRoot(document.getElementById('root'));
root.render(
  <I18nextProvider i18n={i18n}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </I18nextProvider>,
);
