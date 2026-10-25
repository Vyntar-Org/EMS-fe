import { Box, Card, CardContent, Typography } from '@mui/material';

function DashboardCard({
	title,
	children,
	titleIcon,
	className = '',
	sx = {},
}) {
	return (
		<Card
			className={className}
			elevation={0}
			sx={{
				height: '100%',
				bgcolor: 'background.paper',
				...sx,
				boxShadow: (theme) =>
					theme.palette.mode === 'dark'
						? `
            0 2px 6px rgba(0,0,0,0.35),
            0 10px 20px rgba(0,0,0,0.28),
            0 18px 40px rgba(0,0,0,0.18)
          `
						: `
            0 2px 6px rgba(15,23,42,0.05),
            0 10px 20px rgba(15,23,42,0.08),
            0 18px 40px rgba(15,23,42,0.10)
          `,
				// Clean subtle border to make the edges razor-sharp
				border: '1px solid',
				borderColor: (theme) =>
					theme.palette.mode === 'dark'
						? 'rgba(255, 255, 255, 0.05)'
						: 'rgba(15, 23, 42, 0.04)',
			}}
		>
			<CardContent
				sx={{
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					p: 2,
					'&:last-child': { pb: 2 },
				}}
			>
				{title && (
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
						{titleIcon && (
							<Box
								component="span"
								sx={{ display: 'flex', mr: 1, color: 'primary.main' }}
							>
								{titleIcon}
							</Box>
						)}
						<Typography
							variant="subtitle2"
							component="h3"
							sx={{ color: 'text.primary', fontWeight: 600 }}
						>
							{title}
						</Typography>
					</Box>
				)}
				<Box className="dash-card__body" sx={{ flex: 1, minHeight: 0 }}>
					{children}
				</Box>
			</CardContent>
		</Card>
	);
}

export default DashboardCard;
