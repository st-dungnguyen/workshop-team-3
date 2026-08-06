import React from 'react';
import { PrivateRoute } from './PrivateRoute';
import type { PageRoute } from './router.interface';

export const renderChildren = (routes: PageRoute[]) => {
  return routes.map((route) => {
    return {
      ...route,
      element: route.isProtected ? (
        <PrivateRoute component={route.element} />
      ) : (
        <route.element />
      ),
      children: route.children ? renderChildren(route.children) : [],
    };
  });
};
