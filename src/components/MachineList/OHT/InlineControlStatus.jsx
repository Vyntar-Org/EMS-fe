import { Box, CircularProgress } from '@mui/material';

export default function InlineControlStatus({
	loading,
	message,
	text,
	children,
}) {
	return (
		<Box
			component="span"
			sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
		>
			{children}
			{loading && (
				<Box
					component="span"
					role="status"
					aria-label={message}
					title={message}
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.5,
						color: 'info.main',
						fontSize: '0.65rem',
					}}
				>
					<CircularProgress
						size={12}
						color="info"
						aria-hidden="true"
						sx={{
							flexShrink: 0,
							'@media (prefers-reduced-motion: reduce)': {
								animation: 'none',
								'& circle': { animation: 'none' },
							},
						}}
					/>
					{text}
				</Box>
			)}
		</Box>
	);
}
