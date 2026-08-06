import { useTranslation } from 'react-i18next';
import useGameSession from '../hooks/useGameSession';
import VariantRenderer from '../components/VariantRenderer';
import GameResult from './GameResult';

const GameAlreadyPlayed = () => {
  const { t } = useTranslation('game');
  return (
    <div className="game-already-played">
      <div className="game-already-played-illustration" aria-hidden="true">
        📅
      </div>
      <h2 className="game-already-played-title">{t('alreadyPlayed.title')}</h2>
      <div className="game-already-played-bubble">
        <p className="game-already-played-body">{t('alreadyPlayed.body')}</p>
      </div>
    </div>
  );
};

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

const GameShell = () => {
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

  if (inlineError === 'alreadyPlayed') {
    return <GameAlreadyPlayed />;
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

export default GameShell;
