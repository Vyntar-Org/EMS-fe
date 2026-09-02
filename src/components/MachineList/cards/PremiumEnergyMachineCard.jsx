import {
	ElectricMeterRounded,
	ShowChartRounded,
	SpeedRounded,
} from '@mui/icons-material';
import {
	Box,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { formatNumber } from '../../../helpers/formatters';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

// 3-phase R/Y/B voltage+current table — unique to Energy, kept as its own
// dedicated visual rather than folded into the generic metric panel.
const PhaseTable = ({
	phaseRV,
	phaseRA,
	phaseYV,
	phaseYA,
	phaseBV,
	phaseBA,
}) => (
	<Box
		sx={{
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: '12px',
			mb: 0.6,
			width: '100%',
			boxShadow: '0 5px 14px rgba(37,69,111,.06)',
			overflow: 'hidden',
			bgcolor: 'background.paper',
			'& .MuiTableCell-root': { bgcolor: 'background.paper' },
		}}
	>
		<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
			<TableHead>
				<TableRow>
					<TableCell
						sx={{
							fontWeight: 'bold',
							border: 0,
							width: '40%',
							bgcolor: (t) => alpha(t.palette.primary.main, 0.035),
						}}
					>
						<ResponsiveTextWrapper
							fontSize="9.5px"
							fontWeight={600}
							value="Phase"
						/>
					</TableCell>
					<TableCell
						align="right"
						sx={{ fontWeight: 'bold', border: 0, width: '30%' }}
					>
						<ResponsiveTextWrapper
							fontSize="9.5px"
							fontWeight="bold"
							value="V (Voltage)"
						/>
					</TableCell>
					<TableCell
						align="right"
						sx={{ fontWeight: 'bold', border: 0, width: '30%' }}
					>
						<ResponsiveTextWrapper
							fontSize="9.5px"
							fontWeight="bold"
							value="A (Current)"
						/>
					</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{[
					{ name: 'Phase R', v: phaseRV, a: phaseRA, color: '#d32f2f' },
					{ name: 'Phase Y', v: phaseYV, a: phaseYA, color: '#fbc02d' },
					{ name: 'Phase B', v: phaseBV, a: phaseBA, color: '#1976d2' },
				].map((row) => (
					<TableRow key={row.name}>
						<TableCell sx={{ py: 0.55, width: '40%', borderColor: 'divider' }}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box
									sx={{
										width: 9,
										height: 9,
										borderRadius: '50%',
										bgcolor: row.color,
										mr: 1,
									}}
								/>
								<ResponsiveTextWrapper
									fontSize="10.5px"
									fontWeight={700}
									value={row.name}
								/>
							</Box>
						</TableCell>
						<TableCell
							align="right"
							sx={{ py: 0.55, width: '30%', borderColor: 'divider' }}
						>
							<ResponsiveTextWrapper
								fontSize="10.5px"
								fontWeight={700}
								color={row.color}
								value={formatNumber(row.v, 2, { fallback: '0' })}
							/>
						</TableCell>
						<TableCell
							align="right"
							sx={{ py: 0.55, width: '30%', borderColor: 'divider' }}
						>
							<ResponsiveTextWrapper
								fontSize="10.5px"
								fontWeight={700}
								color={row.color}
								value={formatNumber(row.a, 2, { fallback: '0' })}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</Box>
);

const STAT_ICONS = [ShowChartRounded, ElectricMeterRounded, SpeedRounded];
const STAT_COLORS = ['#16A085', '#805AD5', '#2589D8'];

const StatCell = ({ label, value, index }) => {
	const Icon = STAT_ICONS[index];
	const color = STAT_COLORS[index];
	return (
		<Grid item xs={4} minWidth={0}>
			<Box
				minWidth={0}
				sx={{
					minHeight: 58,
					p: 0.6,
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: '12px',
					boxShadow: '0 5px 14px rgba(37,69,111,.06)',
					display: 'flex',
					alignItems: 'center',
					gap: 0.5,
				}}
			>
				<Box
					sx={{
						width: 28,
						height: 28,
						borderRadius: '50%',
						display: 'grid',
						placeItems: 'center',
						flexShrink: 0,
						color,
						bgcolor: alpha(color, 0.12),
						'& svg': { fontSize: 17 },
					}}
				>
					<Icon />
				</Box>
				<Box minWidth={0}>
					<ResponsiveTextWrapper
						value={label}
						fontSize="9.5px"
						color="text.secondary"
						fontWeight={500}
					/>
					<ResponsiveTextWrapper
						value={value}
						fontSize="12px"
						color="text.primary"
						fontWeight={800}
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					/>
				</Box>
			</Box>
		</Grid>
	);
};

/**
 * Dedicated premium card for the Energy machine list: bolt icon, title +
 * status pill, timestamp, total energy, a 3-phase V/A table, Active
 * Power/PF/Frequency stats, Today/MTD energy, and the TREND action last.
 */
const PremiumEnergyMachineCard = ({
	title,
	status,
	lastUpdated,
	total,
	phaseRV,
	phaseRA,
	phaseYV,
	phaseYA,
	phaseBV,
	phaseBA,
	activePower,
	powerFactor,
	frequency,
	today,
	mtd,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => (
	<PremiumMachineCard
		app="ENERGY"
		title={title}
		status={status}
		lastUpdated={lastUpdated}
		todayMtd={{ todayValue: `${today} kWh`, mtdValue: `${mtd} kWh` }}
		trend={slaveId ? { url: trendUrl } : null}
		onOpenTrend={onOpenTrend}
	>
		<Box
			display="flex"
			justifyContent="space-between"
			alignItems="baseline"
			my={0.25}
			gap={1}
			sx={{ borderLeft: '3px solid #E5485D', pl: 1 }}
		>
			<Box minWidth={0} flex={1}>
				<ResponsiveTextWrapper
					value="Total Energy"
					fontSize="12.5px"
					color="text.secondary"
					fontWeight={600}
				/>
			</Box>
			<Box flexShrink={0}>
				<ResponsiveTextWrapper
					value={`${formatNumber(total, 2, { fallback: '0' })} kWh`}
					fontSize="16px"
					color="text.primary"
					fontWeight={700}
				/>
			</Box>
		</Box>
		<PhaseTable
			phaseRV={phaseRV}
			phaseRA={phaseRA}
			phaseYV={phaseYV}
			phaseYA={phaseYA}
			phaseBV={phaseBV}
			phaseBA={phaseBA}
		/>
		<Grid container spacing={0.6} mt={0.1} mb={0.6}>
			<StatCell
				index={0}
				label="Active power"
				value={`${formatNumber(activePower, 2, { fallback: '0' })} kW`}
			/>
			<StatCell
				index={1}
				label="Power factor"
				value={`${formatNumber(powerFactor, 2, { fallback: '0' })} PF`}
			/>
			<StatCell
				index={2}
				label="Frequency"
				value={`${formatNumber(frequency, 2, { fallback: '0' })} Hz`}
			/>
		</Grid>
	</PremiumMachineCard>
);

export default PremiumEnergyMachineCard;
