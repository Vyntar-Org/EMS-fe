import { Box } from '@mui/material';
import React from 'react';

import CustomCard from './CustomCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

/**
 * Shared chrome for every chart-housing dashboard/analytics card — same
 * card shell, title/icon header, and consistent loading/empty handling as
 * DashboardCard, so a chart card and a KPI card next to each other read as
 * the same design system. The chart itself (bar/line/donut/radial/map/...)
 * is still whatever the caller renders as `children`, since chart shape is
 * a real functional difference, not a styling one.
 */
const GraphContainer = ({
	icon,
	title,
	accentColor,
	headerAction,
	loading = false,
	hasData = true,
	emptyMessage = 'Waiting for live device data — readings appear automatically',
	children,
	...cardProps
}) => {
	return (
		<CustomCard
			title={title}
			titleIcon={icon}
			icon={headerAction}
			accentColor={accentColor}
			childrenOtherProps={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
			}}
			{...cardProps}
		>
			{loading ? (
				<LoadingState />
			) : !hasData ? (
				<EmptyState message={emptyMessage} />
			) : (
				<Box flex={1} minHeight={0} width="100%">
					{children}
				</Box>
			)}
		</CustomCard>
	);
};

export default GraphContainer;
