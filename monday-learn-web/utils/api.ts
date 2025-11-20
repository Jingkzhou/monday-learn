const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.115:8000/api/v1';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestOptions = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/#/welcome';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Something went wrong');
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body: any, options?: RequestOptions) => {
        const isFormData = body instanceof URLSearchParams || body instanceof FormData;
        const headers = options?.headers || {};

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return request<T>(endpoint, {
            ...options,
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });
    },
    put: <T>(endpoint: string, body: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...options?.headers } }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
