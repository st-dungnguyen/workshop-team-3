import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthErrorCode } from '@shared/models/auth';

interface AuthErrorScreenProps {
  errorCode: AuthErrorCode;
  onRetry?: () => void;
}

const IconAlert = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
  </svg>
);

const IconClock = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

const IconRefresh = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ICON_MAP: Record<AuthErrorCode, React.ReactNode> = {
  tokenMissing: <IconAlert />,
  tokenInvalid: <IconAlert />,
  unauthorized: <IconAlert />,
  tokenExpired: <IconClock />,
  serverError: <IconRefresh />,
};

const AuthErrorScreen = ({ errorCode, onRetry }: AuthErrorScreenProps) => {
  const { t } = useTranslation('auth');

  return (
    <div className="auth-gate-error">
      <div className="auth-gate-error-card">
        <div className="auth-gate-error-icon">{ICON_MAP[errorCode]}</div>
        <p className="auth-gate-error-title">{t(`${errorCode}.title`)}</p>
        <p className="auth-gate-error-body">{t(`${errorCode}.body`)}</p>
        {errorCode === 'serverError' && onRetry && (
          <button className="auth-gate-error-retry" onClick={onRetry}>
            {t('retry')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthErrorScreen;
