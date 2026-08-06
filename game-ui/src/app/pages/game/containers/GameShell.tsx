import { useTranslation } from 'react-i18next';
import { Spinner } from '@shared/components/common';
import useEligibilityCheck from '../hooks/useEligibilityCheck';
import useGameSession from '../hooks/useGameSession';
import VariantRenderer from '../components/VariantRenderer';
import GameResult from './GameResult';

// ── F4.2: Play Limit Screen ───────────────────────────────────────────────────

const formatNextPlayAt = (iso: string, lng: string): string => {
  const d = new Date(iso);
  return d.toLocaleString(lng === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PlayLimitScreen = ({ nextPlayAt }: { nextPlayAt: string | null }) => {
  const { t, i18n } = useTranslation('game');
  return (
    <div className="game-play-limit">
      <div className="game-play-limit-illustration" aria-hidden="true">
        📅
      </div>
      <h2 className="game-play-limit-title">{t('alreadyPlayed.title')}</h2>
      <div className="game-play-limit-bubble">
        <p className="game-play-limit-body">
          {nextPlayAt
            ? t('alreadyPlayed.nextPlayAt', {
                date: formatNextPlayAt(nextPlayAt, i18n.language),
              })
            : t('alreadyPlayed.comeBackSoon')}
        </p>
      </div>
      <button
        className="btn-primary game-play-limit-cta"
        onClick={() => {
          window.location.href = `${window.location.origin}/close`;
        }}
      >
        {t('alreadyPlayed.returnToApp')}
      </button>
    </div>
  );
};

// ── F4.1: Session Check Error ─────────────────────────────────────────────────

const GameSessionCheckError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation('game');
  return (
    <div className="game-session-check-error">
      <p className="game-session-check-error-title">
        {t('sessionCheckError.title')}
      </p>
      <p className="game-session-check-error-body">
        {t('sessionCheckError.body')}
      </p>
      <button className="btn-primary" onClick={onRetry}>
        {t('sessionCheckError.retry')}
      </button>
    </div>
  );
};

// ── Server Error (inline, during play) ───────────────────────────────────────

const GameServerError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation('game');
  return (
    <div className="game-server-error">
      <p className="game-server-error-title">{t('serverError.title')}</p>
      <p className="game-server-error-body">{t('serverError.body')}</p>
      <button className="btn-primary" onClick={onRetry}>
        {t('serverError.retry')}
      </button>
    </div>
  );
};

// ── Game Content (shown only when eligible) ───────────────────────────────────

const GameContent = () => {
  const { t } = useTranslation('game');
  const {
    sessionState,
    outcome,
    coupon,
    inlineError,
    handlePlayInitiated,
    handleAnimationComplete,
    handleRetry,
  } = useGameSession();

  if (sessionState === 'completed') {
    return <GameResult outcome={outcome!} coupon={coupon} />;
  }

  return (
    <div className="game-shell">
      <div className="game-shell-stars" aria-hidden="true">
        <span className="game-shell-star game-shell-star-1">⭐</span>
        <span className="game-shell-star game-shell-star-2">✨</span>
        <span className="game-shell-star game-shell-star-3">🌟</span>
        <span className="game-shell-star game-shell-star-4">✨</span>
      </div>
      <div className="game-shell-header">
        <h1 className="game-shell-header-title">{t('title')}</h1>
        <p className="game-shell-header-subtitle">{t('subtitle')}</p>
      </div>
      {inlineError === 'serverError' && (
        <GameServerError onRetry={handleRetry} />
      )}
      {inlineError === 'alreadyPlayed' && <PlayLimitScreen nextPlayAt={null} />}
      <VariantRenderer
        outcome={outcome}
        coupon={coupon}
        sessionState={sessionState}
        onPlayInitiated={handlePlayInitiated}
        onAnimationComplete={handleAnimationComplete}
      />
    </div>
  );
};

// ── GameShell: eligibility gate (F4.1) ───────────────────────────────────────

const GameShell = () => {
  const { status, nextPlayAt, retry } = useEligibilityCheck();

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <GameSessionCheckError onRetry={retry} />;
  if (status === 'ineligible')
    return <PlayLimitScreen nextPlayAt={nextPlayAt} />;

  return <GameContent />;
};

export default GameShell;
