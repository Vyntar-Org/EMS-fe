import { Grid, Skeleton } from '@mui/material';

const FuelDashboardSkeleton = () => {
	return (
		<Grid container spacing={1.5} flex={1} minHeight={0}>
			<Grid item xs={12} md={3} height="100%">
				<Grid container rowGap={1.5} height={{ md: 'calc(100% - 12px)' }}>
					<Grid item xs={12} height={{ xs: 250, md: '40%' }}>
						<Skeleton
							sx={{ borderRadius: '16px' }}
							animation="wave"
							variant="rounded"
							width="100%"
							height="100%"
						/>
					</Grid>
					<Grid item xs={12} height={{ xs: 300, md: '60%' }}>
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

			<Grid item xs={12} md={9} height={{ xs: 400, md: '100%' }}>
				<Skeleton
					sx={{ borderRadius: '16px' }}
					animation="wave"
					variant="rounded"
					width="100%"
					height="100%"
				/>
			</Grid>
		</Grid>
	);
};

export default FuelDashboardSkeleton;
