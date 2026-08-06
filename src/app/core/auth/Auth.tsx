import React from 'react';
import { Outlet } from 'react-router-dom';

import { FooterBasic, HeaderBasic } from '@app/shared/components/layout';

const Auth = () => {
  return (
    <div className="container basic-container">
      <HeaderBasic />
      <main className="main basic-main">
        <Outlet />
      </main>
      <FooterBasic />
    </div>
  );
};

export default Auth;
