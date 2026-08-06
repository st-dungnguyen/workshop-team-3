import React, {
  createContext,
  Suspense,
  use,
  useEffect,
  useState,
} from 'react';

/*
 * Suspense renders component and hiding it with `display: none;` and show fallback.
 * Using Context and Provider for tracking.
 * If we need to do something when exactly component rendered,
 * please use the `useSuspended` hook.
 */
const SuspenseContext = createContext(false);

interface AppSuspenseProps {
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

interface FallbackProps {
  children?: React.ReactNode;
}

export const useSuspended = () => {
  return use(SuspenseContext);
};

// Create AppSuspense extend Suspense from React
const AppSuspense = ({
  fallback = null,
  children = null,
}: AppSuspenseProps) => {
  const [suspended, setSuspended] = useState(true);

  // Fallback component for tracking `suspensed` or `not`, something like trick :D
  const Fallback = ({ children }: FallbackProps) => {
    useEffect(() => {
      // In-suspense
      setSuspended(true);

      // When this component be destroyed, that mean Suspense is gone!
      return () => setSuspended(false);
    }, []);

    return children;
  };

  return (
    <Suspense fallback={<Fallback>{fallback}</Fallback>}>
      {/* Export `suspended` to children */}
      <SuspenseContext value={suspended}>{children}</SuspenseContext>
    </Suspense>
  );
};

export default AppSuspense;
