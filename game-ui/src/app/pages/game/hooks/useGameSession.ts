import axios from 'axios';
import { useCallback, useState } from 'react';
import { useAuth } from '@shared/contexts/auth.context';
import { GameService } from '@shared/services/game.service';
import type {
  CouponInfo,
  GameOutcome,
  SessionState,
} from '@app/shared/models/game';

type InlineError = 'serverError' | 'alreadyPlayed' | null;

interface UseGameSessionReturn {
  sessionState: SessionState;
  outcome: GameOutcome | null;
  coupon: CouponInfo | null;
  points: number | null;
  inlineError: InlineError;
  handlePlayInitiated: () => void;
  handleAnimationComplete: () => void;
  handleRetry: () => void;
}

const gameService = new GameService();

const useGameSession = (campaignId: string): UseGameSessionReturn => {
  const { token } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>('pending');
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [inlineError, setInlineError] = useState<InlineError>(null);

  const handlePlayInitiated = useCallback(async () => {
    if (sessionState !== 'pending') return;

    setSessionState('initiated');
    setInlineError(null);

    try {
      const result = await gameService.play(campaignId, token ?? '');
      setOutcome(result.outcome);
      setCoupon(result.coupon ?? null);
      setPoints(result.points ?? null);
      setSessionState('revealing');

      if (result.outcome === 'win' && result.coupon?.id) {
        gameService.claimCoupon(result.coupon.id, token ?? '').catch(() => {});
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.code === 'ALREADY_PLAYED'
      ) {
        setInlineError('alreadyPlayed');
      } else {
        setInlineError('serverError');
      }
      setSessionState('pending');
    }
  }, [sessionState, token, campaignId]);

  const handleAnimationComplete = useCallback(() => {
    setSessionState('completed');
  }, []);

  const handleRetry = useCallback(() => {
    setInlineError(null);
  }, []);

  return {
    sessionState,
    outcome,
    coupon,
    points,
    inlineError,
    handlePlayInitiated,
    handleAnimationComplete,
    handleRetry,
  };
};

export default useGameSession;
