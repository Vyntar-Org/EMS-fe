import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
	Box,
	Button,
	Typography,
	IconButton,
	InputAdornment,
	CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { CustomInput } from '../../components/common/CustomInput';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND, LIGHT, DARK } from '../../theme/colors';

// Mode-aware surface tokens so the card matches the day/night background.
// Glass card: night uses the deep-navy glass + cyan glow; day mirrors it
// with a light glass tinted from the LIGHT palette.
const getCardTokens = (isDay) =>
	isDay
		? {
				cardBg: 'rgba(199, 204, 212, 0.32)',
				cardBorder: 'rgba(0, 51, 102, 0.18)',
				cardShadow: `
					0 28px 80px rgba(0, 51, 102, 0.22),
					0 0 45px rgba(0, 51, 102, 0.10),
					inset 0 1px 0 rgba(255, 255, 255, 0.75)
				`,
				heading: LIGHT.text.primary,
				subText: LIGHT.text.secondary,
				inputBg: LIGHT.surface.muted,
				inputBgFocus: '#FFFFFF',
				inputText: LIGHT.text.primary,
				inputBorder: LIGHT.divider,
				inputBorderHover: BRAND.navySoft,
				iconColor: LIGHT.text.secondary,
				focusRing: BRAND.navy,
				linkColor: LIGHT.text.secondary,
				linkHover: BRAND.navy,
				accentBar: `linear-gradient(90deg, ${BRAND.navy} 0%, ${LIGHT.primary.light} 50%, ${BRAND.navy} 100%)`,
				btnBg: `linear-gradient(180deg, ${LIGHT.primary.light} 0%, ${BRAND.navy} 55%, ${BRAND.navyHover} 100%)`,
				btnBgHover: `linear-gradient(180deg, ${BRAND.navy} 0%, ${BRAND.navyHover} 100%)`,
				btnText: '#FFFFFF',
				btnShadow: '0 8px 20px -6px rgba(0, 51, 102, 0.55)',
				btnShadowHover: '0 10px 24px -6px rgba(0, 51, 102, 0.65)',
				btnDisabledBg: BRAND.navySoft,
				btnDisabledText: 'rgba(255, 255, 255, 0.7)',
		  }
		: {
				cardBg: 'rgba(3, 18, 43, 0.58)',
				cardBorder: 'rgba(56, 189, 248, 0.28)',
				cardShadow: `
					0 28px 80px rgba(0, 0, 0, 0.45),
					0 0 45px rgba(14, 165, 233, 0.18),
					inset 0 1px 0 rgba(255, 255, 255, 0.12)
				`,
				heading: DARK.text.primary,
				subText: DARK.text.secondary,
				inputBg: 'rgba(24, 34, 56, 0.65)',
				inputBgFocus: 'rgba(26, 36, 64, 0.85)',
				inputText: DARK.text.primary,
				inputBorder: 'rgba(56, 189, 248, 0.18)',
				inputBorderHover: 'rgba(56, 189, 248, 0.45)',
				iconColor: DARK.text.secondary,
				focusRing: 'rgba(56, 189, 248, 0.75)',
				linkColor: DARK.text.secondary,
				linkHover: BRAND.gold,
				accentBar: `linear-gradient(90deg, ${BRAND.gold} 0%, ${BRAND.goldMuted} 50%, ${BRAND.gold} 100%)`,
				btnBg: `linear-gradient(180deg, #F9E27E 0%, ${BRAND.gold} 45%, ${BRAND.goldMuted} 100%)`,
				btnBgHover: `linear-gradient(180deg, ${BRAND.gold} 0%, ${BRAND.goldHover} 100%)`,
				btnText: '#1A1F36',
				btnShadow: '0 8px 20px -6px rgba(232, 192, 17, 0.55)',
				btnShadowHover: '0 10px 24px -6px rgba(232, 192, 17, 0.65)',
				btnDisabledBg: BRAND.goldDisabled,
				btnDisabledText: 'rgba(26, 31, 54, 0.6)',
		  };

