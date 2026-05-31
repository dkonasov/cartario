import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { css } from "lit";
import type { Grade } from "@domain/models/review";

@customElement("rating-bar")
export class RatingBar extends LitElement {
  @property({ type: Boolean }) disabled: boolean = false;

  static styles = css`
    :host {
      display: block;
    }

    .rating-container {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .rating-button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 1px;
      min-width: 100px;
    }

    .rating-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .rating-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .rating-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .again {
      background-color: #ef5350;
      color: white;
    }

    .again:hover:not(:disabled) {
      background-color: #e53935;
    }

    .hard {
      background-color: #ffa726;
      color: white;
    }

    .hard:hover:not(:disabled) {
      background-color: #fb8c00;
    }

    .good {
      background-color: #66bb6a;
      color: white;
    }

    .good:hover:not(:disabled) {
      background-color: #43a047;
    }

    .easy {
      background-color: #29b6f6;
      color: white;
    }

    .easy:hover:not(:disabled) {
      background-color: #0288d1;
    }
  `;

  private handleRate(grade: Grade) {
    const event = new CustomEvent("rate", {
      detail: { grade },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <div class="rating-container">
        <button
          class="rating-button again"
          @click=${() => this.handleRate("again")}
          ?disabled=${this.disabled}
        >
          Again
        </button>
        <button
          class="rating-button hard"
          @click=${() => this.handleRate("hard")}
          ?disabled=${this.disabled}
        >
          Hard
        </button>
        <button
          class="rating-button good"
          @click=${() => this.handleRate("good")}
          ?disabled=${this.disabled}
        >
          Good
        </button>
        <button
          class="rating-button easy"
          @click=${() => this.handleRate("easy")}
          ?disabled=${this.disabled}
        >
          Easy
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rating-bar": RatingBar;
  }
}
