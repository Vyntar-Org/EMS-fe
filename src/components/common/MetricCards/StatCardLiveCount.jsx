import { Box } from '@mui/material';

import ResponsiveTextWrapper from '../ResponsiveTextWrapper';

// Hero-number layout for count-type metrics (e.g. connected station count)
// that have no "today vs yesterday" reading and no volume unit — forcing
// those into the Today/Yesterday KLD card shape misrepresents the metric,
// so this shows the number itself as the single visual focus instead.
const StatCardLiveCount = ({ value, label, accent, asOf }) => (
	<Box
		sx={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 0.75,
			width: '100%',
			minWidth: 0,
			px: 2,
		}}
	>
		{label && (
			<ResponsiveTextWrapper
				value={label}
				color="text.secondary"
				fontWeight={700}
				fontSize={{ xs: '10.5px', md: '12.5px' }}
				sx={{
					textTransform: 'uppercase',
					letterSpacing: '0.4px',
					textAlign: 'center',
				}}
			/>
		)}

		<ResponsiveTextWrapper
			value={String(value ?? 0)}
			fontWeight={800}
			fontSize={{ xs: '30px', sm: '36px', md: '44px', lg: '50px' }}
			color={accent}
			sx={{ lineHeight: 1, textAlign: 'center' }}
		/>

		{asOf && (
			<ResponsiveTextWrapper
				value={asOf}
				color="text.secondary"
				fontWeight={500}
				fontSize={{ xs: '9px', md: '10.5px' }}
				sx={{ textAlign: 'center' }}
			/>
		)}
	</Box>
);

export default StatCardLiveCount;
