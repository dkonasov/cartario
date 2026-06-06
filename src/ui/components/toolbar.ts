import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "@ui/components/godmod-toggle";

@customElement("cartario-toolbar")
export class CartarioToolbar extends LitElement {
  render() {
    return html`
      <div class="toolbar">
        <cartario-godmod-toggle></cartario-godmod-toggle>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cartario-toolbar": CartarioToolbar;
  }
}
