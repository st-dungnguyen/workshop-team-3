import React from 'react';
import { Link } from 'react-router-dom';

import logo from '/icons/full-logo.svg';

export const HeaderBasic = () => {
  return (
    <header className="header basic-header">
      <Link to="/">
        <img src={logo} alt="Logo" className="logo" />
      </Link>
    </header>
  );
};
