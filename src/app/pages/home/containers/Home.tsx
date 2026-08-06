import React from 'react';
import { useTranslation } from 'react-i18next';

import logo from '/icons/short-logo.svg';

const Home = () => {
  const { t } = useTranslation(['common', 'home']);

  return (
    <div className="home-page">
      <div className="container">
        <div className="page-inner">
          <div className="logo">
            <img src={logo} alt="short-logo" />
          </div>
          <h1 className="title">{t('home:title')}</h1>
          <p className="desc">{t('home:description')}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
