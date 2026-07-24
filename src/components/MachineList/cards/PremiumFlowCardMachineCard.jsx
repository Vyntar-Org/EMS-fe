import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';

import { APP_ACCENT_COLOR, MachineRatioDonut } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import StatusChips from '../../common/StatusChips';

// Two-column collection-tank readout (Water Level / Motor Status per tank) —
// unique to the STP/FlowMeter TANK_CARD variant.
const WaterLevelTableRows = ({ groupedMetricsData }) => {
	const findMetric = (key) => groupedMetricsData?.find((m) => m.metric_key === key);

	const level1 = findMetric('Level 1');
	const level2 = findMetric('Level 2');
	const motor1 = findMetric('Motor 1 Status');
	const motor2 = findMetric('Motor 2 Status');

	const rowsConfig = [
		{
			left: {
				label: 'Water Level',
				value: level1?.value,
				color: level1?.status_color || (level1?.value === 'Full' ? 'RED' : 'GREEN'),
			},
			right: {
				label: 'Water Level',
				value: level2?.value,
				color: level2?.status_color || (level2?.value === 'Low' ? 'RED' : 'GREEN'),
			},
		},
		{
			left: { label: 'Motor Status', value: motor1?.value, color: motor1?.status_color },
			right: { label: 'Motor Status', value: motor2?.value, color: motor2?.status_color },
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
							backgroundColor: 'background.paper',
							borderRight: (t) => `1px solid ${t.palette.divider}`,
						}}
					>
						<Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
							<Box width="calc(100% - 40px - 4px)" textAlign="left">
								<ResponsiveTextWrapper fontSize="14px" color="text.primary" fontWeight={500} value={row.left.label} />
							</Box>
							<StatusChips value={String(row.left.value ?? 'Nil')} />
						</Box>
					</TableCell>
					<TableCell align="right" sx={{ border: 0, py: 0.5, width: '50%', px: 0.5, backgroundColor: 'background.paper' }}>
						<Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
							<Box width="calc(100% - 41px - 4px)" textAlign="left">
								<ResponsiveTextWrapper fontSize="14px" color="text.primary" fontWeight={500} value={row.right.label} />
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
	todayValue,
	mtdValue,
	slaveId,
	trendUrl,
	onOpenTrend,
}) => {
	const isTankCard = cardType === 'TANK_CARD';
	const isFlowCard = cardType === 'FLOW_CARD';
	const mtdNum = Number(mtdValue ?? 0);
	const donutPercent = mtdNum > 0 ? (Number(todayValue ?? 0) / mtdNum) * 100 : 0;

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
			<Box
				sx={{
					bgcolor: 'surface.muted',
					border: '1px solid',
					borderColor: 'surface.mutedBorder',
					borderRadius: '14px',
					width: '100%',
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
									fontSize="14px"
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
									fontSize="14px"
									fontWeight="bold"
									value={isTankCard ? 'Filter out' : 'Value'}
								/>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{isTankCard ? (
							<WaterLevelTableRows groupedMetricsData={metrics} />
						) : (
							metrics.map((row) => (
								<TableRow key={row.metric_key}>
									<TableCell sx={{ border: 0, py: 0.5, width: '50%' }}>
										<ResponsiveTextWrapper fontSize="13px" color="text.primary" fontWeight={500} value={row.label} />
									</TableCell>
									<TableCell align="right" sx={{ border: 0, py: 0.5, width: '50%' }}>
										<ResponsiveTextWrapper
											fontSize="13.5px"
											color="text.primary"
											fontWeight={700}
											value={Number(row?.value ?? 0).toFixed(2)}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Box>
			{isFlowCard && (
				<Box mt={1.25}>
					<MachineRatioDonut
						percent={donutPercent}
						color={APP_ACCENT_COLOR[app]}
						label="Today's share of MTD"
						caption={today}
					/>
				</Box>
			)}
		</PremiumMachineCard>
	);
};

export default PremiumFlowCardMachineCard;
