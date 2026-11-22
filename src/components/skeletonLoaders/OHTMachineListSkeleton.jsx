import { Box, Skeleton } from '@mui/material';

import { WaterMonitoringMachineGrid } from '../MachineList/OHT/machineListStyles';

export default function OHTMachineListSkeleton() {
	return (
		<WaterMonitoringMachineGrid
			role="status"
			aria-label="Loading Water Monitoring machines"
			aria-busy="true"
		>
			{Array.from({ length: 4 }, (_, index) => (
				<Box
					key={index}
					data-water-ui="machine-card skeleton-card"
					aria-hidden="true"
				>
					<Box data-water-ui="card-header">
						<Skeleton variant="circular" width={34} height={34} />
						<Box>
							<Skeleton width="85%" height={22} />
							<Skeleton width="95%" height={14} />
							<Skeleton width="75%" height={14} />
						</Box>
						<Skeleton width={54} height={20} />
					</Box>
					<Box data-water-ui="card-body">
						<Box data-water-ui="instruments">
							<Skeleton variant="rounded" height={139} />
							<Box data-water-ui="measurements">
								<Skeleton variant="rounded" height={67} />
								<Skeleton variant="rounded" height={67} />
							</Box>
						</Box>
						<Box data-water-ui="period-grid">
							<Skeleton variant="rounded" height={68} />
							<Skeleton variant="rounded" height={68} />
						</Box>
						<Skeleton variant="rounded" height={54} />
						<Skeleton variant="rounded" height={60} />
						<Skeleton variant="rounded" height={44} />
					</Box>
				</Box>
			))}
		</WaterMonitoringMachineGrid>
	);
}
