import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "@ui/components/toggle";
import { SignalWatcher } from "@lit-labs/signals";
import { isInGodMod } from "../../state/god-mod";

@customElement("cartario-godmod-toggle")
export class CartarioGodModToggle extends SignalWatcher(LitElement) {
  toggle() {
    isInGodMod.set(!isInGodMod.get());
  }

  render() {
    return html`<cartario-toggle
      .label=${"God Mode"}
      .id=${"god-mode-toggle"}
      .checked=${isInGodMod.get()}
      @change=${this.toggle}
    ></cartario-toggle>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cartario-godmod-toggle": CartarioGodModToggle;
  }
}
