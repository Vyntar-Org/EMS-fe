import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Exercise the production hook's transitions with deterministic hook/query
// adapters. Transport is mocked; no command is sent to equipment.
const source = (
	await readFile(new URL('./useWaterMotorCommand.js', import.meta.url), 'utf8')
).replace(/import\s+({[\s\S]*?})\s+from\s+'([^']+)';/g, (_, names, path) => {
	if (path === 'react' || path === '@tanstack/react-query') {
		return `const ${names} = globalThis.__motorHookRuntime;`;
	}
	if (path === './waterMonitorApi') {
		return `const ${names} = globalThis.__motorHookRuntime;`;
	}
	return `import ${names} from '${
		new URL(path + '.js', import.meta.url).href
	}';`;
});

async function harness() {
	let cursor = 0;
	const slots = [];
	const effects = [];
	const cleanups = [];
	const queries = new Map();
	const runtime = {
		refreshes: 0,
		updates: 0,
		timers: [],
		posts: [],
		notifications: [],
		dismissed: [],
		options: null,
		setTimeout: (callback, delay) => {
			const timer = { callback, delay, active: true };
			runtime.timers.push(timer);
			return timer;
		},
		clearTimeout: (timer) => {
			timer.active = false;
		},
		post: async (body) => ({ ...body, id: 5, status: 'PENDING' }),
		getWaterMotorStatus: async () => null,
		getWaterMachines: async () => ({ machines: [] }),
		postWaterMotorCommand: (body) => {
			runtime.posts.push(body);
			return runtime.post(body);
		},
		useState(initial) {
			const index = cursor++;
			if (!(index in slots)) {
				slots[index] = initial;
			}
			return [
				slots[index],
				(value) => {
					runtime.updates++;
					slots[index] =
						typeof value === 'function' ? value(slots[index]) : value;
				},
			];
		},
		useRef(initial) {
			const index = cursor++;
			if (!(index in slots)) {
				slots[index] = { current: initial };
			}
			return slots[index];
		},
		useEffect(callback, deps) {
			const index = cursor++;
			if (!slots[index] || deps.some((dep, i) => dep !== slots[index][i])) {
				slots[index] = deps;
				effects.push(() => {
					cleanups[index]?.();
					cleanups[index] = callback();
				});
			}
		},
		useQuery(options) {
			if (options.queryKey.includes('motor-command')) {
				runtime.options = options;
			} else {
				runtime.feedbackOptions = options;
			}
			return (
				queries.get(JSON.stringify(options.queryKey)) ?? {
					isSuccess: false,
					isError: false,
					data: undefined,
				}
			);
		},
		useMutation: (options) => ({
			mutateAsync: (body) => options.mutationFn(body),
		}),
		useQueryClient: () => runtime.client,
		client: {
			invalidateQueries: async () => {
				runtime.refreshes++;
			},
		},
	};
	globalThis.__motorHookRuntime = runtime;
	const { default: useCommand } = await import(
		`data:text/javascript;base64,${Buffer.from(
			'const { setTimeout, clearTimeout } = globalThis.__motorHookRuntime;\n' +
				source +
				'\n// ' +
				Math.random()
		).toString('base64')}`
	);
	delete globalThis.__motorHookRuntime;
	const machine = {
		slave_id: 12,
		device_uid: 'UID',
		motor_id: 3,
		latest_ts: new Date(Date.now() - 60000).toISOString(),
		status: 'ONLINE',
		slave_name: 'STP Garden Outlet',
		control_mode: 'AUTO',
		motor_run_state: 0,
		last_command: null,
	};
	const args = {
		deviceUid: 'UID',
		machines: [machine],
		scope: 'user',
		listKey: ['list'],
		failed: false,
		notify: {
			showToast: (message, severity, options) =>
				runtime.notifications.push({ message, severity, ...options }),
			dismissToast: (id) => runtime.dismissed.push(id),
		},
	};
	return {
		runtime,
		machine,
		args,
		render() {
			cursor = 0;
			// The deterministic adapter above supplies the hook runtime.
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const value = useCommand(args);
			while (effects.length) {
				effects.shift()();
			}
			return value;
		},
		status(command, error = null) {
			queries.set(JSON.stringify(runtime.options.queryKey), {
				data: command,
				isSuccess: !error,
				isError: Boolean(error),
				error,
			});
		},
		feedback(machines, error = null) {
			queries.set(JSON.stringify(args.listKey), {
				data: { machines },
				isError: Boolean(error),
				isSuccess: !error,
				error,
			});
		},
		unmount() {
			cleanups.forEach((cleanup) => cleanup?.());
		},
	};
}

