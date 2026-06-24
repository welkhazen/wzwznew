/**
 * Minimal analytics client shape used internally. The production analytics
 * backend is wired at app startup when configured; otherwise `track()` etc.
 * fall back to dev-mode console logs.
 */
export interface AnalyticsClient {
  capture: (name: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  alias?: (newId: string, previousId: string) => void;
  reset: () => void;
  group: (
    groupType: string,
    groupKey: string,
    traits?: Record<string, unknown>,
  ) => void;
  register: (props: Record<string, unknown>) => void;
  get_distinct_id?: () => string;
}

let client: AnalyticsClient | null = null;

export function setClient(next: AnalyticsClient | null): void {
  client = next;
}

export function getClient(): AnalyticsClient | null {
  return client;
}