const Login = () => {
	const [showPassword, setShowPassword] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const { isDay = true } = useOutletContext() || {};
	const t = getCardTokens(isDay);

	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '14px',
			backgroundColor: t.inputBg,
			color: t.inputText,
			transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
			'& fieldset': {
				borderColor: t.inputBorder,
			},
			'&:hover fieldset': {
				borderColor: t.inputBorderHover,
			},
			'&.Mui-focused': {
				backgroundColor: t.inputBgFocus,
				boxShadow: `0 0 0 3px ${
					isDay ? 'rgba(0, 51, 102, 0.12)' : 'rgba(56, 189, 248, 0.22)'
				}`,
				'& fieldset': {
					borderColor: t.focusRing,
					borderWidth: '1.5px',
				},
			},
			'& input::placeholder': {
				color: t.subText,
				opacity: 1,
			},
			'& input:-webkit-autofill': {
				WebkitBoxShadow: `0 0 0 100px ${isDay ? '#FFFFFF' : '#1A2440'} inset`,
				WebkitTextFillColor: t.inputText,
				borderRadius: '14px',
			},
		},
	};

	const formik = useFormik({
		initialValues: {
			username: '',
			password: '',
		},
		validate: (values) => {
			const errors = {};
			if (!values.username) {
				errors.username = 'Username is required';
			}
			if (!values.password) {
				errors.password = 'Password is required';
			} else if (values.password.length < 6) {
				errors.password = 'Password must be at least 6 characters';
			}
			return errors;
		},
		onSubmit: async (values, { setStatus, setSubmitting }) => {
			try {
				await login(values.username, values.password);
				navigate('/');
			} catch (error) {
				setStatus(
					error.message || 'Login failed. Please check your credentials.'
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<Box
			sx={{
				background: t.cardBg,
				border: '1px solid',
				borderColor: t.cardBorder,
				backdropFilter: 'blur(24px)',
				WebkitBackdropFilter: 'blur(24px)',
				borderRadius: '24px',
				boxShadow: t.cardShadow,
				overflow: 'hidden',
				textAlign: 'center',
			}}
		>
			{/* Brand accent strip — navy by day, gold by night */}
			<Box
				sx={{
					height: '5px',
					background: t.accentBar,
				}}
			/>

			<Box sx={{ p: { xs: 3, sm: 4.5 } }}>
				{/* Logo */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						mb: 2.5,
						...(isDay
							? {}
							: {
									// Lift the logo on the dark card
									backgroundColor: '#FFFFFF',
									borderRadius: '16px',
									py: 1.5,
									px: 3,
									width: 'fit-content',
									mx: 'auto',
							  }),
					}}
				>
					<img
						src="/assets/vyntar-logo-full.png"
						alt="Vyntar Logo"
						style={{ height: 'clamp(42px, 8vw, 56px)', width: 'auto' }}
					/>
				</Box>

				<Typography
					variant="h5"
					sx={{
						fontWeight: 700,
						color: t.heading,
						letterSpacing: '-0.02em',
						fontSize: { xs: '1.35rem', sm: '1.5rem' },
					}}
				>
					Welcome back
				</Typography>
				<Typography variant="body2" sx={{ color: t.subText, mt: 0.5, mb: 3.5 }}>
					Sign in to access your dashboards
				</Typography>

				<form onSubmit={formik.handleSubmit}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<CustomInput
							name="username"
							placeholder="Username"
							value={formik.values.username}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.username && formik.errors.username}
							helperText={formik.touched.username && formik.errors.username}
							sx={inputSx}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PersonOutlineIcon sx={{ color: t.iconColor }} />
									</InputAdornment>
								),
							}}
						/>

						<CustomInput
							name="password"
							placeholder="Password"
							type={showPassword ? 'text' : 'password'}
							value={formik.values.password}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							error={formik.touched.password && formik.errors.password}
							helperText={formik.touched.password && formik.errors.password}
							sx={inputSx}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LockOutlinedIcon sx={{ color: t.iconColor }} />
									</InputAdornment>
								),
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={() => setShowPassword(!showPassword)}
											edge="end"
											sx={{ color: t.iconColor }}
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>

						<Button
							disableElevation
							type="submit"
							variant="contained"
							fullWidth
							disabled={formik.isSubmitting}
							sx={{
								height: '52px',
								mt: 1.5,
								fontWeight: 700,
								fontSize: '0.95rem',
								letterSpacing: '0.04em',
								color: t.btnText,
								borderRadius: '14px',
								background: t.btnBg,
								boxShadow: t.btnShadow,
								transition:
									'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
								'&:hover': {
									background: t.btnBgHover,
									boxShadow: t.btnShadowHover,
									transform: 'translateY(-1px)',
								},
								'&:active': {
									transform: 'translateY(0)',
								},
								'&.Mui-disabled': {
									background: t.btnDisabledBg,
									color: t.btnDisabledText,
								},
							}}
						>
							{formik.isSubmitting ? (
								<CircularProgress size={24} sx={{ color: t.btnText }} />
							) : (
								'Sign In'
							)}
						</Button>
						{formik.status && (
							<Typography color="error" variant="body2" sx={{ mt: 1 }}>
								{formik.status}
							</Typography>
						)}

						{/* <Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								mt: 1.5,
							}}
						>
							<Link
								href="#"
								variant="body2"
								sx={{
									color: t.linkColor,
									textDecoration: 'none',
									fontWeight: 500,
									transition: 'color 0.15s ease',
									'&:hover': { color: t.linkHover },
								}}
							>
								Forgot Password?
							</Link>
							<Link
								href="#"
								variant="body2"
								sx={{
									color: t.linkColor,
									textDecoration: 'none',
									fontWeight: 500,
									transition: 'color 0.15s ease',
									'&:hover': { color: t.linkHover },
								}}
							>
								Sign Up
							</Link>
						</Box> */}
					</Box>
				</form>
			</Box>
		</Box>
	);
};

export default Login;
