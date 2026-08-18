import { useState, useCallback } from 'react';
import api from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);

  const get = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const response = await api.get(url);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, get };
}
