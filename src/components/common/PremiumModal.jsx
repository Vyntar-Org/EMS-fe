import { Close, LogoutOutlined } from '@mui/icons-material';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { RADIUS } from '../../theme/colors';

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

const StyledDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		borderRadius: `${RADIUS.xl}px`,
		backgroundColor: theme.palette.background.paper,
		color: theme.palette.text.primary,
	},
}));

const PremiumModal = ({
	open,
	onClose,
	title,
	content,
	onConfirm,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	children,
	type = 'default',
	maxWidth,
}) => {
	const isLogout = type === 'logout';
	// Chart-heavy modal content (trend charts with legends/axes/tooltips)
	// reads cramped at the default 'sm' — callers can widen it, but logout's
	// small confirm dialog always stays 'xs' regardless.
	const resolvedMaxWidth = isLogout ? 'xs' : maxWidth || 'sm';
	const finalTitle = isLogout ? title || 'Confirm Logout' : title;
	const finalConfirmText = isLogout
		? confirmText === 'Confirm'
			? 'Logout'
			: confirmText
		: confirmText;

	// Callers commonly close a modal by nulling out the same state that
	// holds its (often chart-heavy) content, e.g.
	// `{modalDetails?.isOpen ? <ChartModalContent /> : null}`. That unmounts
	// the chart in the very same render as `open` flipping to false, so the
	// expensive ApexCharts teardown blocks the close click instead of
	// happening invisibly after the fade-out. Latching the last content
	// while `open` was true keeps it mounted through the exit transition;
	// `onExited` only then lets it go, once the dialog is already gone.
	const [renderedChildren, setRenderedChildren] = useState(children);
	useEffect(() => {
		if (open) {
			setRenderedChildren(children);
		}
	}, [open, children]);

	return (
		<StyledDialog
			open={open}
			onClose={onClose}
			maxWidth={resolvedMaxWidth}
			fullWidth
			transitionDuration={{ enter: 160, exit: 120 }}
			TransitionProps={{ onExited: () => setRenderedChildren(null) }}
		>
			<DialogTitle
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontWeight: 'bold',
					borderBottom: isLogout ? 'none' : '1px solid',
					borderColor: isLogout ? 'transparent' : 'divider',
					pt: isLogout ? 3 : 1.5,
					pb: 1,
					pr: 1.5,
					pl: isLogout ? 3 : 2.5,
					gap: 1,
				}}
			>
				<Box
					display="flex"
					alignItems="center"
					gap={1.5}
					width="calc(100% - 40px)"
				>
					{isLogout && (
						<LogoutOutlined sx={{ color: 'error.main', fontSize: '22px' }} />
					)}
					<Box sx={{ width: '100%' }}>
						<ResponsiveTextWrapper
							fontWeight="bold"
							fontSize={isLogout ? '18px' : '16px'}
							component="span"
							value={finalTitle}
						/>
					</Box>
				</Box>

				{onClose && (
					<IconButton
						aria-label="close"
						onClick={onClose}
						sx={{
							position: isLogout ? 'absolute' : 'static',
							right: isLogout ? 12 : 'auto',
							top: isLogout ? 12 : 'auto',
							color: 'text.secondary',
							'&:hover': { color: 'text.primary' },
						}}
					>
						<Close />
					</IconButton>
				)}
			</DialogTitle>
			<DialogContent
				sx={{
					'&.MuiDialogContent-root': {
						p: 3,
						pt: isLogout ? 1 : 2,
						pl: isLogout ? 3 : '24px',
					},
				}}
			>
				{renderedChildren ? (
					renderedChildren
				) : (
					<Box sx={{ textAlign: 'left', py: 0 }}>
						<Typography
							variant="body2"
							sx={{
								color: 'text.secondary',
								fontSize: '14px',
								lineHeight: 1.6,
							}}
						>
							{content ||
								(isLogout &&
									'Are you sure you want to log out of your session? You will need to re-enter your credentials to access your dashboard.')}
						</Typography>
					</Box>
				)}
			</DialogContent>
			{(cancelText || finalConfirmText) && (
				<DialogActions
					sx={{
						justifyContent: 'end',
						p: 2.5,
						pt: isLogout ? 1.5 : 1,
						borderTop: '1px solid',
						borderColor: 'divider',
						gap: 1.5,
					}}
				>
					{cancelText && (
						<Button
							disableElevation
							onClick={onClose}
							variant="text"
							sx={{
								px: 2.5,
								height: '40px',
								fontWeight: 600,
								color: 'text.secondary',
								textTransform: 'none',
								borderRadius: `${RADIUS.sm}px`,
								'&:hover': {
									backgroundColor: 'surface.muted',
									color: 'text.primary',
								},
							}}
						>
							{cancelText}
						</Button>
					)}

					{finalConfirmText && (
						<Button
							disableElevation
							onClick={onConfirm}
							variant="contained"
							sx={{
								px: 3,
								height: '40px',
								fontWeight: 600,
								textTransform: 'none',
								borderRadius: `${RADIUS.sm}px`,
								backgroundColor: isLogout ? 'error.main' : 'secondary.main',
								color: isLogout
									? 'primary.contrastText'
									: 'secondary.contrastText',
								'&:hover': {
									backgroundColor: isLogout
										? 'brand.dangerHover'
										: 'secondary.dark',
								},
							}}
						>
							{finalConfirmText}
						</Button>
					)}
				</DialogActions>
			)}
		</StyledDialog>
	);
};

export default PremiumModal;
