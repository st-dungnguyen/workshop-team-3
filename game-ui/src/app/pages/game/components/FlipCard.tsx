import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameVariantProps } from '@app/shared/models/game';

const CARD_COUNT = 3;

const FlipCard = ({
  outcome,
  coupon,
  sessionState,
  onPlayInitiated,
  onAnimationComplete,
}: GameVariantProps) => {
  const { t } = useTranslation('game');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleCardTap = (index: number) => {
    if (sessionState !== 'pending' || selectedIndex !== null) return;
    setSelectedIndex(index);
    onPlayInitiated();
  };

  const handleFlipEnd = () => {
    if (sessionState === 'revealing') {
      onAnimationComplete();
    }
  };

  return (
    <div className="flip-card-board">
      <p className="flip-card-instruction">{t('flip.instruction')}</p>
      <div className="flip-card-row">
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div
            key={i}
            className={[
              'flip-card-item',
              selectedIndex === i && sessionState === 'revealing'
                ? 'flip-card-item-flipping'
                : '',
              selectedIndex !== null && selectedIndex !== i
                ? 'flip-card-item-dimmed'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleCardTap(i)}
            onTransitionEnd={selectedIndex === i ? handleFlipEnd : undefined}
          >
            <div className="flip-card-item-inner">
              <div className="flip-card-item-front">
                <span
                  className="flip-card-item-front-question"
                  aria-hidden="true"
                >
                  ?
                </span>
              </div>
              <div
                className={[
                  'flip-card-item-back',
                  outcome ? `flip-card-item-back-${outcome}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {outcome === 'win' && coupon && (
                  <span className="flip-card-item-back-discount">
                    {coupon.discount}
                  </span>
                )}
                {outcome === 'lose' && (
                  <span className="flip-card-item-back-lose">
                    {t('result.lose.scratchLabel')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlipCard;
