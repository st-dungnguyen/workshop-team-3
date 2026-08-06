import React, { type CSSProperties } from 'react';
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
          } as CSSProperties
        }
      />
    ))}
  </div>
);

interface PointsBadgeProps {
  points: number;
}

const PointsBadge = ({ points }: PointsBadgeProps) => {
  const { t } = useTranslation('game');
  return (
    <div className="game-result-points-badge">
      <span className="game-result-points-badge-icon" aria-hidden="true">
        ⭐
      </span>
      <span className="game-result-points-badge-text">
        {t('result.pointsAwarded', { count: points })}
      </span>
    </div>
  );
};

interface WinResultProps {
  coupon: CouponInfo | null;
  points: number | null;
}

const WinResult = ({ coupon, points }: WinResultProps) => {
  const { t } = useTranslation('game');

  const handleUseCoupon = () => {
    if (!coupon?.id) return;
    const encodedId = encodeURIComponent(coupon.id);
    window.location.href = `${COUPON_BASE_URL}/app/coupon/detail?id=${encodedId}`;
  };

  const handleMyCoupon = () => {
    window.location.href = `${COUPON_BASE_URL}/app/main?to=coupon_list`;
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

      {points !== null && <PointsBadge points={points} />}

      {coupon && (
        <div className="game-result-cta-group">
          <button
            className="btn-primary game-result-cta game-result-cta-use-coupon"
            onClick={handleUseCoupon}
          >
            {t('result.useCoupon')}
          </button>
          <button
            className="btn-secondary game-result-cta game-result-cta-my-coupon"
            onClick={handleMyCoupon}
          >
            {t('result.myCoupon')}
          </button>
        </div>
      )}
    </div>
  );
};

interface LoseResultProps {
  points: number | null;
}

const LoseResult = ({ points }: LoseResultProps) => {
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

      {points !== null && <PointsBadge points={points} />}

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
  points: number | null;
}

const GameResult = ({ outcome, coupon, points }: GameResultProps) => {
  if (outcome === 'win') return <WinResult coupon={coupon} points={points} />;
  return <LoseResult points={points} />;
};

export default GameResult;
