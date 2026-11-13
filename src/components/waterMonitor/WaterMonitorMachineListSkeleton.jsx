import { Box, Skeleton } from '@mui/material';
import './waterMonitor.css';

export default function WaterMonitorMachineListSkeleton() {
	return (
		<Box
			className="wm-machine-grid"
			role="status"
			aria-label="Loading Water Monitoring machines"
			aria-busy="true"
		>
			{Array.from({ length: 4 }, (_, index) => (
				<Box
					key={index}
					className="wm-machine-card wm-skeleton-card"
					aria-hidden="true"
				>
					<Box className="wm-card-header">
						<Skeleton variant="circular" width={34} height={34} />
						<Box>
							<Skeleton width="85%" height={22} />
							<Skeleton width="95%" height={14} />
							<Skeleton width="75%" height={14} />
						</Box>
						<Skeleton width={54} height={20} />
					</Box>
					<Box className="wm-card-body">
						<Box className="wm-instruments">
							<Skeleton variant="rounded" height={139} />
							<Box className="wm-measurements">
								<Skeleton variant="rounded" height={67} />
								<Skeleton variant="rounded" height={67} />
							</Box>
						</Box>
						<Box className="wm-period-grid">
							<Skeleton variant="rounded" height={68} />
							<Skeleton variant="rounded" height={68} />
						</Box>
						<Skeleton variant="rounded" height={54} />
						<Skeleton variant="rounded" height={60} />
						<Skeleton variant="rounded" height={44} />
					</Box>
				</Box>
			))}
		</Box>
	);
}
