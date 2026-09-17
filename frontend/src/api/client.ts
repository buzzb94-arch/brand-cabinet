const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      // Не авторизован - очищаем токен и редирект на login
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || `HTTP error ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Ошибка сети/сервера - НЕ редиректим
    throw new Error('Не удалось подключиться к серверу');
  }
}

// Auth
export const auth = {
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    referral_code?: string;
  }) => apiRequest<{ access_token: string; token_type: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Client
export const client = {
  getMe: () => apiRequest<any>('/me', { requiresAuth: true }),
  updateMe: (data: { name?: string; phone?: string }) =>
    apiRequest<any>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),
  getBonuses: () => apiRequest<any[]>('/me/bonuses', { requiresAuth: true }),
  getOrders: () => apiRequest<any[]>('/me/orders', { requiresAuth: true }),
  getReferralStats: () => apiRequest<any>('/me/referral', { requiresAuth: true }),
};

// Products
export const products = {
  getAll: (collection?: string) => {
    const params = collection ? `?collection=${encodeURIComponent(collection)}` : '';
    return apiRequest<any[]>(`/products${params}`);
  },
  getReviews: (productId: number) =>
    apiRequest<any[]>(`/products/${productId}/reviews`),
  createReview: (productId: number, data: FormData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.detail || 'Error creating review');
      }
      return response.json();
    });
  },
};

// Orders
export const orders = {
  getAll: () => apiRequest<any[]>('/me/orders', { requiresAuth: true }),
  create: (data: { product_id: number; quantity: number; comment?: string }) =>
    apiRequest<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    }),
};
