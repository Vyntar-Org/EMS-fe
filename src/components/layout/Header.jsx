import { MenuOpen } from '@mui/icons-material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import {
	AppBar,
	Toolbar,
	Box,
	Tabs,
	Tab,
	IconButton,
	Popover,
	List,
	ListItem,
	ListItemText,
	Avatar,
	Button,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApplications } from '../../contexts/ApplicationContext';
import { useAuth } from '../../contexts/AuthContext';
import PremiumModal from '../common/PremiumModal';

export const Header = ({ setIsMobileOpen, isMobileOpen, handleAppChange }) => {
	const { user, logout } = useAuth();
	const { applications, selectedApp } = useApplications();
	const navigate = useNavigate();

	const [anchorEl, setAnchorEl] = useState(null);
	const [logoutModalOpen, setLogoutModalOpen] = useState(false);

	const handleUserClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handlePopoverClose = () => {
		setAnchorEl(null);
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

	return (
		<>
			<AppBar
				position="fixed"
				sx={{
					zIndex: (theme) => theme.zIndex.drawer + 1,
					backgroundColor: '#fff',
					color: '#fff',
					// boxShadow: "0 4px 20px rgba(112, 112, 112, 0.2)",
					boxShadow: 'none',
					borderBottom: '1px solid rgba(0,0,0,0.08)',
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
						<IconButton
							sx={{
								display: { xs: 'flex', sm: 'none' },
								backgroundColor: 'primary.200',
								color: 'primary.main',
								borderRadius: '10px',
								padding: '6px',
								border: '1px solid',
								borderColor: 'primary.100',
								'&:hover': {
									backgroundColor: 'primary.100',
								},
								'&.Mui-disabled': {
									backgroundColor: 'action.disabledBackground',
									color: 'action.disabled',
								},
								mr: 1,
							}}
							disabled={isMobileOpen}
							color="primary"
							onClick={() => setIsMobileOpen(!isMobileOpen)}
						>
							<MenuOpen />
						</IconButton>
						{/* <img
							src="/assets/vyntar-logo-full.png"
							alt="Vyntar Logo"
							style={{ height: '40px', width: 'auto' }}
						/> */}

						<Box
							component="img"
							src={LogoUrl}
							alt="Vyntar Logo"
							onClick={() => navigate('/dashboard')}
							sx={{
								height: '50px',
								width: 'auto',
								maxWidth: '140px',
								objectFit: 'contain',
								cursor: 'pointer',
								display: 'block',
								p: '6px',
								borderRadius: '8px',
								border: '1px solid',
								borderColor: 'divider',
								bgcolor: '#fff',
								transition: 'all 0.2s ease',
								'&:hover': {
									borderColor: 'primary.main',
									boxShadow: '0 0 0 3px rgba(1, 86, 166, 0.1)',
								},
							}}
						/>
					</Box>

					{/* Application Tabs */}
					{applications.length > 0 && (
						<Box
							sx={{
								borderBottom: 1,
								borderColor: 'rgba(255,255,255,0.2)',
								flex: 1,
								display: { xs: 'none', sm: 'flex' },
								justifyContent: 'end',
							}}
						>
							<Tabs
								value={selectedApp}
								onChange={handleAppChange}
								variant="scrollable"
								scrollButtons="auto"
								// sx={{
								//   "& .MuiTab-root": {
								//     textTransform: "none",
								//     fontSize: "0.95rem",
								//     fontWeight: 600,
								//     color: "#0156A6",
								//     "&.Mui-selected": {
								//       color: "#CCC751",
								//       fontWeight: "bold",
								//     },
								//   },
								//   "& .MuiTabs-indicator": {
								//     backgroundColor: "#CCC751",
								//   },
								// }}
								sx={{
									'& .MuiTab-root': {
										textTransform: 'none',
										fontSize: '0.95rem',

										color: '#0156A6',
										minHeight: '48px',
										transition: 'all 0.3s ease',
										'&.Mui-selected': {
											color: '#0156A6',
											fontWeight: 700,
										},
									},
									'& .MuiTabs-indicator': {
										backgroundColor: 'rgb(245, 213, 71)',
										height: 3,
										borderRadius: '3px 3px 0 0',
									},
								}}
							>
								{applications.map((app) => (
									<Tab
										// sx={{
										//   "&.Mui-selected": {
										//     background: "#f1ea182c",
										//   },
										// }}
										key={app.code}
										label={
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												{app.name}
											</Box>
										}
										value={app.code}
									/>
								))}
							</Tabs>
						</Box>
					)}

					{/* User Icon */}
					<Box sx={{ ml: 'auto' }}>
						<IconButton onClick={handleUserClick} sx={{ color: '#fff' }}>
							<Avatar sx={{ bgcolor: '#0156A6' }}>
								<AccountCircle />
							</Avatar>
						</IconButton>
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
				sx={{
					'& .MuiPopover-paper': {
						borderRadius: '12px',
						boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
						overflow: 'hidden',
					},
				}}
			>
				<List sx={{ width: 200, pb: 0 }}>
					<ListItem>
						<ListItemText
							primary={`Welcome, ${user?.tenant?.name || 'User'}`}
							primaryTypographyProps={{
								fontWeight: 700,
								textAlign: 'center',
								fontSize: '14px',
								color: 'text.secondary',
							}}
						/>
					</ListItem>
				</List>

				<Box sx={{ p: 2, pt: 1 }}>
					<Button
						disableElevation
						size="small"
						fullWidth
						variant="contained"
						startIcon={<LogoutIcon />}
						onClick={handleLogoutClick}
						sx={{
							backgroundColor: '#d32f2f',
							color: '#fff',
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: '8px',
							'&:hover': {
								backgroundColor: '#b71c1c',
							},
						}}
					>
						Logout
					</Button>
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
