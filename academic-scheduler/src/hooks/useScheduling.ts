import { useState } from 'react';
import { api } from '../lib/db-client';

export function useScheduling() {
  const [loading, setLoading] = useState(false);

  const generate = async (termId: string) => {
    setLoading(true);
    try {
      return await api.scheduling.generate(termId);
    } finally {
      setLoading(false);
    }
  };

  return { loading, generate };
}
