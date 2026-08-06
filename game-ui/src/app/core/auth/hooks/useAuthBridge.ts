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
    async (token: string, fromStorage = false) => {
      pendingTokenRef.current = token;
      setLoading();
      try {
        await authBridgeService.validate(token);
        authBridgeService.saveToStorage(token);
        setTokenValidated(token);
      } catch (error) {
        if (fromStorage) {
          authBridgeService.clearFromStorage();
          pendingTokenRef.current = null;
        }
        setAuthError(authBridgeService.mapErrorToCode(error));
      }
    },
    [setLoading, setTokenValidated, setAuthError],
  );

  useEffect(() => {
    tokenReceivedRef.current = false;

    // 1. URL param — highest priority, overwrites storage
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

    // 3. localStorage — for subsequent WebView page loads without URL param
    const storedToken = authBridgeService.loadFromStorage();
    if (storedToken) {
      tokenReceivedRef.current = true;
      handleValidate(storedToken, true);
      return;
    }

    // 4. JS bridge — wait for mobile app to push token
    const handleMessage = (event: MessageEvent) => {
      if (tokenReceivedRef.current) return;
      const bridgeToken = authBridgeService.extractFromBridgeMessage(event);
      if (bridgeToken) {
        tokenReceivedRef.current = true;
        handleValidate(bridgeToken);
      }
    };
    window.addEventListener('message', handleMessage);

    // 5. Timeout — tokenMissing if nothing arrives within 5s
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
