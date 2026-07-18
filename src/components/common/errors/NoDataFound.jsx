import { Box, Typography } from '@mui/material';

const NoDataFound = ({
	message = 'Nothing to show here yet — adjust your selections above',
	icon,
}) => {
	return (
		<Box
			width="100%"
			height="100%"
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			gap={0.5}
		>
			{icon || (
				<Box
					component="img"
					src="/assets/no-data.gif"
					alt="No data"
					sx={{
						width: 'min(160px, 60%)',
						maxHeight: '60%',
						objectFit: 'contain',
						borderRadius: '12px',
						// keep the gif readable on dark surfaces
						backgroundColor: (t) =>
							t.palette.mode === 'dark'
								? 'rgba(255,255,255,0.92)'
								: 'transparent',
						p: (t) => (t.palette.mode === 'dark' ? 0.5 : 0),
					}}
				/>
			)}
			<Typography
				textAlign="center"
				sx={{
					fontSize: '0.95rem',
					fontWeight: 700,
					color: 'text.secondary',
					letterSpacing: '0.3px',
				}}
			>
				{message}
			</Typography>
		</Box>
	);
};

export default NoDataFound;