test('202 submission locks sibling motors synchronously and resolves only from backend status', async () => {
	const h = await harness();
	let resolve;
	h.runtime.post = (body) =>
		new Promise((done) => {
			resolve = () => done({ ...body, id: 5, status: 'PENDING' });
		});
	let state = h.render();
	const first = state.submit(h.machine, 1);
	await state.submit({ ...h.machine, motor_id: 4 }, 0);
	assert.equal(h.runtime.posts.length, 1);
	assert.equal(h.render().locked, true);
	resolve();
	await first;
	state = h.render();
	assert.equal(state.locked, true);
	assert.equal(h.runtime.options.queryKey.at(-1), 5);
	assert.equal(h.machine.motor_run_state, 0);
	h.status({ id: 5, status: 'PUBLISHED' });
	state = h.render();
	assert.equal(state.locked, true);
	h.status({ id: 5, status: 'ACKED' });
	state = h.render();
	assert.equal(state.locked, true); // waits for machine-list refresh
	await Promise.resolve();
	state = h.render();
	assert.equal(state.locked, true); // ACK alone never confirms the physical motor
	assert.equal(h.machine.motor_run_state, 0);
	assert.equal(
		h.runtime.notifications.filter((notice) => notice.severity === 'success')
			.length,
		0
	);
	h.machine.motor_run_state = 1;
	h.machine.latest_ts = new Date(Date.now() + 1000).toISOString();
	h.feedback([h.machine]);
	h.render();
	await Promise.resolve();
	state = h.render();
	assert.equal(state.locked, false);
	assert.ok(h.runtime.refreshes >= 1);
	assert.equal(
		h.runtime.notifications.at(-1).message,
		'STP Garden Outlet motor turned ON successfully.'
	);
	h.unmount();
});

test('409 and 502 reconcile device status without retrying POST or unlocking unresolved commands', async () => {
	for (const code of [409, 502]) {
		const h = await harness();
		h.runtime.post = async () => {
			throw { status: code, data: { detail: 'MQTT publish failed' } };
		};
		await h.render().submit(h.machine, 1);
		let state = h.render();
		assert.equal(h.runtime.posts.length, 1);
		assert.equal(state.locked, true);
		assert.match(state.error, code === 409 ? /already in progress/ : /MQTT/);
		assert.match(
			h.runtime.notifications.at(-1).message,
			code === 409
				? /Another motor operation is in progress/
				: /could not be delivered/
		);
		assert.equal(
			h.runtime.notifications.at(-1).id,
			h.runtime.notifications[0].id
		);
		assert.match(String(h.runtime.options.queryKey.at(-1)), /device-/);
		h.status({ id: 8, status: code === 409 ? 'PUBLISHED' : 'FAILED' });
		h.render();
		state = h.render(); // switches from UID to specific command ID
		assert.equal(h.runtime.options.queryKey.at(-1), 8);
		h.status({ id: 8, status: code === 409 ? 'PUBLISHED' : 'FAILED' });
		state = h.render();
		await Promise.resolve();
		state = h.render();
		assert.equal(state.locked, code === 409);
		h.unmount();
	}
});

test('remount reconciles last_command; transient status errors keep device locked; unmount suppresses late state', async () => {
	const h = await harness();
	h.machine.last_command = { id: 9, motor_id: 3, status: 'PENDING' };
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.options.enabled, true);
	h.status(undefined, new Error('Network unavailable'));
	assert.equal(h.render().locked, true);
	assert.equal(
		h.runtime.options.refetchInterval({ state: { status: 'error' } }),
		2000
	);
	h.status({ id: 9, status: 'TIMED_OUT' });
	h.render();
	await Promise.resolve();
	assert.equal(h.render().locked, false);
	h.unmount();
});

