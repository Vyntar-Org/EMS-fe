import { Loading } from './Loading';

// Design-system-facing name for the app's standard loading visual
// (dual-ring spinner + pulse). Re-exports Loading so existing call sites
// keep working while new pages adopt the common naming.
const LoadingState = Loading;

export default LoadingState;
