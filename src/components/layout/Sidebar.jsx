import { Close } from '@mui/icons-material';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HistoryIcon from '@mui/icons-material/History';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import {
	Drawer,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Box,
	Typography,
	IconButton,
	MenuItem,
	Menu,
	Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useApplications } from '../../contexts/ApplicationContext';
import { useAuth } from '../../contexts/AuthContext';
import { layoutBackgroundSx } from '../../helpers/layoutImages';
import {
	getPagePath,
	pageDisplayInfo,
	getPageCodeFromPath,
} from '../../helpers/pageMapping.jsx';
import ResponsiveTextWrapper from '../common/ResponsiveTextWrapper.jsx';

const miniDrawerWidth = 70;
const expandedDrawerWidth = 210;

const widthTransition = 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)';

const iconMap = {
	DashboardIcon: <DashboardIcon />,
	ListIcon: <FormatListBulletedIcon />,
	DescriptionIcon: <DescriptionIcon />,
	HistoryIcon: <HistoryIcon />,
	BarChartIcon: <BarChartIcon />,
	SettingsIcon: <SettingsIcon />,
};

const MobileApplicationsSelectMenu = ({
	applications,
	selectedApp,
	handleAppChange,
}) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const isMenuOpen = Boolean(anchorEl);

	const handleMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleMobileSelect = (event, appCode) => {
		handleAppChange(event, appCode);
		handleMenuClose();
	};

	const currentApp =
		applications.find((app) => app.code === selectedApp) || applications[0];

	return (
		<>
			<Button
				id="premium-menu-button"
				aria-controls={isMenuOpen ? 'premium-menu' : undefined}
				aria-haspopup="true"
				aria-expanded={isMenuOpen ? 'true' : undefined}
				onClick={handleMenuOpen}
				endIcon={
					<span
						style={{
							fontSize: '0.75rem',
							transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s ease',
						}}
					>
						▼
					</span>
				}
				sx={{
					py: 0.5,

					textTransform: 'none',
					fontSize: '0.92rem',
					fontWeight: 700,
					color: '#FFFFFF',
					backgroundColor: 'rgba(255, 255, 255, 0.08)',
					borderRadius: '8px',
					border: '1px solid rgba(255, 255, 255, 0.25)',
					width: '100%',
					justifyContent: 'space-between',
					boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
					'&:hover': {
						backgroundColor: 'rgba(255, 255, 255, 0.15)',
					},
				}}
			>
				<Box
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}
				>
					<span
						style={{
							fontSize: '0.68rem',
							fontWeight: 500,
							opacity: 0.7,
							color: '#FFFFFF',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
						}}
					>
						Application
					</span>
					{currentApp?.name}
				</Box>
			</Button>

			<Menu
				id="premium-menu"
				anchorEl={anchorEl}
				open={isMenuOpen}
				onClose={handleMenuClose}
				MenuListProps={{
					'aria-labelledby': 'premium-menu-button',
				}}
				slotProps={{
					paper: {
						sx: {
							width: '70%',
							mt: 0.5,
							borderRadius: '14px',
							bgcolor: 'background.paper',
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: (t) =>
								t.palette.mode === 'dark'
									? '0px 10px 30px rgba(0, 0, 0, 0.5)'
									: '0px 10px 30px rgba(1, 86, 166, 0.12)',
						},
					},
				}}
			>
				{applications.map((app) => {
					const isSelected = selectedApp === app.code;
					return (
						<MenuItem
							key={app.code}
							selected={isSelected}
							onClick={(e) => handleMobileSelect(e, app.code)}
							sx={{
								py: 1.5,
								px: 2.5,
								mx: 0.5,
								my: 0.2,
								borderRadius: '8px',
								color: isSelected ? 'primary.main' : 'text.primary',

								transition: 'all 0.15s ease',

								'&.Mui-selected': {
									backgroundColor: 'rgba(245, 213, 71, 0.2)',
									color: 'primary.main',
									'&:hover': {
										backgroundColor: 'rgba(245, 213, 71, 0.3)',
									},
								},
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						>
							<ResponsiveTextWrapper
								fontSize="0.92rem"
								fontWeight={isSelected ? 700 : 500}
								value={app.name}
							/>
						</MenuItem>
					);
				})}
			</Menu>
		</>
	);
};

