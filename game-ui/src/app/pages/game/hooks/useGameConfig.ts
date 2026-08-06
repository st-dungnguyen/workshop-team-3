import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@shared/contexts/auth.context';
import { GameService } from '@shared/services/game.service';
import type { GameActiveConfig } from '@app/shared/models/game';

type ConfigStatus = 'loading' | 'ready' | 'error';

interface UseGameConfigReturn {
  config: GameActiveConfig | null;
  status: ConfigStatus;
  retry: () => void;
}

const gameService = new GameService();

const useGameConfig = (): UseGameConfigReturn => {
  const { token } = useAuth();
  const [status, setStatus] = useState<ConfigStatus>('loading');
  const [config, setConfig] = useState<GameActiveConfig | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await gameService.getConfig(token ?? '');
      setConfig(result);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { config, status, retry: load };
};

export default useGameConfig;
