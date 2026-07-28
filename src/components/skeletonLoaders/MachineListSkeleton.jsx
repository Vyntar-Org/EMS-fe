import { Grid, Skeleton } from '@mui/material';
import React from 'react';

/**
 * Parametrized replacement for the 4 near-identical per-app machine-list
 * skeletons (Energy/Solar/FireSafety/Temperature) — same shimmer/rounded-card
 * look, only count/height/breakpoints differ per app.
 */
const MachineListSkeleton = ({ count = 9, cardHeight = '390px', lg }) => {
	const skeletonItems = Array.from({ length: count }, (_, i) => i);

	return (
		<Grid container rowGap={1} columnSpacing={1}>
			{skeletonItems.map((_, ind) => {
				return (
					<Grid
						item
						xs={12}
						sm={6}
						md={4}
						lg={lg}
						key={`machine-card-skeleton-${ind + 1}`}
						height={cardHeight}
					>
						<Skeleton
							sx={{ borderRadius: '16px' }}
							animation="wave"
							variant="rounded"
							width="100%"
							height="100%"
						/>
					</Grid>
				);
			})}
		</Grid>
	);
};

export default MachineListSkeleton;