export const Sidebar = ({
	isMobileOpen,
	setIsMobileOpen,
	isDesktopOpen,
	handleAppChange,
	setIsDesktopOpen,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { getCurrentApp, selectedApp, applications } = useApplications();
	const { user } = useAuth();
	const sidebarBg = layoutBackgroundSx('sidebar', selectedApp);

	const fullLogoUrl = user?.branding?.logo || '/assets/vyntar-logo-full.png';
	const iconLogoUrl = '/assets/vyntar-logo-icon-removebg.png';

	const currentApp = getCurrentApp();
	const pages = currentApp?.pages || [];

	const currentPageCode = getPageCodeFromPath(location.pathname);

	const visiblePages = pages;

	const getPageDisplayName = (pageCode) => {
		const info = pageDisplayInfo[pageCode];
		if (info) {
			return info.name;
		}
		return pageCode
			?.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	};

	const getPageIcon = (pageCode) => {
		const info = pageDisplayInfo[pageCode];
		return info?.icon || 'DashboardIcon';
	};

	const handlePageClick = (pageCode) => {
		const path = getPagePath(pageCode, selectedApp);
		navigate(path);
		setIsMobileOpen(false);
	};

	const handleMobileClose = () => {
		if (setIsMobileOpen) {
			setIsMobileOpen(false);
		}
	};

	const renderSidebarHeader = (expanded) => (
		<Box
			sx={{
				display: expanded ? 'block' : 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: expanded ? 140 : 64,
				position: 'relative',

				flexShrink: 0,
				// Soft gold hairline instead of a hard border
				'&::after': {
					content: '""',
					position: 'absolute',
					left: '12%',
					right: '12%',
					bottom: expanded ? -8 : 0,
					height: '1px',
					background:
						'linear-gradient(90deg, transparent, rgba(245,213,71,0.55), transparent)',
				},
				...(expanded
					? {
							'&::after': {
								content: '""',
								position: 'absolute',
								bottom: 0,
								left: 0,
								right: 0,
								height: 54,
								borderRadius: '0 40px 0 0',
								backgroundColor: '#12233E',
							},
							bgcolor: '#fff',
							borderRadius: '0 20px 0 0',
					  }
					: {}),
			}}
		>
			{expanded ? (
				<Box
					component="img"
					src={fullLogoUrl}
					alt="Logo"
					onClick={() => navigate('/dashboard')}
					sx={{
						mt: 1,
						height: 70,
						width: '93%',
						objectFit: 'contain',
						cursor: 'pointer',
						ml: 1,
						// 					borderRadius: '0 20px',
						//         border: '1px solid #F5D547',
						//   boxShadow: '0 8px 24px rgba(245, 213, 71, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)',
					}}
				/>
			) : (
				<IconButton
					aria-label="open drawer"
					onClick={() => setIsDesktopOpen(true)}
					edge="start"
					sx={{
						mx: 'auto',
						borderRadius: '10px',
						color: '#FFFFFF',
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: 'rgba(255,255,255,0.22)',
							borderColor: 'rgba(245, 213, 71, 0.75)',
							color: 'secondary.main',
						},
					}}
				>
					<MenuIcon sx={{ fontSize: 30 }} />
				</IconButton>
			)}
		</Box>
	);

	const renderDrawerContent = (expanded, isMobile = false) => (
		<>
			<Box
				sx={{
					overflow: 'auto',
					flex: 1,
					minHeight: 0,
					mt: 1,
					px: expanded ? 1 : 0.5,
					bottom: 40,
					position: !isMobile && expanded ? 'relative' : 'unset',
				}}
			>
				<List disablePadding>
					{visiblePages.length > 0 ? (
						visiblePages.map((pageCode) => {
							const displayName = getPageDisplayName(pageCode);
							const iconName = getPageIcon(pageCode);
							const isActive = pageCode === currentPageCode;

							return (
								<ListItem
									button
									key={pageCode}
									onClick={() => handlePageClick(pageCode)}
									sx={{
										mb: 0.75,
										flexDirection: expanded ? 'row' : 'column',
										alignItems: 'center',
										borderRadius: '12px',
										justifyContent: expanded ? 'flex-start' : 'center',
										px: expanded ? 1.5 : 0,
										py: expanded ? 2 : 1.5,
										backgroundColor: isActive
											? 'rgba(255, 255, 255, 0.14)'
											: 'transparent',
										borderLeft: '3px solid',
										borderLeftColor: isActive
											? 'rgb(245, 213, 71)'
											: 'transparent',
										boxShadow: isActive
											? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
											: 'none',
										transition: 'all 0.2s ease',
										':hover': {
											backgroundColor: 'rgba(255,255,255,0.18)',
										},
									}}
								>
									<ListItemIcon
										sx={{
											color: isActive
												? 'rgb(245, 213, 71)'
												: 'rgba(255,255,255,0.85)',
											minWidth: 0,
											mr: expanded ? 1.5 : 0,
											transition: 'color 0.2s ease',
											'& svg': { fontSize: expanded ? 22 : 24 },
										}}
									>
										{iconMap[iconName] || <DashboardIcon />}
									</ListItemIcon>
									<ListItemText
										primary={<ResponsiveTextWrapper value={displayName} />}
										sx={{
											width: '100%',
											my: expanded ? 0 : 0.25,
											overflow: 'hidden',
											// Fade the label in slightly after the drawer width
											// settles so it never reflows mid-animation.
											opacity: 1,
											animation: 'sidebarLabelIn 0.4s ease',
											'@keyframes sidebarLabelIn': {
												'0%': { opacity: 0 },
												'45%': { opacity: 0 },
												'100%': { opacity: 1 },
											},
											'& .MuiTypography-root': {
												fontWeight: isActive ? 700 : 500,
												color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.9)',
												transition: 'color 0.2s ease',
												textAlign: expanded ? 'left' : 'center',
												fontSize: expanded ? '13px' : '9px',
												letterSpacing: expanded ? '0.2px' : 0,
												ml: expanded ? 0.5 : 0,
											},
										}}
										key={expanded ? 'expanded' : 'mini'}
									/>
								</ListItem>
							);
						})
					) : (
						<Typography
							variant="body2"
							sx={{
								color: 'rgba(255,255,255,0.7)',
								mt: 2,
								textAlign: 'center',
							}}
						>
							No pages available
						</Typography>
					)}
				</List>
			</Box>

			{/* Copyright + PDF-style collapse control pinned to the bottom */}
			<Box sx={{ mt: 'auto', p: 1, pb: isMobile ? 5 : 1, flexShrink: 0 }}>
				<Box sx={{ textAlign: 'center', mb: isMobile ? 0 : 1 }}>
					{expanded ? (
						<>
							<Typography
								variant="body2"
								sx={{ color: '#FFFFFF', fontWeight: 600 }}
							>
								© 2026 Vyntar
							</Typography>
							<Typography
								variant="caption"
								sx={{ color: 'rgba(255,255,255,0.7)' }}
							>
								All rights reserved
							</Typography>
						</>
					) : (
						<Typography variant="body2" sx={{ color: '#FFFFFF' }}>
							©
						</Typography>
					)}
				</Box>

				{!isMobile && (
					<Box
						onClick={() => setIsDesktopOpen(!isDesktopOpen)}
						role="button"
						aria-label={isDesktopOpen ? 'Collapse sidebar' : 'Expand sidebar'}
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: isDesktopOpen ? 0.75 : 0,
							py: 0.9,
							px: isDesktopOpen ? 1.5 : 0.5,
							cursor: 'pointer',
							borderRadius: '999px',
							border: '1px solid rgba(255,255,255,0.28)',
							backgroundColor: 'rgba(255,255,255,0.08)',
							color: '#FFFFFF',
							transition: 'all 0.2s ease',
							'&:hover': {
								backgroundColor: 'rgba(255,255,255,0.18)',
								borderColor: 'rgba(245,213,71,0.6)',
							},
						}}
					>
						<KeyboardDoubleArrowLeftIcon
							sx={{
								fontSize: 20,
								flexShrink: 0,
								transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
								transform: isDesktopOpen ? 'none' : 'rotate(180deg)',
							}}
						/>
						<Typography
							sx={{
								fontSize: '13px',
								fontWeight: 600,
								letterSpacing: '0.3px',
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								maxWidth: isDesktopOpen ? 80 : 0,
								opacity: isDesktopOpen ? 1 : 0,
								transition:
									'max-width 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease 0.1s',
							}}
						>
							Collapse
						</Typography>
					</Box>
				)}
			</Box>
		</>
	);

	return (
		<Box component="nav">
			<Drawer
				variant="temporary"
				open={isMobileOpen}
				onClose={handleMobileClose}
				ModalProps={{
					keepMounted: true,
				}}
				sx={{
					display: { xs: 'block', md: 'none' },
					zIndex: (theme) => theme.zIndex.drawer + 2,
					[`& .MuiDrawer-paper`]: {
						width: '95%',
						boxSizing: 'border-box',
						...sidebarBg,
						borderRight: '1px solid rgba(0,0,0,0.08)',
						boxShadow: '4px 0 12px rgba(0,0,0,0.05)',
					},
				}}
			>
				{/* Premium logo header */}
				{/* <Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						py: 2,
						position: 'relative',
						flexShrink: 0,
						'&::after': {
							content: '""',
							position: 'absolute',
							left: '12%',
							right: '12%',
							bottom: 0,
							height: '1px',
							background:
								'linear-gradient(90deg, transparent, rgba(245,213,71,0.55), transparent)',
						},
					}}
				>
					<Box
						component="img"
						src={fullLogoUrl}
						alt="Logo"
						onClick={() => {
							navigate('/dashboard');
							setIsMobileOpen(false);
						}}
						sx={{
							height: 56,
							maxWidth: 190,
							objectFit: 'contain',
							cursor: 'pointer',
							p: '8px',
							borderRadius: '14px',
							bgcolor: 'rgba(255,255,255,0.96)',
							boxShadow:
								'0 4px 18px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,213,71,0.35)',
							transition: 'all 0.25s ease',
							'&:active': {
								boxShadow:
									'0 6px 22px rgba(0,0,0,0.4), 0 0 0 2px rgba(245,213,71,0.55)',
							},
						}}
					/>
				</Box> */}

				<Box
					sx={{
						display: { xs: 'flex', md: 'none' },
						width: '100%',
						justifyContent: 'space-between',
						p: 1,
						borderBottom: '1px solid',
						borderColor: 'rgba(255,255,255,0.15)',
						alignItems: 'center',
						gap: 0.5,
					}}
				>
					<MobileApplicationsSelectMenu
						applications={applications}
						handleAppChange={handleAppChange}
						selectedApp={selectedApp}
					/>

					<IconButton
						sx={{ color: '#fff' }}
						onClick={() => setIsMobileOpen(false)}
					>
						<Close />
					</IconButton>
				</Box>
				{renderDrawerContent(true, true)}
			</Drawer>

			<Drawer
				variant="permanent"
				sx={{
					display: { xs: 'none', md: 'block' },
					flexShrink: 0,
					position: 'sticky',
					top: 0,
					height: '100vh',
					width: isDesktopOpen ? expandedDrawerWidth : miniDrawerWidth,
					transition: widthTransition,
					[`& .MuiDrawer-paper`]: {
						position: 'relative',
						height: '100%',
						width: isDesktopOpen ? expandedDrawerWidth : miniDrawerWidth,
						transition: widthTransition,
						overflowX: 'hidden',
						boxSizing: 'border-box',
						...sidebarBg,
						borderRight: '1px solid rgba(255,255,255,0.08)',
						boxShadow: 'none',
					},
				}}
			>
				{renderSidebarHeader(isDesktopOpen)}
				{renderDrawerContent(isDesktopOpen)}
			</Drawer>
		</Box>
	);
};
