import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CouponInfo, GameOutcome } from '@app/shared/models/game';

const COUPON_BASE_URL =
  import.meta.env.VITE_SKYLARK_BASE_URL ?? 'https://www.skylark.co.jp';

const CONFETTI_COLORS = [
  '#f44336',
  '#FF8F00',
  '#FFD600',
  '#4CAF50',
  '#2196F3',
  '#E91E63',
  '#9C27B0',
  '#FF5722',
];

const formatEndDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const Confetti = () => (
  <div className="game-confetti" aria-hidden="true">
    {Array.from({ length: 24 }, (_, i) => (
      <span
        key={i}
        className="game-confetti-piece"
        style={
          {
            '--c-color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            '--c-x': `${(i * 13 + 5) % 100}%`,
            '--c-delay': `${((i * 0.37) % 2.8).toFixed(2)}s`,
            '--c-duration': `${(2.2 + ((i * 0.19) % 1.4)).toFixed(2)}s`,
            '--c-rotate': `${(i * 53) % 360}deg`,
            '--c-width': i % 3 === 0 ? '6px' : '9px',
            '--c-height': i % 3 === 0 ? '6px' : '12px',
            '--c-radius': i % 4 === 0 ? '50%' : '2px',
          } as React.CSSProperties
        }
      />
    ))}
  </div>
);

interface WinResultProps {
  coupon: CouponInfo | null;
}

const WinResult = ({ coupon }: WinResultProps) => {
  const { t } = useTranslation('game');
  const [ctaState, setCtaState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  );

  const navigate = (url: string) => {
    window.location.href = url;
  };

  const handleCta = async (intent: 'claim' | 'useNow') => {
    if (ctaState === 'loading') return;
    setCtaState('loading');
    try {
      if (!coupon || !coupon.id) {
        setCtaState('error');
        return;
      }
      const encodedId = encodeURIComponent(coupon.id);
      if (intent === 'useNow') {
        navigate(`${COUPON_BASE_URL}/app/takeout?coupon_id=${encodedId}`);
      } else {
        navigate(`${COUPON_BASE_URL}/app/coupon/segment?id=${encodedId}`);
      }
    } catch {
      setCtaState('error');
    }
  };

  return (
    <div className="game-result-win">
      <Confetti />

      <div className="game-result-win-celebration">
        <div className="game-result-win-rays" aria-hidden="true" />
        <span className="game-result-win-badge" aria-hidden="true">
          🎊
        </span>
      </div>

      <h2 className="game-result-win-title">{t('result.win.title')}</h2>
      <p className="game-result-win-body">{t('result.win.body')}</p>

      {coupon && (
        <div className="game-result-coupon-card">
          <div className="game-result-coupon-card-hole game-result-coupon-card-hole-left" />
          <div className="game-result-coupon-card-hole game-result-coupon-card-hole-right" />
          <p className="game-result-coupon-card-title">{coupon.title}</p>
          <p className="game-result-coupon-card-discount">{coupon.discount}</p>
          <p className="game-result-coupon-card-expiry">
            {t('result.win.expiry', { date: formatEndDate(coupon.endDate) })}
          </p>
        </div>
      )}

      {ctaState === 'error' && (
        <p className="game-result-win-error">{t('result.claimError')}</p>
      )}

      <div className="game-result-actions">
        <button
          className="btn-primary game-result-cta"
          disabled={ctaState === 'loading'}
          onClick={() => handleCta('useNow')}
        >
          {ctaState === 'loading' ? '…' : t('result.useNow')}
        </button>
        <button
          className="btn-secondary game-result-cta"
          disabled={ctaState === 'loading'}
          onClick={() => handleCta('claim')}
        >
          {t('result.claimCoupon')}
        </button>
      </div>
    </div>
  );
};

const LoseResult = () => {
  const { t } = useTranslation('game');

  return (
    <div className="game-result-lose">
      <div className="game-result-lose-illustration">
        <span className="game-result-lose-emoji" aria-hidden="true">
          🌸
        </span>
      </div>
      <h2 className="game-result-lose-title">{t('result.lose.title')}</h2>
      <div className="game-result-lose-bubble">
        <p className="game-result-lose-body">{t('result.lose.body')}</p>
      </div>
      <button
        className="btn-primary game-result-cta game-result-cta-close"
        onClick={() => {
          window.location.href = `${window.location.origin}/close`;
        }}
      >
        {t('result.close')}
      </button>
    </div>
  );
};

interface GameResultProps {
  outcome: GameOutcome;
  coupon: CouponInfo | null;
}

const GameResult = ({ outcome, coupon }: GameResultProps) => {
  if (outcome === 'win') return <WinResult coupon={coupon} />;
  return <LoseResult />;
};

export default GameResult;
