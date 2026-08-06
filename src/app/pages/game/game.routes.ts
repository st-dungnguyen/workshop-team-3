import React from 'react';
import type { PageRoute } from '@core/modules/custom-router-dom/router.interface';

const GameShell = React.lazy(() => import('./containers/GameShell'));
const GameRedirect = React.lazy(() => import('./containers/GameRedirect'));

const gameRoutes: PageRoute[] = [
  {
    path: '',
    element: GameRedirect,
  },
  {
    path: 'game',
    element: GameShell,
    isProtected: true,
  },
];

export default gameRoutes;
