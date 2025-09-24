import { useState, useEffect } from 'react';
import { apiService } from '../services/api.ts';

export interface TimeSpentData {
  topic: string;
  seconds: number;
  percentage: number;
  minutes: string;
}

export interface ChatPercentageData {
  [key: string]: number;
}

export interface ChatClassificationData {
  label: string;
  count: number;
  percentage: number;
}

export interface DisplayChatData {
  id: string;
  message: string;
  timestamp: string;
  // Add other fields as needed
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch?: () => Promise<void>;
}

export const useTimeSpentData = (): UseQueryResult<TimeSpentData[]> => {
  const [data, setData] = useState<TimeSpentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getTimeSpentPerTopic();
      
      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid data format received from server');
      }
      
      const transformedData = result.map((item: any) => ({
        topic: item.topic,
        seconds: item.seconds,
        percentage: item.percentage,
        minutes: (item.seconds / 60).toFixed(1)
      }));
      
      setData(transformedData);
    } catch (err) {
      console.error('Error in useTimeSpentData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load time spent data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

export const useChatPercentageData = (): UseQueryResult<ChatPercentageData> => {
  const [data, setData] = useState<ChatPercentageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getPercentageChatHistory();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat percentage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

export const useChatClassificationData = (): UseQueryResult<ChatClassificationData[]> => {
  const [data, setData] = useState<ChatClassificationData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getClassifyChatHistory();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat classification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

export const useDisplayChatData = (): UseQueryResult<DisplayChatData[]> => {
  const [data, setData] = useState<DisplayChatData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getDisplayChatHistory();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
