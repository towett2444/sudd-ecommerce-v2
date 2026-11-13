import { createContext, useCallback, useEffect, useState } from 'react';

import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [userLoading, setUserLoading] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // get currently logged-in user
  const getUser = useCallback(async () => {
    setUserLoading(true);
    try {
      const data = await getMe();

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // register
  const register = async (formData) => {
    setAuthLoading(true);

    try {
      const data = await registerUser(formData);

      if (data.success) {
        setUser(data.user);
      }

      return {
        success: data.success,
        message: data.message,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.',
      };
    } finally {
      setAuthLoading(false);
    }
  };

  // login
  const login = async (formData) => {
    setAuthLoading(true);

    try {
      const data = await loginUser(formData);

      if (data.success) {
        setUser(data.user);
      }

      return {
        success: data.success,
        message: data.message,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed.',
      };
    } finally {
      setAuthLoading(false);
    }
  };

  // logout
  const logout = async () => {
    setLogoutLoading(true);

    try {
      const data = await logoutUser();

      if (data.success) {
        setUser(null);
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed.',
      };
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, [getUser]);

  const value = {
    user,
    setUser,

    userLoading,
    authLoading,
    logoutLoading,

    getUser,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
