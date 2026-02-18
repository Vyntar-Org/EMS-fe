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
    case 'UPDATE_USER_DATA':
      return {
        ...state,
        userData: action.payload
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
      
      // If user is logged in but we don't have user data, fetch it
      if (isLoggedIn) {
        const storedUserData = localStorage.getItem('fullUserData');
        if (!storedUserData) {
          // Try to fetch user data
          const fetchUserData = async () => {
            try {
              const loginApi = await import('../auth/LoginApi');
              const userDataResponse = await loginApi.default.getUserData();
              if (userDataResponse && userDataResponse.data) {
                localStorage.setItem('fullUserData', JSON.stringify(userDataResponse.data));
                dispatch({ type: 'UPDATE_USER_DATA', payload: userDataResponse.data });
              }
            } catch (error) {
              console.error('Error fetching user data during initialization:', error);
            }
          };
          
          fetchUserData();
        }
      }
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

  // Function to update user data
  const updateUserData = (userData) => {
    dispatch({ type: 'UPDATE_USER_DATA', payload: userData });
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
    <AuthStateContext.Provider value={{ ...state, login, logout, updateUserData }}>
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