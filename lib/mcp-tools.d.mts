export function search_components(a: { query: string }): { name: string; description: string }[];
export function get_tokens(a: { component: string }): { token: string; value: string }[];
export function get_usage_rules(): string[];
export function check_contrast(a: { fg: string; bg: string }): { ratio: number; passesAA: boolean };
export const registryData: { components: { name: string; description: string; tokens: string[] }[]; usageRules: string[] };
