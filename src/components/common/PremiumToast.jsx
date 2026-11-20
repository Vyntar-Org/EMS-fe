import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { styled, lighten } from '@mui/material/styles';

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
	const [toast, setToast] = useState({
		open: false,
		message: '',
		severity: 'info',
	});

	const showToast = (message, severity = 'info') => {
		setToast({ open: true, message, severity });
	};

	const hideToast = () => {
		setToast({ ...toast, open: false });
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<Snackbar
				open={toast.open}
				autoHideDuration={4000}
				onClose={hideToast}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<StyledAlert
					onClose={hideToast}
					severity={toast.severity}
					variant="filled"
				>
					{toast.message}
				</StyledAlert>
			</Snackbar>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within ToastProvider');
	}
	return context;
};
