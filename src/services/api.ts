import { Report, User } from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || `فشل الطلب مع رمز الحالة ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  // Health Check
  public async checkHealth(): Promise<{ status: string; database: string } | null> {
    try {
      const res = await fetch(`${API_ORIGIN}/health`, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Auth Endpoints
  public auth = {
    login: async (email: string, password: string) => {
      const res = await this.request<{ success: boolean; data: { user: User; token: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      this.setToken(res.data.token);
      return res.data;
    },

    register: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
      bio?: string;
      phone?: string;
    }) => {
      const res = await this.request<{ success: boolean; data: { user: User; token: string } }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(userData),
        }
      );
      this.setToken(res.data.token);
      return res.data;
    },

    getMe: async () => {
      const res = await this.request<{ success: boolean; data: User }>('/auth/me', {
        method: 'GET',
      });
      return res.data;
    },

    updateProfile: async (updates: Partial<User>) => {
      const res = await this.request<{ success: boolean; data: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    },

    logout: () => {
      this.setToken(null);
    },
  };

  // Reports Endpoints
  public reports = {
    getAll: async (params?: {
      category?: string;
      status?: string;
      priority?: string;
      search?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.priority && params.priority !== 'all') query.set('priority', params.priority);
      if (params?.search) query.set('search', params.search);
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));

      const endpoint = `/reports${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await this.request<{ success: boolean; data: Report[]; pagination: any }>(endpoint);
      return res.data;
    },

    getById: async (id: string) => {
      const res = await this.request<{ success: boolean; data: Report }>(`/reports/${id}`);
      return res.data;
    },

    create: async (formData: FormData) => {
      const res = await this.request<{ success: boolean; message: string; data: Report }>(
        '/reports',
        {
          method: 'POST',
          body: formData,
        }
      );
      return res.data;
    },

    update: async (id: string, updates: Partial<Report>) => {
      const res = await this.request<{ success: boolean; data: Report }>(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    },

    adopt: async (id: string) => {
      const res = await this.request<{ success: boolean; message: string; data: Report }>(
        `/reports/${id}/adopt`,
        {
          method: 'POST',
        }
      );
      return res.data;
    },

    toggleUpvote: async (id: string) => {
      const res = await this.request<{ success: boolean; message: string; action: 'added' | 'removed' }>(
        `/reports/${id}/upvote`,
        {
          method: 'POST',
        }
      );
      return res;
    },

    delete: async (id: string) => {
      return await this.request<{ success: boolean; message: string }>(`/reports/${id}`, {
        method: 'DELETE',
      });
    },

    addComment: async (reportId: string, text: string) => {
      const res = await this.request<{ success: boolean; data: any }>(
        `/reports/${reportId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        }
      );
      return res.data;
    },

    deleteComment: async (reportId: string, commentId: string) => {
      return await this.request<{ success: boolean; message: string }>(
        `/reports/${reportId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );
    },
  };

  // Volunteers & Leaderboard
  public users = {
    getVolunteers: async (params?: { role?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.role) query.set('role', params.role);
      if (params?.search) query.set('search', params.search);

      const endpoint = `/users/volunteers${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await this.request<{ success: boolean; data: User[] }>(endpoint);
      return res.data;
    },

    getById: async (id: string) => {
      const res = await this.request<{ success: boolean; data: User }>(`/users/${id}`);
      return res.data;
    },

    delete: async (id: string) => {
      return await this.request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Stats
  public stats = {
    get: async () => {
      const res = await this.request<{
        success: boolean;
        data: {
          summary: any;
          categoriesCount: any[];
          weeklyStats: any[];
        };
      }>('/stats');
      return res.data;
    },
  };
}

export const api = new ApiClient();
