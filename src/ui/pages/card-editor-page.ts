import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { css } from "lit";
import type { CardService } from "@application/card-service";
import { cardServiceContext } from "@ui/context";
import type { Card } from "@domain/models/card";

@customElement("card-editor-page")
export class CardEditorPage extends LitElement {
  @property() deckId?: string;
  @property() cardId?: string;
  @consume({ context: cardServiceContext, subscribe: true }) private cardService?: CardService;

  @state() private card?: Card | null;
  @state() private front: string = "";
  @state() private back: string = "";
  @state() private loading: boolean = true;
  private loadedCardId?: string;

  protected updated(): void {
    // For create mode (no cardId), just set loading to false
    if (!this.cardId) {
      this.loading = false;
      return;
    }

    // For edit mode, load the card if cardId changes
    if (this.cardService && this.loadedCardId !== this.cardId) {
      this.loadedCardId = this.cardId;
      void this.loadCard();
    }
  }

  private async loadCard(): Promise<void> {
    if (!this.cardId || !this.cardService) return;

    this.loading = true;
    try {
      this.card = await this.cardService
        .listByDeck(this.deckId || "")
        .then((cards) => cards.find((c) => c.id === this.cardId) || null);
      if (this.card) {
        this.front = this.card.front;
        this.back = this.card.back;
      }
    } finally {
      this.loading = false;
    }
  }

  private handleBack(): void {
    if (this.deckId) {
      window.location.hash = `#/decks/${this.deckId}`;
    } else {
      window.location.hash = "#/";
    }
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.cardService || !this.deckId) return;

    try {
      const now = Date.now();
      if (this.cardId) {
        // Edit mode
        await this.cardService.update(this.cardId, {
          front: this.front,
          back: this.back,
          now,
        });
      } else {
        // Create mode
        await this.cardService.create({
          deckId: this.deckId,
          front: this.front,
          back: this.back,
          now,
        });
      }
      window.location.hash = `#/decks/${this.deckId}`;
    } catch (error) {
      console.error("Failed to save card:", error);
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .back-button {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #0066cc;
      padding: 0;
      line-height: 1;
    }

    .back-button:hover {
      color: #0052a3;
    }

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    label {
      font-weight: 600;
      font-size: 14px;
      color: #111;
    }

    input,
    textarea {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .submit-button {
      background-color: #0066cc;
      color: white;
      flex: 1;
    }

    .submit-button:hover {
      background-color: #0052a3;
    }

    .cancel-button {
      background-color: #f0f0f0;
      color: #333;
      flex: 1;
    }

    .cancel-button:hover {
      background-color: #e0e0e0;
    }

    .loading {
      text-align: center;
      padding: 48px 16px;
      color: #999;
    }
  `;

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <p>Loading...</p>
        </div>
      `;
    }

    const title = this.cardId ? "Edit Card" : "Add Card";

    return html`
      <div class="header">
        <div class="header-left">
          <button class="back-button" @click=${this.handleBack}>←</button>
          <h1>${title}</h1>
        </div>
      </div>

      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label for="front">Front (Question)</label>
          <textarea
            id="front"
            .value=${this.front}
            @input=${(e: Event) => {
              this.front = (e.target as HTMLTextAreaElement).value;
            }}
            placeholder="e.g., What is the capital of France?"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="back">Back (Answer)</label>
          <textarea
            id="back"
            .value=${this.back}
            @input=${(e: Event) => {
              this.back = (e.target as HTMLTextAreaElement).value;
            }}
            placeholder="e.g., Paris"
            required
          ></textarea>
        </div>

        <div class="actions">
          <button type="button" class="cancel-button" @click=${this.handleBack}>Cancel</button>
          <button type="submit" class="submit-button">
            ${this.cardId ? "Save Changes" : "Add Card"}
          </button>
        </div>
      </form>
    `;
  }
}
