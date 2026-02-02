import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthStateContext = createContext();

// Reducer to handle auth state
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload.user || null,
        userData: action.payload.userData || null
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        userData: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'INITIALIZE':
      return {
        ...state,
        isLoggedIn: action.payload.isLoggedIn,
        loading: false
      };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isLoggedIn: false,
    user: null,
    userData: null,
    loading: true
  });

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const initializeAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      dispatch({ type: 'INITIALIZE', payload: { isLoggedIn } });
    };

    initializeAuth();

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'isLoggedIn') {
        const isLoggedIn = e.newValue === 'true';
        dispatch({ type: 'INITIALIZE', payload: { isLoggedIn } });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = (userData = null, fullUserData = null) => {
    localStorage.setItem('isLoggedIn', 'true');
    dispatch({ type: 'LOGIN', payload: { user: userData, userData: fullUserData } });
  };

  // Logout function
  const logout = () => {
    // Clear specific auth items instead of all local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userData');
    localStorage.removeItem('fullUserData');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthStateContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthStateContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};