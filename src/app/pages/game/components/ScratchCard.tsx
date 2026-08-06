import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameVariantProps } from '@app/shared/models/game';

const CARD_W = 280;
const CARD_H = 180;
const AUTO_COMPLETE_THRESHOLD = 0.6;

const ScratchCard = ({
  outcome,
  coupon,
  sessionState,
  onPlayInitiated,
  onAnimationComplete,
}: GameVariantProps) => {
  const { t } = useTranslation('game');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitiatedRef = useRef(false);
  const isDrawingRef = useRef(false);
  const isDoneRef = useRef(false);
  const sessionStateRef = useRef(sessionState);
  const onPlayInitiatedRef = useRef(onPlayInitiated);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);
  useEffect(() => {
    onPlayInitiatedRef.current = onPlayInitiated;
  }, [onPlayInitiated]);
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, '#d4a455');
    grad.addColorStop(0.5, '#c08030');
    grad.addColorStop(1, '#9a6020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Dot texture
    ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
    for (let x = 14; x < CARD_W; x += 24) {
      for (let y = 14; y < CARD_H; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Center hint text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('こすってね！', CARD_W / 2, CARD_H / 2 - 16);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('▼  スクラッチ  ▼', CARD_W / 2, CARD_H / 2 + 14);
  }, []);

  const scratch = (clientX: number, clientY: number) => {
    const state = sessionStateRef.current;
    if (state === 'completed' || isDoneRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasInitiatedRef.current && state === 'pending') {
      hasInitiatedRef.current = true;
      onPlayInitiatedRef.current();
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    if (state === 'revealing') {
      const imageData = ctx.getImageData(0, 0, CARD_W, CARD_H);
      let transparent = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparent++;
      }
      const ratio = transparent / (CARD_W * CARD_H);
      if (ratio >= AUTO_COMPLETE_THRESHOLD) {
        isDoneRef.current = true;
        ctx.clearRect(0, 0, CARD_W, CARD_H);
        onAnimationCompleteRef.current();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <div className="scratch-card">
      <div className="scratch-card-frame">
        <span
          className="scratch-card-corner scratch-card-corner-tl"
          aria-hidden="true"
        >
          ★
        </span>
        <span
          className="scratch-card-corner scratch-card-corner-tr"
          aria-hidden="true"
        >
          ★
        </span>
        <span
          className="scratch-card-corner scratch-card-corner-bl"
          aria-hidden="true"
        >
          ★
        </span>
        <span
          className="scratch-card-corner scratch-card-corner-br"
          aria-hidden="true"
        >
          ★
        </span>
        <div className="scratch-card-surface">
          <div
            className={[
              'scratch-card-result',
              outcome ? `scratch-card-result-${outcome}` : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {outcome === 'win' && coupon && (
              <>
                <span className="scratch-card-result-label">
                  {t('result.win.scratchLabel')}
                </span>
                <span className="scratch-card-result-discount">
                  {coupon.discount}
                </span>
              </>
            )}
            {outcome === 'lose' && (
              <span className="scratch-card-result-lose-text">
                {t('result.lose.scratchLabel')}
              </span>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={CARD_W}
            height={CARD_H}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>
      <p className="scratch-card-instruction">{t('scratch.instruction')}</p>
    </div>
  );
};

export default ScratchCard;
