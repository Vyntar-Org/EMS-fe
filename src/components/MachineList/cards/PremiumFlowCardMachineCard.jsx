import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';

import PremiumMachineCard from '../../common/PremiumMachineCard';
import { MachineMetricPanel } from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import StatusChips from '../../common/StatusChips';
import { formatNumber } from '../../../helpers/formatters';

// Two-column collection-tank readout (Water Level / Motor Status per tank) —
// unique to the STP/FlowMeter TANK_CARD variant.
const WaterLevelTableRows = ({ groupedMetricsData }) => {
	const findMetric = (key) =>
		groupedMetricsData?.find((m) => m.metric_key === key);

	const level1 = findMetric('Level 1');
	const level2 = findMetric('Level 2');
	const motor1 = findMetric('Motor 1 Status');
	const motor2 = findMetric('Motor 2 Status');

	const rowsConfig = [
		{
			left: {
				label: 'Water Level',
				value: level1?.value,
				color:
					level1?.status_color || (level1?.value === 'Full' ? 'RED' : 'GREEN'),
			},
			right: {
				label: 'Water Level',
				value: level2?.value,
				color:
					level2?.status_color || (level2?.value === 'Low' ? 'RED' : 'GREEN'),
			},
		},
		{
			left: {
				label: 'Motor Status',
				value: motor1?.value,
				color: motor1?.status_color,
			},
			right: {
				label: 'Motor Status',
				value: motor2?.value,
				color: motor2?.status_color,
			},
		},
	];

	return (
		<>
			{rowsConfig.map((row, index) => (
				<TableRow key={index}>
					<TableCell
						sx={{
							border: 0,
							py: 0.5,
							width: '50%',
							px: 0.5,
							borderRight: (t) => `1px solid ${t.palette.divider}`,
						}}
					>
						<Box
							width="100%"
							display="flex"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box width="calc(100% - 40px - 4px)" textAlign="left">
								<ResponsiveTextWrapper
									fontSize="10.5px"
									color="text.primary"
									fontWeight={600}
									value={row.left.label}
									sx={{
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								/>
							</Box>
							<StatusChips value={String(row.left.value ?? 'Nil')} />
						</Box>
					</TableCell>
					<TableCell
						align="right"
						sx={{
							border: 0,
							py: 0.5,
							width: '50%',
							px: 0.5,
						}}
					>
						<Box
							width="100%"
							display="flex"
							justifyContent="space-between"
							alignItems="center"
						>
							<Box width="calc(100% - 41px - 4px)" textAlign="left">
								<ResponsiveTextWrapper
									fontSize="10.5px"
									color="text.primary"
									fontWeight={600}
									value={row.right.label}
									sx={{
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								/>
							</Box>
							<StatusChips value={String(row.right.value ?? 'Nil')} />
						</Box>
					</TableCell>
				</TableRow>
			))}
		</>
	);
};

/**
 * Shared dedicated premium card for STP and FlowMeter machine lists (they
 * share the exact same `metrics[]` / `ui_card_type` API shape). Pass
 * `app="STP"` or `app="FLOWMETER"` for the app-specific icon. Renders either
 * a dynamic Parameter/Value table (FLOW_CARD) or the collection-tank Water
 * Level/Motor Status readout (TANK_CARD).
 */
const PremiumFlowCardMachineCard = ({
	app,
	title,
	status,
	lastUpdated,
	metrics = [],
	cardType,
	today,
	mtd,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const isTankCard = cardType === 'TANK_CARD';
	const isFlowCard = cardType === 'FLOW_CARD';

	return (
		<PremiumMachineCard
			app={app}
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			todayMtd={isFlowCard ? { todayValue: today, mtdValue: mtd } : null}
			trend={slaveId ? { url: trendUrl } : null}
			onOpenTrend={onOpenTrend}
		>
			{isFlowCard ? (
				<MachineMetricPanel
					rows={metrics.map((row) => ({
						label: row.label,
						value: formatNumber(row?.value, 2, { fallback: '0' }),
					}))}
				/>
			) : (
				<Box
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: '12px',
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
										width: '50%',
										...(isTankCard ? { px: 0.5, textAlign: 'center' } : {}),
									}}
								>
									<ResponsiveTextWrapper
										fontSize="9.5px"
										fontWeight="bold"
										value={isTankCard ? 'Collection Tank' : 'Parameter'}
									/>
								</TableCell>
								<TableCell
									align="right"
									sx={{
										fontWeight: 'bold',
										border: 0,
										width: '50%',
										...(isTankCard ? { px: 0.5, textAlign: 'center' } : {}),
									}}
								>
									<ResponsiveTextWrapper
										fontSize="9.5px"
										fontWeight="bold"
										value={isTankCard ? 'Filter out' : 'Value'}
									/>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<WaterLevelTableRows groupedMetricsData={metrics} />
						</TableBody>
					</Table>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumFlowCardMachineCard;
