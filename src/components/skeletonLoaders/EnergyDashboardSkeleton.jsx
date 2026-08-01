import { Grid, Skeleton } from '@mui/material';

const EnergyDashboardSkeleton = () => {
	return (
		<>
			<Grid
				container
				spacing={1.5}
				height={{ xs: '450px', sm: '350px', md: '230px' }}
			>
				<Grid item s={12} sm={4} md={2.2} height={{ md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} sm={8} md={3.2} height={{ md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} sm={4} md={2.3} height={{ md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} sm={4} md={2.3} height={{ md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} sm={4} md={2} height={{ md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
			</Grid>

			<Grid container spacing={1.5} sx={{ mt: 0 }} height={{ md: '100%' }}>
				<Grid item xs={12} sm={12} md={5.4} height={{ md: '100%' }}>
					<Grid container rowGap={1.5} height={{ md: 'calc(100% - 12px)' }}>
						<Grid item xs={12} sm={12} height={{ xs: 300, md: '50%' }}>
							<Skeleton
								sx={{ borderRadius: '16px' }}
								animation="wave"
								variant="rounded"
								width="100%"
								height="100%"
							/>
						</Grid>
						<Grid item xs={12} sm={12} height={{ xs: 300, md: '50%' }}>
							<Skeleton
								sx={{ borderRadius: '16px' }}
								animation="wave"
								variant="rounded"
								width="100%"
								height="100%"
							/>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12} sm={12} md={6.6} height={{ xs: 400, md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
			</Grid>
		</>
	);
};

export default EnergyDashboardSkeleton;
