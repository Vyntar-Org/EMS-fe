import { Menu as MenuIcon, MenuOpen } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import SensorsIcon from '@mui/icons-material/Sensors';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
	AppBar,
	Toolbar,
	Box,
	Tabs,
	Tab,
	Typography,
	IconButton,
	Popover,
	Divider,
	MenuItem,
	ListItemIcon,
	Avatar,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApplications } from '../../contexts/ApplicationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeModeContext';
import { layoutBackgroundSx } from '../../helpers/layoutImages';
import { getPagePath } from '../../helpers/pageMapping.jsx';
import { APP_ICONS } from '../common/MachineCardBits';
import PremiumModal from '../common/PremiumModal';

const menuItemSx = {
	borderRadius: '10px',
	mx: 1,
	my: 0.25,
	py: 1,
	fontSize: '0.875rem',
	fontWeight: 500,
	transition: 'all 0.15s ease',
};

export const Header = ({
	setIsMobileOpen,
	isMobileOpen,
	setIsDesktopOpen,
	isDesktopOpen,
	handleAppChange,
}) => {
	const { user, logout } = useAuth();
	const { applications, selectedApp } = useApplications();
	const { mode, setMode } = useThemeMode();
	const navigate = useNavigate();
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

	const [anchorEl, setAnchorEl] = useState(null);
	const [logoutModalOpen, setLogoutModalOpen] = useState(false);

	const handleDrawerToggle = () => {
		if (isDesktop) {
			setIsDesktopOpen(!isDesktopOpen);
		} else {
			setIsMobileOpen(!isMobileOpen);
		}
	};

	const handleUserClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handlePopoverClose = () => {
		setAnchorEl(null);
	};

	const handleSettingsClick = () => {
		setAnchorEl(null);
		navigate(getPagePath('SETTINGS', selectedApp));
	};

	const handleLogoutClick = () => {
		setAnchorEl(null);
		setLogoutModalOpen(true);
	};

	const handleLogoutConfirm = () => {
		setLogoutModalOpen(false);
		logout();
		navigate('/login');
	};

	const open = Boolean(anchorEl);

	const LogoUrl = user?.branding?.logo || '';
	const userName = user?.tenant?.name || 'User';
	const userInitials = userName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0])
		.join('')
		.toUpperCase();

	const themeOptions = [
		{ value: 'light', label: 'Light theme', icon: <LightModeOutlinedIcon /> },
		{ value: 'dark', label: 'Dark theme', icon: <DarkModeOutlinedIcon /> },
	];

	const shouldShowLogo =
		(isDesktop && !isDesktopOpen) || (!isDesktop && !isMobileOpen);

	return (
		<>
			<AppBar
				position="sticky"
				sx={{
					backgroundColor: 'background.paper',
					color: 'text.primary',
					...layoutBackgroundSx('header', selectedApp, theme.palette.mode),
					boxShadow:
						theme.palette.mode === 'dark'
							? '0 2px 14px rgba(0,0,0,0.4)'
							: '0 2px 14px rgba(15, 35, 62, 0.08)',
					borderBottom: '1px solid',
					borderColor: 'divider',
					'& .MuiToolbar-root': {
						pr: 0.5,
						pl: { xs: 1, sm: 0.5 },
					},
				}}
			>
				<Toolbar>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							mr: 3,
						}}
					>
						{(!isDesktop || isDesktopOpen) && (
							<IconButton
								aria-label="open drawer"
								onClick={handleDrawerToggle}
								edge="start"
								disabled={!isDesktop && isMobileOpen}
								sx={{
									width: '44px',
									height: '44px',
									ml: 0.25,
									mr: 1,
									padding: '7px',
									borderRadius: '10px',
									// Sits on the navy wedge of the header artwork —
									// white/gold reads well there in both themes.
									color: isDesktop ? '#FFFFFF' : 'primary.main',
									backgroundColor: 'rgba(255,255,255,0.12)',
									border: '1px solid rgba(255,255,255,0.35)',
									boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
									transition: 'all 0.2s ease',
									'&:hover': {
										backgroundColor: 'rgba(255,255,255,0.22)',
										borderColor: 'rgba(245, 213, 71, 0.75)',
										color: 'secondary.main',
									},
									'&.Mui-disabled': {
										backgroundColor: 'rgba(255,255,255,0.08)',
										color: 'rgba(255,255,255,0.4)',
										borderColor: 'rgba(255,255,255,0.15)',
									},
								}}
							>
								{(isDesktop ? isDesktopOpen : isMobileOpen) ? (
									<MenuOpen sx={{ fontSize: 22 }} />
								) : (
									<MenuIcon sx={{ fontSize: 22 }} />
								)}
							</IconButton>
						)}

						{shouldShowLogo && (
							<Box
								component="img"
								src={LogoUrl}
								alt="Logo"
								onClick={() => navigate('/dashboard')}
								sx={{
									height: '44px',
									width: 'auto',
									maxWidth: '130px',
									objectFit: 'contain',
									cursor: 'pointer',
									p: '5px',
									borderRadius: '8px',
									bgcolor: '#fff',

									// 🟢 PREMIUM GOLDEN ACCENTS
									border: '1px solid rgba(245, 213, 71, 0.45)',
									boxShadow:
										'0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(245, 213, 71, 0.1)',

									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									'&:hover': {
										borderColor: '#F5D547',
										boxShadow:
											'0 8px 24px rgba(245, 213, 71, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)',
										transform: 'translateY(-1px)',
									},
								}}
							/>
						)}
					</Box>

					{/* Application Tabs */}
					{applications.length > 0 && (
						<Box
							sx={{
								flex: 1,
								display: { xs: 'none', sm: 'flex' },
								justifyContent: 'start',
							}}
						>
							<Tabs
								value={selectedApp}
								onChange={handleAppChange}
								variant="scrollable"
								scrollButtons="auto"
								sx={{
									width: '98%',
									height: 44,
									p: 0.5,
									borderRadius: '14px',
									backgroundColor: alpha(theme.palette.background.paper, 0.75),
									border: '1px solid',
									borderColor: 'divider',
									boxShadow:
										theme.palette.mode === 'dark'
											? '0 2px 10px rgba(0,0,0,0.35)'
											: '0 2px 10px rgba(15,35,62,0.08)',
									'& .MuiTabs-flexContainer': {
										alignItems: 'center',
									},
									'& .MuiTab-root': {
										textTransform: 'none',
										fontSize: '0.9rem',
										fontWeight: 600,
										color: 'text.primary',
										minHeight: 38,
										height: 38,
										borderRadius: '10px',
										mx: 0.25,
										px: 2.5,
										transition: 'all 0.25s ease',
										'& .app-tab-icon': {
											fontSize: 18,
											color: 'text.secondary',
											transition: 'color 0.25s ease',
										},
										'&:hover': {
											backgroundColor: alpha(theme.palette.primary.main, 0.06),
											'& .app-tab-icon': {
												color: 'primary.main',
											},
										},
										'&.Mui-selected': {
											color: 'primary.contrastText',
											background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
											fontWeight: 700,
											boxShadow: `0 4px 14px ${alpha(
												theme.palette.primary.main,
												0.4
											)}`,
											borderBottom: '3px solid',
											borderColor: 'secondary.main',
											'& .app-tab-icon': {
												color: 'secondary.main',
											},
										},
									},
									'& .MuiTabs-indicator': {
										display: 'none',
										// backgroundColor: 'secondary.main',
										// height: 3,
										// borderRadius: '3px',
										// bottom: 4,
									},
								}}
							>
								{applications.map((app) => {
									const AppIcon =
										APP_ICONS[app.code?.toUpperCase()] || SensorsIcon;
									return (
										<Tab
											key={app.code}
											label={
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 0.75,
													}}
												>
													<AppIcon className="app-tab-icon" />
													{app.name}
												</Box>
											}
											value={app.code}
										/>
									);
								})}
							</Tabs>
						</Box>
					)}

					{/* Premium user profile pill */}
					<Box
						onClick={handleUserClick}
						role="button"
						aria-label="Account menu"
						sx={{
							ml: 'auto',
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							pl: { xs: 0.5, sm: 1.25 },
							pr: { xs: 0.5, sm: 1 },
							py: 0.5,
							cursor: 'pointer',
							borderRadius: '999px',
							backgroundColor: alpha(theme.palette.background.paper, 0.8),
							border: '1px solid',
							borderColor: open
								? alpha(theme.palette.secondary.main, 0.7)
								: 'divider',
							boxShadow:
								theme.palette.mode === 'dark'
									? '0 2px 10px rgba(0,0,0,0.35)'
									: '0 2px 10px rgba(15, 35, 62, 0.08)',
							transition: 'all 0.25s ease',
							'&:hover': {
								borderColor: alpha(theme.palette.secondary.main, 0.7),
								boxShadow:
									theme.palette.mode === 'dark'
										? '0 4px 16px rgba(0,0,0,0.45)'
										: '0 4px 16px rgba(15, 35, 62, 0.14)',
							},
						}}
					>
						<Avatar
							sx={{
								width: 38,
								height: 38,
								fontSize: '0.9rem',
								fontWeight: 700,
								color: '#FFFFFF',
								background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
								boxShadow: `0 0 0 2px ${alpha(
									theme.palette.secondary.main,
									0.55
								)}`,
							}}
						>
							{userInitials || <AccountCircle />}
						</Avatar>
						<Box
							sx={{
								display: 'block',
								lineHeight: 1.2,
								minWidth: 0,
								maxWidth: { xs: 100, sm: 160 },
							}}
						>
							<Typography
								noWrap
								sx={{
									fontSize: { xs: '0.78rem', sm: '0.85rem' },
									fontWeight: 700,
									color: 'text.primary',
									lineHeight: 1.3,
								}}
							>
								{userName}
							</Typography>
							<Typography
								noWrap
								sx={{
									fontSize: '0.68rem',
									fontWeight: 500,
									color: 'text.secondary',
									lineHeight: 1.2,
									textTransform: 'uppercase',
									letterSpacing: '0.5px',
								}}
							>
								Welcome back
							</Typography>
						</Box>
						<ExpandMoreRoundedIcon
							sx={{
								display: 'block',
								fontSize: 20,
								color: 'text.secondary',
								transition: 'transform 0.25s ease',
								transform: open ? 'rotate(180deg)' : 'none',
							}}
						/>
					</Box>
				</Toolbar>
			</AppBar>

			{/* User Popover */}
			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handlePopoverClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				slotProps={{
					paper: {
						sx: {
							width: 250,
							mt: 1,
							borderRadius: '16px',
							overflow: 'hidden',
							border: '1px solid',
							borderColor: 'divider',
							boxShadow:
								mode === 'dark'
									? '0 12px 40px rgba(0,0,0,0.55)'
									: '0 12px 40px rgba(15, 35, 62, 0.18)',
							backgroundImage: 'none',
							bgcolor: 'background.paper',
						},
					},
				}}
			>
				{/* Gold accent strip */}
				<Box
					sx={{
						height: 4,
						background:
							'linear-gradient(90deg, #F5D547 0%, #E8C011 60%, transparent 100%)',
					}}
				/>

				<Box sx={{ py: 1 }}>
					<MenuItem disabled onClick={handleSettingsClick} sx={menuItemSx}>
						<ListItemIcon sx={{ color: 'text.secondary' }}>
							<SettingsOutlinedIcon fontSize="small" />
						</ListItemIcon>
						Settings
					</MenuItem>

					<Divider sx={{ my: 0.75 }} />

					<Typography
						sx={{
							px: 2,
							pb: 0.5,
							fontSize: '0.68rem',
							fontWeight: 700,
							letterSpacing: '1px',
							textTransform: 'uppercase',
							color: 'text.secondary',
						}}
					>
						Appearance
					</Typography>

					{themeOptions.map((option) => {
						const isSelected = mode === option.value;
						return (
							<MenuItem
								key={option.value}
								selected={isSelected}
								onClick={() => setMode(option.value)}
								sx={{
									...menuItemSx,
									'&.Mui-selected': {
										backgroundColor: alpha(theme.palette.secondary.main, 0.18),
										'&:hover': {
											backgroundColor: alpha(
												theme.palette.secondary.main,
												0.26
											),
										},
									},
								}}
							>
								<ListItemIcon
									sx={{
										color: isSelected ? 'primary.main' : 'text.secondary',
										'& svg': { fontSize: 20 },
									}}
								>
									{option.icon}
								</ListItemIcon>
								{option.label}
								{isSelected && (
									<CheckRoundedIcon
										sx={{ ml: 'auto', fontSize: 18, color: 'primary.main' }}
									/>
								)}
							</MenuItem>
						);
					})}

					<Divider sx={{ my: 0.75 }} />

					<MenuItem
						onClick={handleLogoutClick}
						sx={{
							...menuItemSx,
							color: 'error.main',
							fontWeight: 600,
							'&:hover': {
								backgroundColor: alpha(theme.palette.error.main, 0.08),
							},
						}}
					>
						<ListItemIcon sx={{ color: 'error.main' }}>
							<LogoutIcon fontSize="small" />
						</ListItemIcon>
						Logout
					</MenuItem>
				</Box>
			</Popover>

			{/* Logout Confirmation Modal */}
			<PremiumModal
				open={logoutModalOpen}
				onClose={() => setLogoutModalOpen(false)}
				title="Confirm Logout"
				content="Are you sure you want to logout?"
				onConfirm={handleLogoutConfirm}
				confirmText="Logout"
				cancelText="Cancel"
				type="logout"
			/>
		</>
	);
};
