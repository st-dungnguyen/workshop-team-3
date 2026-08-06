import React from 'react';
import type { PageRoute } from '@core/modules/custom-router-dom/router.interface';
import gameRoutes from './game/game.routes';
import errorRoutes from './error/error.routes';

const GamePage = React.lazy(() => import('./game/containers/GamePage'));

const pageRoutes: PageRoute[] = [
  {
    path: '/',
    element: GamePage,
    children: [...gameRoutes, ...errorRoutes],
  },
];

export default pageRoutes;
