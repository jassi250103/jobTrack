import { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/services';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('jobtrack_token');
    setUser(null);
  }, []);

  const establish = useCallback(async (request, values) => {
    const response = await request(values);
    const payload = response?.data ?? response;
    if (payload?.token) {
      localStorage.setItem('jobtrack_token', payload.token);
      setUser(payload.user);
      return payload.user;
    }
    return payload?.user || null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jobtrack_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me().then((response) => setUser(response.data)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('jobtrack:unauthorized', logout);
    return () => window.removeEventListener('jobtrack:unauthorized', logout);
  }, [logout]);

  return <AuthContext.Provider value={{
    user,
    loading,
    login: (values) => establish(authApi.login, values),
    register: async (values) => {
      const response = await authApi.register(values);
      return response?.data ?? response;
    },
    verifyRegistration: (values) => establish(authApi.verifyRegistration, values),
    resendRegistrationOtp: async (values) => {
      const response = await authApi.resendRegistrationOtp(values);
      return response?.data ?? response;
    },
    googleLogin: (values) => establish(authApi.googleLogin, values),
    forgotPassword: async (values) => {
      const response = await authApi.forgotPassword(values);
      return response?.data ?? response;
    },
    verifyResetOtp: async (values) => {
      const response = await authApi.verifyResetOtp(values);
      return response?.data ?? response;
    },
    resetPassword: async (values) => {
      const response = await authApi.resetPassword(values);
      return response?.data ?? response;
    },
    resendResetOtp: async (values) => {
      const response = await authApi.resendResetOtp(values);
      return response?.data ?? response;
    },
    requestOtp: async (values) => {
      const response = await authApi.requestOtp(values);
      return response?.data ?? response;
    },
    verifyOtp: (values) => establish(authApi.verifyOtp, values),
    logout,
  }}>{children}</AuthContext.Provider>;
}

