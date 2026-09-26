import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyRegistration: (data) => api.post('/auth/verify-registration', data),
  resendRegistrationOtp: (data) => api.post('/auth/resend-registration-otp', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetOtp: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resendResetOtp: (data) => api.post('/auth/resend-reset-otp', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  requestOtp: (data) => api.post('/auth/request-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
};

export const applicationsApi = { list: (params) => api.get('/applications', { params }), get: (id) => api.get(`/applications/${id}`), create: (data) => api.post('/applications', data), update: (id, data) => api.put(`/applications/${id}`, data), remove: (id) => api.delete(`/applications/${id}`) };
export const companiesApi = { list: () => api.get('/companies'), create: (data) => api.post('/companies', data), update: (id, data) => api.put(`/companies/${id}`, data), remove: (id) => api.delete(`/companies/${id}`) };
export const interviewsApi = { list: () => api.get('/interviews'), get: (id) => api.get(`/interviews/${id}`), create: (data) => api.post('/interviews', data), update: (id, data) => api.put(`/interviews/${id}`, data), remove: (id) => api.delete(`/interviews/${id}`) };
export const dashboardApi = { stats: () => api.get('/dashboard/stats'), recent: () => api.get('/dashboard/recent') };

