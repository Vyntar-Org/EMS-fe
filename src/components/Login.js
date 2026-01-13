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
// import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
      
      // You can store additional user data from the response if needed
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      // Also store tokens that were saved in localStorage by the login API
      
      
      // Log the tokens for debugging
      console.log('Access Token:', localStorage.getItem('accessToken'));
      console.log('Refresh Token:', localStorage.getItem('refreshToken'));
      
      
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // background: 'linear-gradient(135deg, #014a92, #0156a6, #1a6fc4)',
      }}
    >
      {/* Glass Card */}
      <Paper
        elevation={0}
        sx={{
          width: 380,
          p: 4,
          borderRadius: 3,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.88)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <img
            src="/vyntar_new.png"
            alt="Vyntar Logo"
            style={{ width: '130px' }}
          />
        </Box>

        <Typography
          variant="h6"
          align="center"
          fontWeight={600}
          color="#0156a6"
          mb={1}
        >
          Welcome Back
        </Typography>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          mb={3}
        >
          Sign in to continue
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
        <TextField
          fullWidth
          label="Username"
          margin="normal"
          size="small"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #014a92, #0156a6)',
            fontWeight: 600,
            letterSpacing: '0.5px',
            '&:hover': {
              background: 'linear-gradient(135deg, #013d7a, #014a92)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #6c8fb5, #7ca0c4)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'LOGIN'}
        </Button>
        </form>

        <Typography
          variant="body2"
          align="center"
          color="#0156a6"
          mt={2}
          sx={{ cursor: 'pointer' }}
        >
        
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
