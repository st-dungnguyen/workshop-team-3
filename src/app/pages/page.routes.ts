import React from 'react';

import { PageRoute } from '@core/modules/custom-router-dom/router.interface';
import articleRoutes from './articles/article.routes';
import homeRoutes from './home/home.routes';
import errorRoutes from './error/error.routes';

const Page = React.lazy(() => import('./Page'));

const pageRoutes: PageRoute[] = [
  {
    path: '/',
    element: Page,
    children: [...homeRoutes, ...articleRoutes, ...errorRoutes],
  },
];

export default pageRoutes;
