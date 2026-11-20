/* eslint-disable react-refresh/only-export-components */
import { useQuery } from '@tanstack/react-query';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { useAuth } from '../../contexts/AuthContext';

import useOHTMotorCommand from './useOHTMotorCommand';

const OperationsContext = createContext(null);

function DeviceOperation({ entry, publish }) {
	const latest = useQuery({ queryKey: entry.listKey, enabled: false });
	const machines = useMemo(
		() =>
			latest.data?.machines?.filter(
				(machine) => machine.device_uid === entry.deviceUid
			) ?? entry.machines,
		[latest.data, entry.deviceUid, entry.machines]
	);
	const control = useOHTMotorCommand({ ...entry, machines });
	useEffect(() => {
		publish(entry.deviceUid, control);
	}, [
		publish,
		entry.deviceUid,
		control.locked,
		control.busy,
		control.command,
		control.error,
		control.blockedReason,
		control.dialog,
		machines,
		entry.failed,
	]);
	return null;
}

function OperationSession({ children }) {
	const [entries, setEntries] = useState({});
	const [controls, setControls] = useState({});
	const register = useCallback((next) => {
		setEntries((previous) => ({ ...previous, ...next }));
	}, []);
	const publish = useCallback((uid, control) => {
		setControls((previous) => ({ ...previous, [uid]: control }));
	}, []);
	const value = useMemo(() => ({ register, controls }), [register, controls]);
	return (
		<OperationsContext.Provider value={value}>
			{Object.values(entries).map((entry) => (
				<DeviceOperation
					key={entry.deviceUid}
					entry={entry}
					publish={publish}
				/>
			))}
			{children}
		</OperationsContext.Provider>
	);
}

// Retain device observers across internal navigation, scoped to this login.
// No operation is persisted across a full browser reload.
export default function OHTMotorOperations({ children }) {
	const { user } = useAuth();
	const scope = user?.id ?? user?.username ?? user?.email ?? 'anonymous';
	return <OperationSession key={scope}>{children}</OperationSession>;
}

export function useWaterMonitoringMotorOperations() {
	return useContext(OperationsContext);
}
