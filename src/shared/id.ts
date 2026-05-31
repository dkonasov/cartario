export function newId(): string {
  // Prefer crypto.randomUUID when available.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for older browsers.
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
