import { Grid } from '@mui/material';

import { formatNumber } from '../../helpers/formatters';

import PremiumFlowCardMachineCard from './cards/PremiumFlowCardMachineCard';
import PremiumWaterLevelMachineCard from './cards/PremiumWaterLevelMachineCard';
import PremiumWaterQualityMonitorCard from './cards/PremiumWaterQualityMonitorCard';
import {
	getConsumptionMetric,
	getMachineCardKind,
	getOperationalMetrics,
	getWaterLevelMetrics,
	isWaterQualityMetric,
	MACHINE_CARD_KIND,
} from './machineCardClassification';

const getParameterOptions = (machine, cardKind, metrics) => {
	if (cardKind !== MACHINE_CARD_KIND.WATER_LEVEL) {
		return metrics.map((metric) => ({
			value: metric.metric_key,
			desc: machine?.card_name,
			label: metric.label,
		}));
	}

	const levelMetrics = metrics.filter((metric) =>
		String(metric?.metric_key || '')
			.toLowerCase()
			.includes('level')
	);
	const motorMetrics = metrics.filter((metric) =>
		String(metric?.metric_key || '')
			.toLowerCase()
			.includes('motor')
	);

	return [
		{
			label: 'Level',
			value: levelMetrics.map((metric) => metric.metric_key).join(', '),
			desc: machine?.card_name,
		},
		{
			label: 'Motor',
			value: motorMetrics.map((metric) => metric.metric_key).join(', '),
			desc: machine?.card_name,
		},
	];
};

const MachineGridItem = ({ children }) => (
	<Grid item xs={12} sm={6} md={4} lg={3} sx={{ display: 'flex', minWidth: 0 }}>
		{children}
	</Grid>
);

const FlowStpMachineCards = ({
	machines,
	app,
	consumptionUnit,
	getTrendUrl,
	onOpenTrend,
}) => {
	const keyPrefix = app.toLowerCase();

	return machines.flatMap((machine, machineIndex) => {
		const cardKind = getMachineCardKind(machine);
		const operationalMetrics = getOperationalMetrics(machine);
		const machineKey = `${machine?.slave_id || 'no-slave'}-${
			machine?.card_name || 'machine'
		}-${machineIndex}`;
		const parameterOptions = getParameterOptions(
			machine,
			cardKind,
			operationalMetrics
		);

		if (cardKind === MACHINE_CARD_KIND.WATER_QUALITY) {
			return operationalMetrics.filter(isWaterQualityMetric).map((metric) => (
				<MachineGridItem
					key={`${keyPrefix}-quality-${machineKey}-${
						metric?.metric_key || metric?.label || 'metric'
					}`}
				>
					<PremiumWaterQualityMonitorCard
						title={machine?.card_name || ''}
						status={machine?.status}
						lastUpdated={machine?.last_updated}
						metric={metric}
						trendUrl={getTrendUrl(machine?.slave_id, metric?.metric_key)}
						onOpenTrend={() =>
							onOpenTrend(machine, [
								{
									value: metric?.metric_key,
									desc: machine?.card_name,
									label: metric?.label,
								},
							])
						}
					/>
				</MachineGridItem>
			));
		}

		if (cardKind === MACHINE_CARD_KIND.WATER_LEVEL) {
			const levelTrendSources = getWaterLevelMetrics(operationalMetrics).map(
				(metric) => ({
					metric,
					url: getTrendUrl(machine?.slave_id, metric?.metric_key),
				})
			);
			const itemKey = `${keyPrefix}-level-${machineKey}`;

			return [
				<MachineGridItem key={itemKey}>
					<PremiumWaterLevelMachineCard
						app={app}
						title={machine?.card_name || ''}
						status={machine?.status}
						lastUpdated={machine?.last_updated}
						metrics={operationalMetrics}
						levelTrendSources={levelTrendSources}
						onOpenTrend={() => onOpenTrend(machine, parameterOptions)}
					/>
				</MachineGridItem>,
			];
		}

		const todayMetric = getConsumptionMetric(machine, 'today_consumption');
		const mtdMetric = getConsumptionMetric(machine, 'mtd_consumption');
		const itemKey = `${keyPrefix}-standard-${machineKey}`;

		return [
			<MachineGridItem key={itemKey}>
				<PremiumFlowCardMachineCard
					app={app}
					title={machine?.card_name || ''}
					status={machine?.status}
					lastUpdated={machine?.last_updated}
					today={
						todayMetric
							? `${formatNumber(todayMetric.value, 2)} ${consumptionUnit}`
							: undefined
					}
					mtd={
						mtdMetric
							? `${formatNumber(mtdMetric.value, 2)} ${consumptionUnit}`
							: undefined
					}
					trendUrl={getTrendUrl(
						machine?.slave_id,
						parameterOptions?.[0]?.value
					)}
					onOpenTrend={() => onOpenTrend(machine, parameterOptions)}
					metrics={operationalMetrics}
				/>
			</MachineGridItem>,
		];
	});
};

export default FlowStpMachineCards;
