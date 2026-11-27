import { Box, CircularProgress } from '@mui/material';

export default function InlineControlStatus({ loading, message, children }) {
	return (
		<Box
			component="span"
			sx={{ position: 'relative', minWidth: 0, display: 'inline-block' }}
		>
			<Box component="span" sx={{ visibility: loading ? 'hidden' : 'visible' }}>
				{children}
			</Box>
			{loading && (
				<Box
					component="span"
					role="status"
					title={message}
					sx={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
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
					<Box
						component="span"
						sx={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{message}
					</Box>
				</Box>
			)}
		</Box>
	);
}