test('unmount during submission suppresses late completion state updates', async () => {
	const h = await harness();
	let finish;
	h.runtime.post = () =>
		new Promise((resolve) => {
			finish = resolve;
		});
	const request = h.render().submit(h.machine, 1);
	h.unmount();
	const updates = h.runtime.updates;
	finish({ id: 5, status: 'PENDING' });
	await request;
	assert.equal(h.runtime.updates, updates);
});

test('a newer backend command replaces a prior null device reconciliation and locks controls', async () => {
	const h = await harness();
	h.runtime.post = async () => {
		throw new Error('Network unavailable');
	};
	await h.render().submit(h.machine, 1);
	h.render();
	h.status(null);
	h.render();
	await Promise.resolve();
	assert.equal(h.render().locked, false);
	h.machine.last_command = { id: 30, motor_id: 3, status: 'PENDING' };
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.options.queryKey.at(-1), 30);
	h.unmount();
});

test('AUTO-mode ON and OFF requests use the verified device channel without changing feedback', async () => {
	for (const command of [1, 0]) {
		const h = await harness();
		delete h.machine.motor_id;
		h.machine.slave_index = 2;
		h.machine.control_mode = ' AUTO ';
		h.machine.motor_run_state = command === 0 ? 1 : 0;
		const initialFeedback = h.machine.motor_run_state;
		await h.render().submit(h.machine, command);
		assert.deepEqual(h.runtime.posts, [
			{ device_uid: 'UID', motor_id: 2, command },
		]);
		assert.equal(h.machine.motor_run_state, initialFeedback);
		assert.equal(h.render().locked, true);
		h.unmount();
	}
});

test('missing mapping, offline feedback and unknown mode never submit commands', async () => {
	for (const condition of [
		'mapping',
		'offline',
		'mode',
		'manual',
		'null-mode',
	]) {
		const h = await harness();
		if (condition === 'mapping') {
			delete h.machine.motor_id;
		}
		if (condition === 'offline') {
			h.machine.status = 'OFFLINE';
		}
		if (condition === 'mode') {
			h.machine.control_mode = 'unknown';
		}
		if (condition === 'manual') {
			h.machine.control_mode = 'manual';
		}
		if (condition === 'null-mode') {
			h.machine.control_mode = null;
		}
		await h.render().submit(h.machine, 1);
		assert.equal(h.runtime.posts.length, 0);
		h.unmount();
	}
});

