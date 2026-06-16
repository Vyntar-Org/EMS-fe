import { Box, Grid, Skeleton } from '@mui/material';

const STPDashboardSkeleton = () => {
	return (
		<Box
			sx={{
				height: { md: 'calc(100vh - 64px - 8px)' },
			}}
		>
			<Grid container spacing={1} height={{ md: '350px' }}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '50%' }}>
							<Grid container spacing={1} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ xs: 156, md: '100%' }}>
									<Skeleton
										sx={{ borderRadius: '16px' }}
										animation="wave"
										variant="rounded"
										width="100%"
										height="100%"
									/>
								</Grid>

								<Grid item xs={12} sm={6} height={{ xs: 156, md: '100%' }}>
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

						<Grid
							item
							xs={12}
							mt={{ xs: 1, md: 0 }}
							height={{ xs: 176, md: '50%' }}
						>
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

				<Grid item xs height={{ xs: 350, md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
			</Grid>

			<Grid
				sx={{ mt: 0 }}
				container
				spacing={1}
				height={{ md: 'calc(100% - 350px)' }}
			>
				<Grid item xs={12} md={6} height={{ xs: 350, md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} md={6} height={{ xs: 350, md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default STPDashboardSkeleton;
