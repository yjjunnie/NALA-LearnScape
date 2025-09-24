interface ApiResponse<T> {
  data?: T;
  error?: string;
  detail?: string;
}

export interface TimeSpentData {
  topic: string;
  seconds: number;
  percentage?: number;
  minutes?: string;
}

export interface ChatPercentageData {
  total_messages: number;
  total_seconds: number;
}

export interface ChatClassificationData {
  label: string;
  count: number;
  percentage?: number;
}

export interface DisplayChatData {
  id: string;
  message: string;
  timestamp: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://127.0.0.1:8000/api';
  }

  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      console.log(`Fetching: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || response.statusText || 'Request failed';
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      const data: T = await response.json();
      console.log(`Data from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data from server';
      if (errorMessage.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the server. Please check your connection and try again.');
      }
      throw new Error(errorMessage);
    }
  }

  public async getTimeSpentPerTopic(): Promise<TimeSpentData[]> {
    return this.fetchData<TimeSpentData[]>('/time-spent-per-topic/');
  }

  public async getPercentageChatHistory(): Promise<ChatPercentageData> {
    return this.fetchData<ChatPercentageData>('/percentage-chat-history/');
  }

  public async getDisplayChatHistory(): Promise<DisplayChatData[]> {
    return this.fetchData<DisplayChatData[]>('/display-chat-history/');
  }

  public async getClassifyChatHistory(): Promise<ChatClassificationData[]> {
    return this.fetchData<ChatClassificationData[]>('/classify-chat-history/');
  }
}

export const apiService = new ApiService();
