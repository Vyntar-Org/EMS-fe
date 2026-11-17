# Water Monitoring motor-control integration

## Current control requirement

AUTO mode allows ON/OFF requests when the device is ONLINE, the verified motor
channel and actual feedback are available, no operation is unresolved, and no
backend denial has been received. MANUAL and unknown modes remain disabled.
The undocumented frontend commissioning/interlock gate has been removed at the
user's request. Authorization is still enforced by the existing Django endpoint;
no permission denial, pending-command lock, or physical-feedback check is bypassed.

Inspected local backend source:

- `E:/EMS-backend/apps/common/permissions.py`: authenticated application access.
- `E:/EMS-backend/apps/applications/oht/apis/motor_control.py`: active OHT device,
  device/admin or user/slave membership, and one unresolved command per device.
  Line 134 maps the device-specific motor channel to `slave_index`.
- `E:/EMS-backend/apps/devices/models.py`: device activity and slave/channel data.
- `E:/EMS-backend/apps/applications/oht/models.py`: telemetry, tank configuration
  and command lifecycle records.
- `E:/EMS-backend/apps/applications/oht/apis/machines.py` and `oht/urls.py`:
  no per-motor commissioning/interlock eligibility field or endpoint.

The backend source does not expose commissioning or interlock status. The frontend
makes no claim that those checks were performed. Adding such a backend contract
is an optional backend improvement, not a prerequisite imposed by this frontend.
No backend, database, MQTT, JWT or routing code was changed.

## Frontend behavior

- The card shows actual control mode, actual motor feedback and one compact
  feedback-driven switch. Technical command panels and raw backend errors are
  hidden from the card.
- MANUAL is disabled with the requested tooltip and gray styling, while a
  running motor stays visibly ON. AUTO can request OFF while running and ON
  while stopped when the current checks listed above pass.
- A local confirmation dialog identifies the machine and requested action.
  Cancel never submits. Confirmation rechecks current feedback and control conditions.
- The existing authenticated API client and shared MUI PremiumToast provider
  are reused. Optional named/loading notifications preserve existing callers'
  default four-second toast behavior.
- Each device operation has one stable notification ID and one shared device
  lock. The same toast is updated with a final result; polling never resends
  the physical command or creates extra loading toasts.
- Command status is polled internally. ACKED triggers shared machine-list
  polling every two seconds. Success requires ONLINE feedback for the selected
  slave/device, matching the requested state, newer than the pre-request sample,
  and at/after the backend request time (or local submission time if absent).
- The 30-second **physical-feedback confirmation window** starts after ACKED.
  It can end with an unconfirmed warning; it never writes a backend timeout or
  optimistically changes motor feedback. Pending backend commands remain locked.
- HTTP 409, 502, backend FAILED/TIMED_OUT, status errors, superseding commands
  and unmount have explicit outcomes. A backend permission denial stays blocked.
- An application-level WaterMotorOperations session retains the per-device hooks
  across internal route changes. Search and machine-list refreshes do not unmount
  the command observers or dismiss progress. Sessions reset when the user changes.
- Notifications snapshot the configured motor name or slave_name at confirmation.
  All final outcomes update the same named toast; success expires after four seconds.
- A separate 120-second frontend operation deadline covers stalled submission and
  acknowledgment as well as feedback. It never resends a command, invents a backend
  timeout, or lets a late POST response revive an expired loading toast. Unresolved
  backend commands retain their device lock.
- Pending/status queries consume cancellation signals. Timers and loading toasts
  are cleaned up on session unmount. Browser reload persistence is not implemented;
  revisiting Machine List reconciles pending last_command data with backend status.

## Verification

- 64 Node tests pass, covering existing functionality plus fresh/stale feedback,
  ON/OFF transitions, wrong equipment, ACK-only outcomes, backend authorization denial,
  device locks, 409/502, FAILED/TIMED_OUT, unconfirmed outcomes, supersession and
  cleanup. Command transport and confirmation timers are mocked.
- Isolated actual-component browser checks: running AUTO can open OFF
  confirmation; Cancel calls no mock submit; confirmation submits once with the
  selected UID/channel; the toggle remains ON until actual feedback changes;
  running MANUAL stays checked/disabled and cannot activate by mouse/keyboard;
  no technical command text is visible.
- Shared toast browser checks: loading spinner, update to one success toast with
  the same ID, independent device IDs and legacy default notification coexist.
- The dialog fits a 360x640 viewport with no horizontal overflow. No component
  console exceptions were observed. Browser fixtures sent **zero network motor
  requests**; no hardware was operated.

These are frontend tests, not evidence of live deployment eligibility or physical
motor operation. The existing backend endpoint remains authoritative for command authorization.
