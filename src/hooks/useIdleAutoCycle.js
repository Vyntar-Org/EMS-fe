import { useCallback, useEffect, useRef } from 'react';

/**
 * Cycles through applications only while explicitly enabled by the user.
 * Disabling it clears the interval and leaves the active app unchanged.
 */
export function useIdleAutoCycle({
	apps,
	activeApp,
	onAppChange,
	enabled = false,
	cycleIntervalMs = 12_000,
}) {
	const cycleIntervalRef = useRef(null);
	const appsRef = useRef(apps);
	const activeAppRef = useRef(activeApp);
	const onAppChangeRef = useRef(onAppChange);

	useEffect(() => {
		appsRef.current = apps;
		activeAppRef.current = activeApp;
		onAppChangeRef.current = onAppChange;
	}, [activeApp, apps, onAppChange]);

	const stopCycling = useCallback(() => {
		if (cycleIntervalRef.current !== null) {
			clearInterval(cycleIntervalRef.current);
			cycleIntervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!enabled || appsRef.current.length < 2) {
			stopCycling();
			return undefined;
		}

		cycleIntervalRef.current = setInterval(() => {
			const currentApps = appsRef.current;
			const currentIndex = currentApps.indexOf(activeAppRef.current);
			const nextIndex =
				currentIndex < 0 ? 0 : (currentIndex + 1) % currentApps.length;
			onAppChangeRef.current(currentApps[nextIndex]);
		}, cycleIntervalMs);

		return stopCycling;
	}, [cycleIntervalMs, enabled, stopCycling]);

	return { isAutoCycling: enabled };
}
