import { Snackbar, Alert, CircularProgress } from '@mui/material';
import { styled, lighten } from '@mui/material/styles';
import {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
} from 'react';

const StyledAlert = styled(Alert)(({ theme, severity }) => {
	const severityColor = {
		success: theme.palette.success.main,
		error: theme.palette.error.main,
		warning: theme.palette.warning.main,
		info: theme.palette.primary.main,
	};
	const base = severityColor[severity] || theme.palette.primary.main;

	return {
		borderRadius: '12px',
		fontWeight: 'bold',
		boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
		'& .MuiAlert-icon': {
			fontSize: '1.5rem',
		},
		background: `linear-gradient(135deg, ${base}, ${lighten(base, 0.18)})`,
		color: theme.palette.getContrastText(base),
	};
});

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	// Existing two-argument calls still replace the default four-second toast.
	// Named notifications opt into independent, updateable loading lifecycles.
	const showToast = useCallback((message, severity = 'info', options = {}) => {
		const id = options.id ?? 'default';
		const next = {
			id,
			message,
			severity,
			loading: options.loading === true,
			duration: options.loading ? null : options.duration ?? 4000,
		};
		setToasts((previous) => {
			const index = previous.findIndex((item) => item.id === id);
			return index < 0
				? [...previous, next]
				: previous.map((item) => (item.id === id ? next : item));
		});
		return id;
	}, []);
	const dismissToast = useCallback((id = 'default') => {
		setToasts((previous) => previous.filter((item) => item.id !== id));
	}, []);
	const value = useMemo(
		() => ({ showToast, dismissToast }),
		[showToast, dismissToast]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			{toasts.map((toast, index) => (
				<Snackbar
					key={`${toast.id}:${toast.loading ? 'loading' : 'result'}`}
					open
					autoHideDuration={toast.duration}
					onClose={(_, reason) => {
						if (reason !== 'clickaway' && !toast.loading) {
							dismissToast(toast.id);
						}
					}}
					anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
					sx={{ top: { xs: 16 + index * 86, sm: 24 + index * 86 } }}
				>
					<StyledAlert
						onClose={toast.loading ? undefined : () => dismissToast(toast.id)}
						icon={
							toast.loading ? (
								<CircularProgress size={20} color="inherit" />
							) : undefined
						}
						severity={toast.severity}
						variant="filled"
					>
						{toast.message}
					</StyledAlert>
				</Snackbar>
			))}
		</ToastContext.Provider>
	);
};

// Existing public hook lives beside its provider for compatibility.
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within ToastProvider');
	}
	return context;
};
