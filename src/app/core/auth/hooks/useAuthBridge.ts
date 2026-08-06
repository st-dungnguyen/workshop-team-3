import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@shared/contexts/auth.context';
import { AuthBridgeService } from '../services/auth-bridge.service';

const TOKEN_WAIT_MS = 5000;
const authBridgeService = new AuthBridgeService();

const useAuthBridge = () => {
  const { retryCount, setLoading, setTokenValidated, setAuthError } = useAuth();

  const tokenReceivedRef = useRef(false);
  const pendingTokenRef = useRef<string | null>(null);

  const handleValidate = useCallback(
    async (token: string) => {
      pendingTokenRef.current = token;
      setLoading();
      try {
        await authBridgeService.validate(token);
        setTokenValidated(token);
      } catch (error) {
        setAuthError(authBridgeService.mapErrorToCode(error));
      }
    },
    [setLoading, setTokenValidated, setAuthError],
  );

  useEffect(() => {
    tokenReceivedRef.current = false;

    // 1. URL param — synchronous, runs first
    const urlToken = authBridgeService.extractFromUrlParam();
    if (urlToken) {
      tokenReceivedRef.current = true;
      handleValidate(urlToken);
      return;
    }

    // 2. On retry, re-validate with the previously received token
    if (pendingTokenRef.current) {
      tokenReceivedRef.current = true;
      handleValidate(pendingTokenRef.current);
      return;
    }

    // 3. JS bridge listener — stays active until token arrives or unmount
    const handleMessage = (event: MessageEvent) => {
      if (tokenReceivedRef.current) return;
      const bridgeToken = authBridgeService.extractFromBridgeMessage(event);
      if (bridgeToken) {
        tokenReceivedRef.current = true;
        handleValidate(bridgeToken);
      }
    };
    window.addEventListener('message', handleMessage);

    // 4. Timeout — show tokenMissing if neither channel delivers within 5s
    const timeout = setTimeout(() => {
      if (!tokenReceivedRef.current) {
        setAuthError('tokenMissing');
      }
    }, TOKEN_WAIT_MS);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [retryCount, handleValidate]);
};

export default useAuthBridge;
