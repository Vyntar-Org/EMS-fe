import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'ems-theme-mode';
const DAY_START_HOUR = 6; // 06:00
const DAY_END_HOUR = 18; // 18:00

/**
 * Initial mode resolution:
 * 1. User's stored choice (localStorage) always wins.
 * 2. Otherwise time-of-day: day (06:00–18:00) → light, night → dark.
 */
const getInitialMode = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}
	} catch {
		// localStorage unavailable (private mode etc.) — fall through
	}
	const hour = new Date().getHours();
	return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? 'light' : 'dark';
};

const ThemeModeContext = createContext(null);

export const ThemeModeProvider = ({ children }) => {
	const [mode, setModeState] = useState(getInitialMode);

	const value = useMemo(() => {
		const setMode = (nextMode) => {
			if (nextMode !== 'light' && nextMode !== 'dark') {
				return;
			}
			try {
				localStorage.setItem(STORAGE_KEY, nextMode);
			} catch {
				// persisting is best-effort
			}
			setModeState(nextMode);
		};

		return { mode, setMode, isDark: mode === 'dark' };
	}, [mode]);

	return (
		<ThemeModeContext.Provider value={value}>
			{children}
		</ThemeModeContext.Provider>
	);
};

export const useThemeMode = () => {
	const context = useContext(ThemeModeContext);
	if (!context) {
		throw new Error('useThemeMode must be used within ThemeModeProvider');
	}
	return context;
};
