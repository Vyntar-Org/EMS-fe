import SettingsSuggestRounded from '@mui/icons-material/SettingsSuggestRounded';
import { Box } from '@mui/material';
import React from 'react';

import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';

const Settings = () => {
	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				gap: 2,
			}}
		>
			<PageHeader
				icon={<SettingsSuggestRounded />}
				title="Settings"
				subtitle="Application preferences and configuration"
			/>
			<Box sx={{ flex: 1, minHeight: 0 }}>
				<EmptyState message="Settings are on their way — nothing to configure here yet" />
			</Box>
		</Box>
	);
};

export default Settings;
