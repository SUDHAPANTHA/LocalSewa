import { useEffect } from 'react';

interface NavigateProps {
  to: string;
}

export function Navigate({ to }: NavigateProps) {
  useEffect(() => {
    window.location.hash = to;
  }, [to]);

  return null;
}
