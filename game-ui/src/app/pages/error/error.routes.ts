import React from 'react';

import { PageRoute } from '@core/modules/custom-router-dom/router.interface';

const Error = React.lazy(() => import('./containers/Error'));

const errorRoutes: PageRoute[] = [
  {
    path: '',
    element: Error,
    children: [
      {
        path: '*',
        element: Error,
      },
    ],
  },
];

export default errorRoutes;
