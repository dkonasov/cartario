import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { css } from "lit";

@customElement("flashcard-view")
export class FlashcardView extends LitElement {
  @property({ type: String }) front: string = "";
  @property({ type: String }) back: string = "";
  @property({ type: Boolean }) revealed: boolean = false;

  static styles = css`
    :host {
      display: block;
    }

    .flashcard-container {
      perspective: 1000px;
      height: 400px;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }

    .flashcard {
      width: 100%;
      max-width: 500px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 40px;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      position: relative;
    }

    .flashcard-content {
      font-size: 24px;
      line-height: 1.6;
      word-wrap: break-word;
      word-break: break-word;
      max-height: 80%;
      overflow-y: auto;
    }

    .flashcard-label {
      font-size: 12px;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }

    .show-answer-button {
      margin-top: 30px;
      padding: 12px 24px;
      background-color: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      color: white;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .show-answer-button:hover {
      background-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .show-answer-button:active {
      transform: scale(0.95);
    }

    .back-side {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  `;

  private handleReveal() {
    const event = new CustomEvent("reveal", {
      detail: {},
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    const cardClass = this.revealed ? "flashcard back-side" : "flashcard";
    const content = this.revealed ? this.back : this.front;
    const label = this.revealed ? "Answer" : "Question";

    return html`
      <div class="flashcard-container">
        <div class="${cardClass}">
          <div class="flashcard-label">${label}</div>
          <div class="flashcard-content">${content}</div>
          ${!this.revealed
            ? html`<button class="show-answer-button" @click=${this.handleReveal}>
                Show Answer
              </button>`
            : html``}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "flashcard-view": FlashcardView;
  }
}
