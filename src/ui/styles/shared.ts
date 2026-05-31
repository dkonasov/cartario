import { reset } from "@ui/styles/reset";
import { tokens } from "@ui/styles/tokens";

// Usage: `static styles = [shared, css`...`]`.
export const shared = [tokens, reset] as const;
