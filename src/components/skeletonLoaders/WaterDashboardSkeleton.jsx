import { Grid, Skeleton } from '@mui/material';

const tile = (
	<Skeleton
		sx={{ borderRadius: '16px' }}
		animation="wave"
		variant="rounded"
		width="100%"
		height="100%"
	/>
);

const WaterDashboardSkeleton = () => {
	return (
		<>
			<Grid container spacing={1.5} height={{ xs: 'auto', sm: 230, md: 240 }}>
				<Grid item xs={12} sm={6} md={3} height={{ xs: 220 }}>
					{tile}
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ xs: 220 }}>
					{tile}
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ xs: 220 }}>
					{tile}
				</Grid>
				<Grid item xs={12} sm={6} md={3} height={{ xs: 220 }}>
					{tile}
				</Grid>
			</Grid>

			<Grid
				container
				spacing={1.5}
				sx={{ mt: 0 }}
				height={{ md: 'calc(100% - 240px)' }}
			>
				<Grid item xs={12} sm={12} md={3} height={{ md: '100%' }}>
					<Grid
						container
						rowGap={1.5}
						spacing={{ sm: 1.5, md: 0 }}
						height={{ md: '100%' }}
					>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							{tile}
						</Grid>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							{tile}
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12} md height={{ xs: 400, md: '100%' }}>
					{tile}
				</Grid>

				<Grid item xs={12} sm={12} md={3} height={{ md: '100%' }}>
					<Grid
						container
						rowGap={1.5}
						spacing={{ sm: 1.5, md: 0 }}
						height={{ md: '100%' }}
					>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							{tile}
						</Grid>
						<Grid item xs={12} sm={6} md={12} height={{ xs: 210, md: '50%' }}>
							{tile}
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
};

export default WaterDashboardSkeleton;
