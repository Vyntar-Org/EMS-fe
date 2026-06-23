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

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

const StyledDialog = styled(Dialog)(() => ({
	'& .MuiDialog-paper': {
		borderRadius: '16px',
		backgroundColor: '#fff',
		color: '#334155',
		boxShadow:
			'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
}) => {
	const isLogout = type === 'logout';
	const finalTitle = isLogout ? title || 'Confirm Logout' : title;
	const finalConfirmText = isLogout
		? confirmText === 'Confirm'
			? 'Logout'
			: confirmText
		: confirmText;

	return (
		<StyledDialog
			open={open}
			onClose={onClose}
			maxWidth={isLogout ? 'xs' : 'sm'}
			fullWidth
		>
			<DialogTitle
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontWeight: 'bold',
					borderBottom: isLogout ? 'none' : '1px solid rgba(0,0,0,0.08)',
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
						<LogoutOutlined sx={{ color: '#EF4444', fontSize: '22px' }} />
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
							color: '#94A3B8',
							'&:hover': { color: '#64748B' },
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
				{children ? (
					children
				) : (
					<Box sx={{ textAlign: 'left', py: 0 }}>
						<Typography
							variant="body2"
							sx={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}
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
						borderTop: isLogout ? 'none' : '1px solid rgba(0,0,0,0.08)',
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
								color: '#64748B',
								textTransform: 'none',
								borderRadius: '8px',
								'&:hover': {
									backgroundColor: '#F1F5F9',
									color: '#1E293B',
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
								borderRadius: '8px',
								background: isLogout ? '#EF4444' : '#F5D547',
								color: isLogout ? '#fff' : '#000',
								'&:hover': {
									background: isLogout ? '#DC2626' : '#e8c011',
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
