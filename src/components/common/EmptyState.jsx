import NoDataFound from './errors/NoDataFound';

// Design-system-facing name for the app's standard empty-state visual
// (icon chip + message). Re-exports NoDataFound so existing call sites
// keep working while new pages adopt the common naming.
const EmptyState = NoDataFound;

export default EmptyState;
