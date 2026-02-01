// Centralized API client with error handling and response standardization

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cached?: boolean;
    requestId?: string;
  };
}

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { method = 'GET', body, headers = {}, cache } = options;

    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        cache,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.error || response.statusText,
            details: data,
          },
        };
      }

      return data;
    } catch (error) {
      console.error('[APIClient] Request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  async get<T>(endpoint: string, cache?: RequestCache): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', cache });
  }

  async post<T>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new APIClient();

// Helper functions for API responses
export function successResponse<T>(data: T, meta?: any): APIResponse<T> {
  return { success: true, data, meta };
}

export function errorResponse(code: string, message: string, details?: any): APIResponse<never> {
  return { success: false, error: { code, message, details } };
}
