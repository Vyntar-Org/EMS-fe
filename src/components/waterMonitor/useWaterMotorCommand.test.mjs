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
		statusRefreshes: 0,
		updates: 0,
		timers: [],
		posts: [],
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
			return {
				refetch: async () => {
					runtime.statusRefreshes++;
				},
				...(queries.get(JSON.stringify(options.queryKey)) ?? {
					isSuccess: false,
					isError: false,
					data: undefined,
				}),
			};
		},
		useMutation: (options) => ({
			mutateAsync: (body) => options.mutationFn(body),
		}),
		useQueryClient: () => runtime.client,
		client: {
			invalidateQueries: async () => {
				runtime.refreshes++;
			},
			fetchQuery: async ({ queryFn }) => {
				runtime.refreshes++;
				return queryFn({});
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
		control_mode: 'auto',
		remote_control_eligible: true,
		control_strategy: 'REMOTE',
		motor_run_state: 0,
		last_command: null,
	};
	const args = {
		deviceUid: 'UID',
		machines: [machine],
		scope: 'user',
		listKey: ['list'],
		failed: false,
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
	assert.equal(state.dialog?.message, undefined);
	h.machine.motor_run_state = 1;
	h.machine.latest_ts = new Date(Date.now() + 1000).toISOString();
	h.feedback([h.machine]);
	h.render();
	await Promise.resolve();
	state = h.render();
	assert.equal(state.locked, false);
	assert.ok(h.runtime.refreshes >= 1);
	assert.equal(state.dialog.message, 'Motor Started Successfully');
	assert.equal(state.dialog.severity, 'success');
	assert.equal(h.runtime.timers.at(-1).delay, 1200);
	h.runtime.timers.at(-1).callback();
	assert.equal(h.render().dialog, null);
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
			state.dialog.message,
			code === 409
				? /Another motor operation is in progress/
				: /could not be sent/
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

test('eligible REMOTE ON and OFF requests use the verified device channel without changing feedback', async () => {
	for (const command of [1, 0]) {
		const h = await harness();
		delete h.machine.motor_id;
		h.machine.slave_index = 2;
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

test('submit rejects unavailable motor control even when invoked directly', async () => {
	for (const changes of [
		{ motor_id: undefined },
		{ status: 'OFFLINE' },
		{ motor_run_state: null },
		{ control_mode: 'manual' },
		{ control_mode: 'manual', control_strategy: null },
		{ control_mode: null },
		{ control_mode: undefined },
		{ remote_control_eligible: false },
		{ remote_control_eligible: undefined },
	]) {
		const h = await harness();
		Object.assign(h.machine, changes);
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

test('eligible Auto operation opens the command dialog regardless of strategy', async () => {
	const h = await harness();
	h.machine.control_strategy = 'LEVEL';
	const state = h.render();
	assert.equal(state.blockedReason, '');
	await state.submit(h.machine, 1);
	assert.equal(h.runtime.posts.length, 1);
	assert.equal(h.render().dialog?.action, 1);
	h.unmount();
});

test('ACK alone stays pending until the 15-second deadline', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	assert.equal(h.render().dialog.name, 'STP Garden Outlet');
	assert.equal(h.runtime.feedbackOptions.enabled, true);
	h.status({ id: 5, status: 'ACKED', requested_at: new Date().toISOString() });
	h.render();
	await Promise.resolve();
	assert.equal(h.render().locked, true);
	const timer = h.runtime.timers.findLast((item) => item.active);
	assert.ok(timer.delay <= 15000 && timer.delay > 0);
	timer.callback();
	const result = h.render();
	assert.equal(h.runtime.feedbackOptions.enabled, false);
	assert.equal(result.dialog.severity, 'warning');
	assert.equal(
		result.dialog.message,
		'Motor is not responding. Please try again.'
	);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('a running AUTO motor can request OFF and fresh Stopped feedback closes the modal', async () => {
	const h = await harness();
	h.machine.motor_run_state = 1;
	await h.render().submit(h.machine, 0);
	assert.equal(h.render().dialog.action, 0);
	assert.equal(h.runtime.posts[0].command, 0);
	assert.equal(h.machine.motor_run_state, 1);
	h.status({ id: 5, status: 'ACKED' });
	h.render();
	await Promise.resolve();
	assert.equal(h.render().dialog.message, undefined);
	h.machine.motor_run_state = 0;
	h.machine.latest_ts = new Date(Date.now() + 1000).toISOString();
	h.feedback([h.machine]);
	h.render();
	assert.equal(h.render().dialog.message, 'Motor Stopped Successfully');
	assert.equal(h.render().dialog.severity, 'success');
	h.runtime.timers.at(-1).callback();
	assert.equal(h.render().dialog, null);
	assert.equal(
		h.runtime.timers.every((timer) => !timer.active),
		true
	);
	h.unmount();
});

test('backend failures and HTTP or network errors show friendly modal messages', async () => {
	for (const status of ['TIMED_OUT', 'FAILED']) {
		const h = await harness();
		await h.render().submit(h.machine, 1);
		h.render();
		h.status({ id: 5, status });
		h.render();
		assert.match(
			h.render().dialog.message,
			status === 'TIMED_OUT'
				? /^Motor is not responding\. Please try again\.$/
				: /^Motor operation failed\. Please try again\.$/
		);
		assert.equal(h.machine.motor_run_state, 0);
		h.unmount();
	}
	for (const [failure, message] of [
		[{ status: 500 }, /^Internal server error\. Please try again\.$/],
		[
			new TypeError('Failed to fetch'),
			/^Unable to connect to the server\. Please try again\.$/,
		],
	]) {
		const h = await harness();
		h.runtime.post = async () => {
			throw failure;
		};
		await h.render().submit(h.machine, 1);
		assert.match(h.render().dialog.message, message);
		assert.equal(h.runtime.timers.at(-1).delay, 2500);
		h.runtime.timers.at(-1).callback();
		assert.equal(h.render().dialog, null);
		assert.equal(h.runtime.posts.length, 1);
		h.unmount();
	}
});

test('unmount clears the pending deadline and suppresses late updates', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.unmount();
	assert.equal(
		h.runtime.timers.every((timer) => !timer.active),
		true
	);
	const count = h.runtime.updates;
	h.runtime.timers.forEach((timer) => timer.callback());
	assert.equal(h.runtime.updates, count);
});

test('transient status errors keep checking until the deadline without resending', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.status(undefined, new Error('Temporary network failure'));
	assert.equal(h.render().dialog.message, undefined);
	h.runtime.timers.findLast((item) => item.active).callback();
	const state = h.render();
	assert.equal(state.dialog.severity, 'warning');
	assert.equal(state.locked, true);
	await state.refreshStatus();
	assert.equal(h.runtime.statusRefreshes, 1);
	assert.equal(h.runtime.refreshes, 1);
	const dismissal = h.runtime.timers.findLast((item) => item.active);
	assert.equal(dismissal.delay, 2500);
	dismissal.callback();
	assert.equal(h.runtime.refreshes, 2);
	assert.equal(h.render().dialog, null);
	assert.equal(h.render().locked, true);
	await h.render().submit(h.machine, 1);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('a superseding command ends the prior modal wait while keeping the device locked', async () => {
	const h = await harness();
	await h.render().submit(h.machine, 1);
	h.render();
	h.machine.last_command = { id: 6, motor_id: 3, status: 'PUBLISHED' };
	h.render();
	assert.equal(h.render().dialog.severity, 'warning');
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});

test('a late POST response continues tracking without reviving the loading modal', async () => {
	const h = await harness();
	let finish;
	h.runtime.post = () =>
		new Promise((resolve) => {
			finish = resolve;
		});
	const request = h.render().submit(h.machine, 1);
	h.render();
	const timer = h.runtime.timers.findLast((item) => item.active);
	assert.ok(timer.delay <= 15000 && timer.delay > 0);
	timer.callback();
	const result = h.render().dialog;
	assert.equal(result.severity, 'warning');
	finish({ id: 5, status: 'PENDING' });
	await request;
	assert.deepEqual(h.render().dialog, result);
	assert.equal(h.render().locked, true);
	assert.equal(h.runtime.options.queryKey.at(-1), 5);
	h.runtime.timers.findLast((item) => item.active).callback();
	assert.equal(h.render().dialog, null);
	assert.equal(h.render().locked, true);
	assert.equal(h.machine.motor_run_state, 0);
	await h.render().submit(h.machine, 1);
	assert.equal(h.runtime.posts.length, 1);
	h.unmount();
});
