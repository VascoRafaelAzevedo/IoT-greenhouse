import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || '';

export const loginService = {
  /**
   * Log in the user with email + password
   * Returns the auth token or throws error if invalid credentials
   */
  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      if (!response.data.token) {
        throw new Error('Invalid credentials or server error');
      }

      // Example: backend returns { token: "...", user: {...} }
      const { token, user } = response.data;

      // Save token locally (for authenticated requests)
      if (token) localStorage.setItem('authToken', token);

      // Store user.id in localStorage
      if (user?.id) localStorage.setItem('userId', user.id);

      return { token, user };
    } catch (err: any) {
      console.error('Login failed:', err);
      throw new Error(
        err.response?.data?.message || 'Invalid credentials or server error'
      );
    }
  },

  /**
   * Log out and clear local token + userId
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  },

  /**
   * Check if user is logged in (based on token)
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Attach auth token to axios for future authenticated API calls
   */
  attachAuthHeader() {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  async register(email: string, password: string, displayName?: string) {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      displayName,
    });
    const data = res.data;
    if (data.token) localStorage.setItem('authToken', data.token);
    if (data.user?.id) localStorage.setItem('userId', data.user.id);
    return data;
  },

  /**
   * Get the current logged-in user id
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  },
};