test('backend-prohibited remote commands remain disabled and are never retried automatically', async () => {
	const h = await harness();
	h.runtime.post = async () => {
		throw { status: 403, data: { message: 'Not authorized for this device' } };
	};
	await h.render().submit(h.machine, 1);
	const state = h.render();
	assert.equal(state.locked, true);
	assert.match(state.blockedReason, /denied by the backend/);
	assert.match(state.error, /Not authorized/);
	await state.submit(h.machine, 0);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('AUTO operation uses existing backend authorization without an undocumented eligibility flag', async () => {
	const h = await harness();
	const state = h.render();
	assert.equal(state.blockedReason, '');
	await state.submit(h.machine, 1);
	assert.equal(h.runtime.posts.length, 1);
	assert.equal(h.runtime.notifications[0].loading, true);
	h.unmount();
});

test('ACK without fresh physical feedback keeps loading and lock until the confirmation window ends', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	const loading = h.runtime.notifications[0];
	assert.equal(
		loading.message,
		'Starting STP Garden Outlet motor... Please wait.'
	);
	assert.equal(loading.loading, true);
	h.status({ id: 5, status: 'ACKED', requested_at: new Date().toISOString() });
	h.render();
	await Promise.resolve();
	h.render();
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.feedbackOptions.enabled, true);
	assert.equal(h.runtime.notifications.length, 1);
	const timer = h.runtime.timers.findLast(
		(item) => item.active && item.delay <= 30000
	);
	assert.ok(timer.delay <= 30000 && timer.delay > 0);
	timer.callback();
	const result = h.render();
	assert.equal(result.locked, false);
	assert.equal(h.runtime.feedbackOptions.enabled, false);
	assert.equal(h.runtime.notifications.at(-1).id, loading.id);
	assert.equal(h.runtime.notifications.at(-1).severity, 'warning');
	assert.match(h.runtime.notifications.at(-1).message, /not yet confirmed/);
	assert.equal(h.machine.motor_run_state, 0);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('a running AUTO motor can request OFF and only fresh Stopped feedback completes its loading toast', async () => {
	const h = await harness();
	h.machine.motor_run_state = 1;
	await h.render().submit(h.machine, 0);
	h.render();
	assert.equal(h.runtime.posts[0].command, 0);
	assert.equal(h.machine.motor_run_state, 1);
	assert.equal(
		h.runtime.notifications[0].message,
		'Stopping STP Garden Outlet motor... Please wait.'
	);
	h.status({ id: 5, status: 'ACKED', requested_at: new Date().toISOString() });
	h.render();
	await Promise.resolve();
	h.render();
	assert.equal(h.runtime.notifications.length, 1);
	h.machine.motor_run_state = 0;
	h.machine.latest_ts = new Date(Date.now() + 1000).toISOString();
	h.feedback([h.machine]);
	h.render();
	h.render();
	assert.equal(
		h.runtime.notifications.at(-1).message,
		'STP Garden Outlet motor turned OFF successfully.'
	);
	assert.equal(
		h.runtime.notifications.at(-1).id,
		h.runtime.notifications[0].id
	);
	assert.equal(
		h.runtime.timers.every((timer) => !timer.active),
		true
	);
	h.unmount();
});

test('backend timeout and delivery failure dismiss loading without changing actual motor feedback', async () => {
	for (const status of ['TIMED_OUT', 'FAILED']) {
		const h = await harness();
		await h.render().submit(h.machine, 1);
		h.render();
		h.status({ id: 5, status });
		h.render();
		await Promise.resolve();
		h.render();
		assert.equal(h.runtime.notifications.at(-1).severity, 'error');
		assert.match(
			h.runtime.notifications.at(-1).message,
			status === 'TIMED_OUT'
				? /response was not received/
				: /could not be delivered/
		);
		assert.equal(h.machine.motor_run_state, 0);
		assert.equal(h.runtime.posts.length, 1);
		h.unmount();
	}
});

test('unmount while waiting for physical feedback dismisses loading and clears confirmation timer', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.status({ id: 5, status: 'ACKED' });
	h.render();
	h.render();
	const count = h.runtime.notifications.length;
	h.unmount();
	assert.equal(h.runtime.dismissed.length, 1);
	assert.equal(
		h.runtime.timers.every((timer) => !timer.active),
		true
	);
	for (const timer of h.runtime.timers) {
		timer.callback();
	}
	assert.equal(h.runtime.notifications.length, count);
});

test('status verification errors end the loading notification without retrying the physical command', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.status(undefined, new Error('Temporary network failure'));
	h.render();
	assert.equal(h.runtime.notifications.at(-1).severity, 'warning');
	assert.equal(h.runtime.posts.length, 1);
	assert.equal(h.render().locked, true);
	h.unmount();
});

test('a superseding backend command ends the prior user operation but keeps the device locked', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.machine.last_command = { id: 6, motor_id: 3, status: 'PUBLISHED' };
	h.render();
	h.render();
	assert.equal(h.runtime.notifications.at(-1).severity, 'warning');
	assert.equal(h.runtime.posts.length, 1);
	assert.equal(h.render().locked, true);
	h.unmount();
});

test('frontend deadline ends a stalled acknowledgment once, retaining backend lock without resending', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	const timer = h.runtime.timers.findLast(
		(item) => item.active && item.delay > 30000
	);
	assert.ok(timer.delay <= 120000);
	timer.callback();
	const state = h.render();
	assert.equal(h.runtime.notifications.at(-1).severity, 'warning');
	assert.match(h.runtime.notifications.at(-1).message, /STP Garden Outlet/);
	assert.equal(state.locked, true);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('a late POST response cannot revive a loading toast after the frontend deadline', async () => {
	const h = await harness();
	let finish;
	h.runtime.post = () =>
		new Promise((resolve) => {
			finish = resolve;
		});
	const request = h.render().submit(h.machine, 1);
	h.render();
	h.runtime.timers.findLast((item) => item.active).callback();
	h.render();
	const notices = h.runtime.notifications.length;
	finish({ id: 5, status: 'PENDING' });
	await request;
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.notifications.length, notices);
	assert.equal(h.runtime.notifications.at(-1).severity, 'warning');
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});
