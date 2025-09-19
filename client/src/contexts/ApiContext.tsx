import React, { createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ApiContextType {
  api: any;
  get: <T = any>(url: string, config?: any) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  patch: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  delete: <T = any>(url: string, config?: any) => Promise<T>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api/v1',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
              toast.error('Session expired. Please log in again.');
              window.location.href = '/login';
            }
            break;
          case 403:
            toast.error('Access denied. You do not have permission to perform this action.');
            break;
          case 404:
            toast.error('Resource not found.');
            break;
          case 429:
            toast.error('Too many requests. Please try again later.');
            break;
          case 500:
            toast.error('Server error. Please try again later.');
            break;
          default:
            const message = data?.error?.message || data?.message || 'An error occurred';
            toast.error(message);
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred.');
      }
      
      return Promise.reject(error);
    }
  );

  const get = async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await api.get(url, config);
    return response.data as T;
  };

  const post = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.post(url, data, config);
    return response.data as T;
  };

  const put = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.put(url, data, config);
    return response.data as T;
  };

  const patch = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.patch(url, data, config);
    return response.data as T;
  };

  const deleteRequest = async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await api.delete(url, config);
    return response.data as T;
  };

  const value: ApiContextType = {
    api,
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
