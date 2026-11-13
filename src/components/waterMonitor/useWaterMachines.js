import { useQuery } from '@tanstack/react-query';

import { useApplications } from '../../contexts/ApplicationContext';

import {
	configuredPath,
	getWaterData,
	normalizeMachines,
} from './waterMonitorApi';

export function useWaterConfig() {
	const { applications } = useApplications();
	return (
		applications.find((app) => app.code === 'WATER_MONITOR')?.water_monitor ??
		{}
	);
}

export default function useWaterMachines() {
	const config = useWaterConfig();
	const path = configuredPath(config.machine_list_url);
	const query = useQuery({
		queryKey: ['water-monitor', 'machines', path],
		queryFn: async ({ signal }) =>
			normalizeMachines(await getWaterData(path, signal)),
		enabled: Boolean(path),
		refetchInterval:
			Number.isFinite(config.poll_interval_seconds) &&
			config.poll_interval_seconds >= 5
				? config.poll_interval_seconds * 1000
				: false,
		refetchIntervalInBackground: false,
		retry: false,
	});
	return { ...query, configured: Boolean(path), config };
}
