import React, { use } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import logo from '/icons/full-logo.svg';
import { AuthContext } from '@app/shared/contexts/auth.context';

export const Header = () => {
  const { isAuthenticated, clearUserSession } = use(AuthContext)!;
  const { t } = useTranslation('common');

  const handleLogout = () => {
    clearUserSession();
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link';

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <NavLink to="/" className="navbar-brand">
            <img src={logo} alt="Logo" />
          </NavLink>
          <div className="navbar-collapse">
            <ul className="navbar-nav d-flex">
              <li className="nav-item">
                <NavLink to="" className={getNavLinkClass}>
                  {t('header.home')}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="articles" className={getNavLinkClass}>
                  {t('header.articles')}
                </NavLink>
              </li>
              {isAuthenticated ? (
                <li className="nav-item">
                  <NavLink
                    to=""
                    onClick={handleLogout}
                    className="nav-link btn btn-primary"
                  >
                    {t('header.logout')}
                  </NavLink>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink to="auth/login" className={getNavLinkClass}>
                      {t('header.login')}
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="auth/register"
                      className="nav-link btn btn-primary"
                    >
                      {t('header.register')}
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
};
