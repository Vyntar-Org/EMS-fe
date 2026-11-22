import { useApplications } from '../../contexts/ApplicationContext';

export function useOHTConfig() {
	const { applications } = useApplications();
	return (
		applications.find(
			(app) => app.code === 'OHT' || app.code === 'WATER_MONITOR'
		)?.water_monitor ?? {}
	);
}
