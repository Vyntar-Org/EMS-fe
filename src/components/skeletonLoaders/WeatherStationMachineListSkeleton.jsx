import { Grid, Skeleton } from '@mui/material';

const WeatherStationMachineListSkeleton = () => {
	const skeletonItems = Array.from({ length: 8 }, (_, i) => i);

	return (
		<Grid container rowGap={1.5} columnSpacing={1.5}>
			{skeletonItems.map((_, ind) => {
				return (
					<Grid
						item
						xs={12}
						sm={6}
						md={4}
						lg={3}
						key={`weather-machine-card-skeleton-${ind + 1}`}
						height="360px"
					>
						<Skeleton
							variant="rounded"
							animation="wave"
							width="100%"
							height="100%"
							sx={{
								borderRadius: '20px',
								bgcolor: 'surface.tableHead',

								'&::after': {
									background:
										'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
								},
							}}
						/>
					</Grid>
				);
			})}
		</Grid>
	);
};

export default WeatherStationMachineListSkeleton;
