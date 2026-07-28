import { Stack } from '@mui/material';

/**
 * Generic presentational shell for the search/select/date-range filter rows
 * repeated across Logs/MachineList/Reports headers. Purely a layout wrapper
 * — callers still own and pass in their own controls/handlers; no data or
 * filtering logic lives here.
 */
const FilterBar = ({ children, sx = {} }) => {
	return (
		<Stack
			direction="row"
			flexWrap="wrap"
			alignItems="center"
			gap={1.5}
			sx={{
				width: '100%',
				p: 1.5,
				borderRadius: '14px',
				bgcolor: 'surface.muted',
				border: '1px solid',
				borderColor: 'surface.mutedBorder',
				...sx,
			}}
		>
			{children}
		</Stack>
	);
};

export default FilterBar;
