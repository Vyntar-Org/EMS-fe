import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	useTheme,
} from '@mui/material';

const getThSx = (theme) => ({
	color: theme.palette.text.secondary,
	fontWeight: 600,
	fontSize: '0.75rem',
	letterSpacing: '0.02em',
	py: 0.75,
	px: 0.5,
	borderBottom: `1px solid ${theme.palette.divider}`,
	borderTop: 'none',
	borderLeft: 'none',
	borderRight: 'none',
});

const getTdSx = (theme) => ({
	color: theme.palette.text.primary,
	fontWeight: 400,
	fontSize: '0.8rem',
	lineHeight: 1.45,
	py: 1,
	px: 0.5,
	borderBottom: `1px solid ${theme.palette.divider}`,
	borderLeft: 'none',
	borderRight: 'none',
	verticalAlign: 'middle',
	wordBreak: 'break-word',
});

const getStatusBadgeSx = (theme) => {
	const isDark = theme.palette.mode === 'dark';
	return {
		'badge--watch': {
			bgcolor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(234, 88, 12, 0.12)',
			color: isDark ? '#fb923c' : '#c2410c',
		},
		'badge--cloud': {
			bgcolor: isDark ? 'rgba(180, 83, 9, 0.2)' : 'rgba(180, 83, 9, 0.12)',
			color: isDark ? '#f59e0b' : '#b45309',
		},
		'badge--ok': {
			bgcolor: isDark ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.12)',
			color: isDark ? '#4ade80' : '#15803d',
		},
		'badge--monitor': {
			bgcolor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
			color: isDark ? '#38bdf8' : '#0369a1',
		},
		'badge--inspect': {
			bgcolor: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(234, 88, 12, 0.12)',
			color: isDark ? '#fb923c' : '#c2410c',
		},
	};
};

export function StatusBadge({ status, statusClass }) {
	const theme = useTheme();
	const statusBadgeSx = getStatusBadgeSx(theme);

	return (
		<Box
			component="span"
			sx={{
				display: 'inline-block',
				px: 0.75,
				py: 0.25,
				borderRadius: '999px',
				fontSize: '0.68rem',
				fontWeight: 500,
				whiteSpace: 'nowrap',
				...(statusBadgeSx[statusClass] ?? {}),
			}}
		>
			{status}
		</Box>
	);
}

/**
 * @param {{ id: string, label: string, render?: (row: object) => React.ReactNode }[]} columns
 * @param {object[]} rows
 * @param {'default' | 'alerts'} variant
 */
function DashboardTable({ columns, rows, variant = 'default' }) {
	const theme = useTheme();
	const thSx = getThSx(theme);
	const tdSx = getTdSx(theme);

	const cellSx = (colIndex, colId) => {
		if (variant !== 'alerts') {
			return tdSx;
		}

		if (colId === 'prediction') {
			return { ...tdSx, color: theme.palette.text.secondary };
		}
		if (colId === 'parameter') {
			return { ...tdSx, fontWeight: 500 };
		}
		return tdSx;
	};

	return (
		<TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
			<Table
				sx={{
					width: '100%',
					tableLayout: 'fixed',
					borderCollapse: 'collapse',
					'& .MuiTableCell-root': { bgcolor: 'transparent' },
				}}
			>
				<TableHead>
					<TableRow>
						{columns.map((col) => (
							<TableCell key={col.id} component="th" scope="col" sx={thSx}>
								{col.label}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((row, index) => (
						<TableRow
							key={row.id ?? row.key ?? index}
							sx={{
								'&:last-child td': { borderBottom: 'none' },
							}}
						>
							{columns.map((col, colIndex) => (
								<TableCell key={col.id} sx={cellSx(colIndex, col.id)}>
									{col.render ? col.render(row) : row[col.id]}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

export default DashboardTable;
