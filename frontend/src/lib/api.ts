// API base URL strategy:
// - VITE_API_URL=""   => relative URLs (Docker/Nginx or Vite proxy)
// - VITE_API_URL set   => explicit absolute base URL
// - VITE_API_URL unset => default to local backend for direct dev
const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = envApiUrl === undefined ? 'http://localhost:3000' : envApiUrl;

// Get session token from localStorage
function getSessionToken(): string | null {
    return localStorage.getItem('sessionToken');
}

// Set session token in localStorage
function setSessionToken(token: string): void {
    localStorage.setItem('sessionToken', token);
}

// Remove session token from localStorage
function removeSessionToken(): void {
    localStorage.removeItem('sessionToken');
}

// API request wrapper
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getSessionToken();

    const headers: Record<string, string> = {};

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    const hasBody = options.body !== undefined && options.body !== null;
    const hasExplicitContentType = Object.keys(headers).some(
        key => key.toLowerCase() === 'content-type'
    );

    if (hasBody && !hasExplicitContentType) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Auth API
export const auth = {
    register: async (data: {
        email: string;
        password: string;
        name: string;
        phone: string;
        location: string;
        role: 'farmer' | 'buyer';
        deliveryLocation?: string;
        latitude?: number;
        longitude?: number;
    }) => {
        const result = await apiRequest<{ user: any; sessionToken: string }>(
            '/api/auth/register',
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        );
        setSessionToken(result.sessionToken);
        return result.user;
    },

    login: async (email: string, password: string) => {
        const result = await apiRequest<{ user: any; sessionToken: string }>(
            '/api/auth/login',
            {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }
        );
        setSessionToken(result.sessionToken);
        return result.user;
    },

    logout: async () => {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        } finally {
            removeSessionToken();
        }
    },

    getCurrentUser: async () => {
        const result = await apiRequest<{ user: any }>('/api/auth/me');
        return result.user;
    },
};

// Products API
export const products = {
    getAll: async () => {
        return apiRequest<any[]>('/api/products');
    },

    getMy: async () => {
        return apiRequest<any[]>('/api/products/my');
    },

    getById: async (id: string) => {
        return apiRequest<any>(`/api/products/${id}`);
    },

    create: async (data: {
        cropName: string;
        price: number;
        quantity: number;
        location: string;
        image: string;
    }) => {
        return apiRequest<any>('/api/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: {
        cropName: string;
        price: number;
        quantity: number;
        location: string;
        image: string;
    }) => {
        return apiRequest<any>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ message: string }>(`/api/products/${id}`, {
            method: 'DELETE',
        });
    },
};

// Orders API
export const orders = {
    getAll: async () => {
        return apiRequest<any[]>('/api/orders');
    },

    create: async (data: {
        productId: string;
        quantity: number;
        deliveryMethod: 'buyer_pickup' | 'farmer_delivery' | 'local_transport';
        paymentMethod: 'upi' | 'bank_transfer' | 'cash_on_delivery';
    }) => {
        return apiRequest<any>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    accept: async (id: string) => {
        return apiRequest<any>(`/api/orders/${id}/accept`, {
            method: 'PUT',
        });
    },

    deliver: async (id: string) => {
        return apiRequest<any>(`/api/orders/${id}/deliver`, {
            method: 'PUT',
        });
    },

    reject: async (id: string) => {
        return apiRequest<any>(`/api/orders/${id}/reject`, {
            method: 'PUT',
        });
    },

    getDistance: async (productId: string) => {
        return apiRequest<{
            productId: string;
            distanceKm: number;
            etaMinutes: number | null;
            provider: 'ola' | 'haversine';
            routePoints?: Array<{ latitude: number; longitude: number }>;
            from: { latitude: number; longitude: number; label: string };
            to: { latitude: number; longitude: number; label: string };
        }>(`/api/orders/distance/${productId}`);
    },
};

// Reviews API
export const reviews = {
    create: async (data: {
        orderId: string;
        productId: string;
        rating: number;
        comment?: string;
    }) => {
        return apiRequest<any>('/api/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getByProduct: async (productId: string) => {
        return apiRequest<any[]>(`/api/reviews/product/${productId}`);
    },
};

// Users API
export const users = {
    getProfile: async () => {
        return apiRequest<any>('/api/users/profile');
    },

    updateProfile: async (data: {
        name: string;
        phone: string;
        location: string;
        deliveryLocation?: string;
        latitude?: number;
        longitude?: number;
    }) => {
        return apiRequest<any>('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    updateLocation: async (data: { latitude: number; longitude: number }) => {
        return apiRequest<{ message: string; latitude: number; longitude: number }>('/api/users/location', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// Help API
export const help = {
    createReport: async (data: {
        reportedUserId?: string;
        orderId?: string;
        category: 'scam' | 'payment_issue' | 'delivery_issue' | 'other';
        description: string;
    }) => {
        return apiRequest<any>('/api/help/reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getMyReports: async () => {
        return apiRequest<any[]>('/api/help/my-reports');
    },
};

// Admin API
export const admin = {
    getOverview: async () => {
        return apiRequest<any>('/api/admin/overview');
    },

    getUsers: async () => {
        return apiRequest<any[]>('/api/admin/users');
    },

    updateUserStatus: async (id: string, isActive: boolean) => {
        return apiRequest<any>(`/api/admin/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive }),
        });
    },

    updateUserRole: async (id: string, role: 'farmer' | 'buyer') => {
        return apiRequest<any>(`/api/admin/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    },

    getReports: async () => {
        return apiRequest<any[]>('/api/admin/reports');
    },

    resolveReport: async (id: string, adminNotes?: string) => {
        return apiRequest<any>(`/api/admin/reports/${id}/resolve`, {
            method: 'PUT',
            body: JSON.stringify({ adminNotes }),
        });
    },
};

export const api = {
    auth,
    products,
    orders,
    reviews,
    users,
    help,
    admin,
};
