import { Grid, Skeleton } from '@mui/material';

const STPDashboardSkeleton = () => {
	return (
		<>
			<Grid container spacing={1.5} height={{ md: '400px' }}>
				<Grid item xs={12} md={6} height={{ md: '100%' }}>
					<Grid container height={{ md: '100%' }}>
						<Grid item xs={12} height={{ md: '55%' }}>
							<Grid container spacing={1.5} height={{ md: '100%' }}>
								<Grid item xs={12} sm={6} height={{ xs: 210, md: '100%' }}>
									<Skeleton
										sx={{ borderRadius: '16px' }}
										animation="wave"
										variant="rounded"
										width="100%"
										height="100%"
									/>
								</Grid>

								<Grid item xs={12} sm={6} height={{ xs: 210, md: '100%' }}>
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
							mt={{ xs: 1.5, md: 0 }}
							height={{ xs: 400, sm: 170, md: '45%' }}
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
				spacing={1.5}
				height={{ md: 'calc(100% - 340px)' }}
			>
				<Grid item xs={12} md={6} height={{ xs: 400, md: '100%' }}>
					<Skeleton
						sx={{ borderRadius: '16px' }}
						animation="wave"
						variant="rounded"
						width="100%"
						height="100%"
					/>
				</Grid>
				<Grid item xs={12} md={6} height={{ xs: 400, md: '100%' }}>
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

export default STPDashboardSkeleton;
