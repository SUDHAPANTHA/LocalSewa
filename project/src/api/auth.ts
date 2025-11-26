import api from './client';
import { AuthResponse } from '../types';

export const authApi = {
  userRegister: (data: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    api.post<AuthResponse>('/user-register', data),

  providerRegister: (data: { name: string; email: string; password: string; phone?: string; address?: string; localAreaSlug: string }) =>
    api.post<AuthResponse>('/provider-register', data),

  adminRegister: (data: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    api.post<AuthResponse>('/admin-register', data),

  userLogin: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/user-login', data),

  providerLogin: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/provider-login', data),

  adminLogin: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/admin-login', data),
};
