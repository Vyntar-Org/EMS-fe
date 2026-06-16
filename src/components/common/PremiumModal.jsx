import React from 'react';
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
import { Close } from '@mui/icons-material';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

const StyledDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		borderRadius: '16px',
		backgroundColor: '#fff',
		color: '#595959',
		boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
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
}) => {
	return (
		<StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					fontWeight: 'bold',
					borderBottom: '1px solid rgba(0,0,0,0.1)',
					py: 1,
					pr: 1.5,
					gap: 1,
				}}
			>
				<Box width="calc(100% - 40px)">
					<ResponsiveTextWrapper
						fontWeight="bold"
						fontSize="16px"
						component="span"
						value={title}
					/>
				</Box>

				{onClose && (
					<IconButton
						aria-label="close"
						onClick={onClose}
						sx={{
							color: (theme) => theme.palette.grey[500],
						}}
					>
						<Close />
					</IconButton>
				)}
			</DialogTitle>
			<DialogContent
				sx={{
					'&.MuiDialogContent-root': {
						p: 2,
						pl: '24px',
					},
				}}
			>
				{children ? (
					children
				) : (
					<Box sx={{ textAlign: 'center', py: 0 }}>
						<Typography variant="body1">{content}</Typography>
					</Box>
				)}
			</DialogContent>
			{(cancelText || confirmText) && (
				<DialogActions
					sx={{
						justifyContent: 'end',
						py: 1,
						borderTop: '1px solid rgba(0,0,0,0.1)',
					}}
				>
					{cancelText && (
						<Button
							// size="small"
							disableElevation
							onClick={onClose}
							variant="outlined"
							sx={{
								px: 2,
								fontWeight: 'bold',
								color: '#000',
								borderRadius: '24px',
								borderColor: '#F5D547',
								'&:hover': {
									borderColor: '#e8c011',
								},
							}}
						>
							{cancelText}
						</Button>
					)}

					{confirmText && (
						<Button
							// size="small"
							disableElevation
							onClick={onConfirm}
							variant="contained"
							sx={{
								px: 2,
								fontWeight: 'bold',
								color: '#000',
								borderRadius: '24px',
								background: '#F5D547',
								'&:hover': {
									background: '#e8c011',
								},
							}}
						>
							{confirmText}
						</Button>
					)}
				</DialogActions>
			)}
		</StyledDialog>
	);
};

export default PremiumModal;
