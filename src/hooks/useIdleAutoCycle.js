import { useCallback, useEffect, useRef, useState } from 'react';

const MOUSE_MOVE_THROTTLE_MS = 250;

/**
 * Enters idle mode after a period without mouse or keyboard activity and
 * advances through `apps` until activity resumes.
 */
export function useIdleAutoCycle({
	apps,
	activeApp,
	onAppChange,
	idleTimeoutMs = 30_000,
	cycleIntervalMs = 12_000,
}) {
	const [isIdle, setIsIdle] = useState(false);
	const idleTimeoutRef = useRef(null);
	const cycleIntervalRef = useRef(null);
	const lastMouseMoveRef = useRef(0);
	const isIdleRef = useRef(false);
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

	const enterIdleMode = useCallback(() => {
		isIdleRef.current = true;
		setIsIdle(true);
	}, []);

	const resetIdleTimer = useCallback(() => {
		if (idleTimeoutRef.current !== null) {
			clearTimeout(idleTimeoutRef.current);
		}

		stopCycling();
		if (isIdleRef.current) {
			isIdleRef.current = false;
			setIsIdle(false);
		}

		idleTimeoutRef.current = setTimeout(enterIdleMode, idleTimeoutMs);
	}, [enterIdleMode, idleTimeoutMs, stopCycling]);

	useEffect(() => {
		const handleKeyDown = () => resetIdleTimer();
		const handleMouseMove = () => {
			const now = Date.now();
			// The first movement while idle is never throttled, so manual control
			// resumes immediately. Continuous movement resets at most 4 times/sec.
			if (
				isIdleRef.current ||
				now - lastMouseMoveRef.current >= MOUSE_MOVE_THROTTLE_MS
			) {
				lastMouseMoveRef.current = now;
				resetIdleTimer();
			}
		};

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('keydown', handleKeyDown);
		resetIdleTimer();

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('keydown', handleKeyDown);
			if (idleTimeoutRef.current !== null) {
				clearTimeout(idleTimeoutRef.current);
				idleTimeoutRef.current = null;
			}
			stopCycling();
		};
	}, [resetIdleTimer, stopCycling]);

	useEffect(() => {
		if (!isIdle || appsRef.current.length < 2) {
			stopCycling();
			return;
		}

		cycleIntervalRef.current = setInterval(() => {
			const currentApps = appsRef.current;
			if (currentApps.length === 0) {
				return;
			}

			const currentIndex = currentApps.indexOf(activeAppRef.current);
			const nextIndex =
				currentIndex < 0 ? 0 : (currentIndex + 1) % currentApps.length;
			onAppChangeRef.current(currentApps[nextIndex]);
		}, cycleIntervalMs);

		return stopCycling;
	}, [cycleIntervalMs, isIdle, stopCycling]);

	return { isIdle, resetIdleTimer };
}

