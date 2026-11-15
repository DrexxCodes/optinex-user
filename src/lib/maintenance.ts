// Single source of truth for maintenance mode. Kept dependency-free so it is
// safe to import from the proxy (edge-friendly) as well as server components.
//
// Flip the switch by setting `MAINTAIN=1` in the environment and restarting /
// redeploying. Any other value (or unset) leaves the app running normally.
export const MAINTENANCE_PATH = '/maintenance';

export function isMaintenanceMode(): boolean {
  return process.env.MAINTAIN?.trim() === '1';
}
