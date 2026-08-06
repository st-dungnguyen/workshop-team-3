import React from 'react';
import { Outlet } from 'react-router-dom';

const Articles = () => {
  return (
    <div className="container">
      <Outlet />
    </div>
  );
};

export default Articles;
