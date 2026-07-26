import {
	Box,
	Grid,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';

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
			bgcolor: 'surface.muted',
			border: '1px solid',
			borderColor: 'surface.mutedBorder',
			borderRadius: '14px',
			mb: 1,
			width: '100%',
		}}
	>
		<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
			<TableHead>
				<TableRow>
					<TableCell sx={{ fontWeight: 'bold', border: 0, width: '40%' }}>
						<ResponsiveTextWrapper
							fontSize="13px"
							fontWeight="bold"
							value="Phase"
						/>
					</TableCell>
					<TableCell
						align="right"
						sx={{ fontWeight: 'bold', border: 0, width: '30%' }}
					>
						<ResponsiveTextWrapper
							fontSize="13px"
							fontWeight="bold"
							value="V"
						/>
					</TableCell>
					<TableCell
						align="right"
						sx={{ fontWeight: 'bold', border: 0, width: '30%' }}
					>
						<ResponsiveTextWrapper
							fontSize="13px"
							fontWeight="bold"
							value="A"
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
						<TableCell sx={{ border: 0, py: 0.5, width: '40%' }}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box
									sx={{
										width: 10,
										height: 10,
										borderRadius: '50%',
										bgcolor: row.color,
										mr: 1,
									}}
								/>
								<ResponsiveTextWrapper
									fontSize="13px"
									fontWeight={500}
									value={row.name}
								/>
							</Box>
						</TableCell>
						<TableCell align="right" sx={{ border: 0, py: 0.5, width: '30%' }}>
							<ResponsiveTextWrapper
								fontSize="13px"
								fontWeight={500}
								value={Number(row.v ?? 0).toFixed(2)}
							/>
						</TableCell>
						<TableCell align="right" sx={{ border: 0, py: 0.5, width: '30%' }}>
							<ResponsiveTextWrapper
								fontSize="13px"
								fontWeight={500}
								value={Number(row.a ?? 0).toFixed(1)}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</Box>
);

const StatCell = ({ label, value }) => (
	<Grid item xs={4} minWidth={0}>
		<Box minWidth={0}>
			<ResponsiveTextWrapper
				value={label}
				fontSize="11.5px"
				color="text.secondary"
				fontWeight={500}
			/>
			<ResponsiveTextWrapper
				value={value}
				fontSize="14px"
				color="text.primary"
				fontWeight={700}
			/>
		</Box>
	</Grid>
);

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
			mb={1}
			gap={1}
		>
			<Box minWidth={0} flex={1}>
				<ResponsiveTextWrapper
					value="Total Energy"
					fontSize="12px"
					color="text.secondary"
					fontWeight={500}
				/>
			</Box>
			<Box flexShrink={0}>
				<ResponsiveTextWrapper
					value={`${Number(total ?? 0).toFixed(1)} kWh`}
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
		<Grid container spacing={1} mt={0.25} mb={1.25}>
			<StatCell label="Active power" value={`${activePower} kW`} />
			<StatCell label="Power factor" value={`${powerFactor} PF`} />
			<StatCell label="Frequency" value={`${frequency} Hz`} />
		</Grid>
	</PremiumMachineCard>
);

export default PremiumEnergyMachineCard;
