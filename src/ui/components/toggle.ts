import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("cartario-toggle")
export class CartarioToggle extends LitElement {
  @property({ type: Boolean }) checked = false;

  @property({ type: String }) label = "";

  @property({ type: String }) id = "";

  private toggle() {
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`<input id=${this.id} type="checkbox" ?checked=${this.checked} @change=${this.toggle}
      ><label for=${this.id}>${this.label}</label></input
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cartario-toggle": CartarioToggle;
  }
}
