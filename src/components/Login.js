import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import loginApi from '../auth/LoginApi';
import { InputAdornment, IconButton } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };


  const handleLogin = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await loginApi.login(username, password);

      // Store user data in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);

      // Store additional user data from the response if available
      if (response.data?.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      } else if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }

      // Also store tokens that were saved in localStorage by the login API


      // Update auth context
      login({ username });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '102.6vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: "url('/login-background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Dark overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          // background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Glass Login Card */}
      <Paper
        elevation={0}
        sx={{
          width: 250,
          p: 5,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <img
            src="/Vyntax_Logo_PNG.png"
            alt="Vyntar Logo"
            style={{ width: '220px' }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin} autoComplete="on">
          {/* Username */}
          <TextField
            fullWidth
            placeholder="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#1f2933',
                borderRadius: '30px',
                color: '#fff',
                height: '40px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent', // Default border color (optional)
                },
              },
            }}
            sx={{
              mb: 2,
              // 1. Placeholder Styling
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
              // 2. Focus Border Styling
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4b5563', // Border color on hover
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc751', // Change this to your desired focus color
                  borderWidth: '1px',
                },
              },
              // 3. Autofill Fix (Prevents resizing and color flashing)
              '& input:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 1000px #1f2933 inset !important',
                WebkitTextFillColor: '#fff !important',
                caretColor: '#fff',
                transition: 'background-color 5000s ease-in-out 0s',
                height:'0px'
              },
            }}
          />

          {/* Password */}
          <TextField
            fullWidth
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    sx={{ color: '#9ca3af' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#1f2933',
                borderRadius: '30px',
                color: '#fff',
                height: '40px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                },
              },
            }}
            sx={{
             mb: 3,
              '& input::placeholder': { color: '#9ca3af', opacity: 1 },
              '& .MuiOutlinedInput-root': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4b5563',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc751', 
                  borderWidth: '1px',
                },
              },
              '& input:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 1000px #1f2933 inset !important',
                WebkitTextFillColor: '#fff !important',
                caretColor: '#fff',
                transition: 'background-color 5000s ease-in-out 0s',
                height:'0px'
              },
            }}
          />

          {/* Sign In Button */}
          <Button
            fullWidth
            type="submit"
            disabled={loading}
            sx={{
              background: '#f5d547',
              color: '#000',
              fontWeight: 700,
              py: 1.4,
              borderRadius: '30px',
              fontSize: '16px',
              '&:hover': {
                background: '#e6c93c',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#000' }} />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Footer Links */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 3,
            // color: '#e5e7eb',
            fontSize: '14px',
          }}
        >
          <Typography sx={{ cursor: 'pointer' }}>
            Forgot Password?
          </Typography>
          <Typography sx={{ cursor: 'pointer' }}>
            Sign Up
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

};

export default Login;
