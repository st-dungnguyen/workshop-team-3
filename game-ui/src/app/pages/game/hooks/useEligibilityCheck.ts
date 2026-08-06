import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@shared/contexts/auth.context';
import { GameService } from '@shared/services/game.service';

type EligibilityStatus = 'loading' | 'eligible' | 'ineligible' | 'error';

interface EligibilityState {
  status: EligibilityStatus;
  nextPlayAt: string | null;
}

interface UseEligibilityCheckReturn extends EligibilityState {
  retry: () => void;
}

const gameService = new GameService();

const useEligibilityCheck = (): UseEligibilityCheckReturn => {
  const { token } = useAuth();
  const [state, setState] = useState<EligibilityState>({
    status: 'loading',
    nextPlayAt: null,
  });

  const check = useCallback(async () => {
    setState({ status: 'loading', nextPlayAt: null });
    try {
      const result = await gameService.checkEligibility(token ?? '');
      setState({
        status: result.eligible ? 'eligible' : 'ineligible',
        nextPlayAt: result.nextPlayAt,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        // 401 during eligibility check → treat as auth error (session expired)
        // AuthContext's 401 handling will surface the auth.unauthorized screen
      }
      setState({ status: 'error', nextPlayAt: null });
    }
  }, [token]);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, retry: check };
};

export default useEligibilityCheck;
