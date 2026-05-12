import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Link,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { CustomInput } from "../../components/common/CustomInput";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validate: (values) => {
      const errors = {};
      if (!values.username) {
        errors.username = "Username is required";
      }
      if (!values.password) {
        errors.password = "Password is required";
      } else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
      return errors;
    },
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        await login(values.username, values.password);
        navigate("/");
      } catch (error) {
        setStatus(
          error.message || "Login failed. Please check your credentials.",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box
      sx={{
        background: "rgba(255, 255, 255, 0.38)",
        backdropFilter: "blur(2px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: 4,
        p: 4,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        textAlign: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          borderRadius: 4,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
          }}
        >
          <img
            src="/assets/vyntar-logo-full.png"
            alt="Vyntar Logo"
            style={{ height: "60px", width: "auto" }}
          />
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <CustomInput
              name="username"
              placeholder="Username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && formik.errors.username}
              helperText={formik.touched.username && formik.errors.username}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: "#A0AAB4" }} />
                  </InputAdornment>
                ),
                style: {
                  color: "#FFFFFF",
                  backgroundColor: "#2A2D34",
                  borderRadius: "24px",
                },
              }}
            />

            <CustomInput
              name="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "#A0AAB4" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#A0AAB4" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                style: {
                  color: "#FFFFFF",
                  backgroundColor: "#2A2D34",
                  borderRadius: "24px",
                },
              }}
            />

            <Button
              disableElevation
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={formik.isSubmitting}
              sx={{
                height: "56px",
                mt: 2,
                py: 1.5,
                fontWeight: "bold",
                color: "#000",
                borderRadius: "24px",
              }}
            >
              SIGN IN
            </Button>
            {formik.status && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {formik.status}
              </Typography>
            )}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Link
                href="#"
                variant="body2"
                sx={{ color: "#1A202C", textDecoration: "none" }}
              >
                Forgot Password?
              </Link>
              <Link
                href="#"
                variant="body2"
                sx={{ color: "#1A202C", textDecoration: "none" }}
              >
                Sign Up
              </Link>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
