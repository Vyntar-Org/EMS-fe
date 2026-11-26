import { Close } from '@mui/icons-material';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
	Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		borderRadius: '16px',
		backgroundColor: theme.palette.background.paper,
		color: theme.palette.text.primary,
		boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
		margin: theme.spacing(2),
		width: `calc(100% - ${theme.spacing(4)})`,
	},
}));

/**
 * Dialog for forms and confirmations, styled to match PremiumModal.
 *
 * PremiumModal renders its children from a copy taken after the open
 * animation, so controlled inputs inside it lag a render behind (the cursor
 * jumps while typing), and its busy label is the logout one. This renders
 * children directly. The body is a <form>, so Enter submits and onSubmit runs
 * once per submit.
 */
const FormDialog = ({
	open,
	onClose,
	title,
	subtitle,
	children,
	onSubmit,
	submitLabel = 'Save',
	busyLabel = 'Saving…',
	cancelLabel = 'Cancel',
	tone = 'default', // 'default' | 'danger'
	busy = false,
	submitDisabled = false,
	maxWidth = 'sm',
}) => {
	const handleSubmit = (event) => {
		event.preventDefault();
		if (!busy && !submitDisabled) {
			onSubmit?.();
		}
	};

	const isDanger = tone === 'danger';

	return (
		<StyledDialog
			open={open}
			onClose={busy ? undefined : onClose}
			maxWidth={maxWidth}
			fullWidth
			TransitionComponent={Zoom}
			transitionDuration={{ enter: 220, exit: 160 }}
			PaperProps={{
				component: 'form',
				onSubmit: handleSubmit,
				noValidate: true,
			}}
		>
			<DialogTitle
				component="div"
				sx={{
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'space-between',
					gap: 1,
					borderBottom: '1px solid',
					borderColor: 'divider',
					py: 1.5,
					pl: 2.5,
					pr: 1.5,
				}}
			>
				<Box minWidth={0}>
					<Typography component="h2" fontWeight={700} fontSize="16px">
						{title}
					</Typography>
					{subtitle && (
						<Typography variant="body2" color="text.secondary" mt={0.25}>
							{subtitle}
						</Typography>
					)}
				</Box>
				<IconButton
					aria-label="Close"
					onClick={onClose}
					disabled={busy}
					size="small"
					sx={{ color: 'text.secondary', mt: -0.25 }}
				>
					<Close fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ '&.MuiDialogContent-root': { px: 2.5, py: 2 } }}>
				{children}
			</DialogContent>

			<DialogActions
				sx={{
					px: 2.5,
					py: 1.5,
					gap: 1,
					borderTop: '1px solid',
					borderColor: 'divider',
				}}
			>
				<Button
					onClick={onClose}
					disabled={busy}
					sx={{
						px: 2,
						height: 38,
						fontWeight: 600,
						textTransform: 'none',
						borderRadius: '8px',
						color: 'text.secondary',
						'&:hover': {
							backgroundColor: 'surface.muted',
							color: 'text.primary',
						},
					}}
				>
					{cancelLabel}
				</Button>
				<Button
					type="submit"
					variant="contained"
					disableElevation
					disabled={busy || submitDisabled}
					sx={{
						px: 2.5,
						height: 38,
						gap: 1,
						fontWeight: 600,
						textTransform: 'none',
						borderRadius: '8px',
						backgroundColor: isDanger ? 'error.main' : 'secondary.main',
						color: isDanger ? 'error.contrastText' : 'secondary.contrastText',
						'&:hover': {
							backgroundColor: isDanger ? 'error.dark' : 'secondary.dark',
						},
					}}
				>
					{busy && <CircularProgress size={16} thickness={5} color="inherit" />}
					{busy ? busyLabel : submitLabel}
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default FormDialog;
