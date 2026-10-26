import { alpha, Box, Card, CardContent, Typography } from '@mui/material';

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
				border: '2px solid',
				borderColor: (theme) =>
					alpha(
						theme.palette.primary.main,
						theme.palette.mode === 'dark' ? 0.34 : 0
					),
				transition: (theme) =>
					theme.transitions.create(['border-color', 'box-shadow'], {
						duration: theme.transitions.duration.shorter,
					}),
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
				'&:hover': {
					borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
					boxShadow: (theme) =>
						theme.palette.mode === 'dark'
							? `inset 0 1px 0 ${alpha(
									theme.palette.common.white,
									0.08
							  )}, 0 4px 10px ${alpha(
									theme.palette.common.black,
									0.35
							  )}, 0 18px 44px ${alpha(theme.palette.primary.main, 0.3)}`
							: `inset 0 1px 0 ${alpha(
									theme.palette.common.white,
									0.95
							  )}, 0 4px 10px ${alpha(
									theme.palette.primary.main,
									0.08
							  )}, 0 18px 44px ${alpha(theme.palette.primary.main, 0.22)}`,
				},
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
