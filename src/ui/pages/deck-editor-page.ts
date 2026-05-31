import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { css } from "lit";
import type { DeckService } from "@application/deck-service";
import { deckServiceContext } from "@ui/context";
import type { Deck } from "@domain/models/deck";

@customElement("deck-editor-page")
export class DeckEditorPage extends LitElement {
  @property() deckId?: string;
  @property() isEdit: boolean = false;
  @consume({ context: deckServiceContext, subscribe: true }) private deckService?: DeckService;

  @state() private deck?: Deck | null;
  @state() private name: string = "";
  @state() private description: string = "";
  @state() private loading: boolean = true;
  private loadedDeckId?: string;

  protected updated(): void {
    if (!this.deckId) {
      this.loading = false;
      return;
    }

    if (this.deckService && this.loadedDeckId !== this.deckId) {
      this.loadedDeckId = this.deckId;
      void this.loadDeck();
    }
  }

  private async loadDeck(): Promise<void> {
    if (!this.deckId || !this.deckService) return;

    this.loading = true;
    try {
      this.deck = await this.deckService.get(this.deckId);
      if (this.deck) {
        this.name = this.deck.name;
        this.description = this.deck.description;
      }
    } finally {
      this.loading = false;
    }
  }

  private handleBack(): void {
    if (this.deckId && this.isEdit) {
      window.location.hash = `#/decks/${this.deckId}`;
    } else {
      window.location.hash = "#/";
    }
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.deckService) return;

    try {
      const now = Date.now();
      if (this.isEdit && this.deckId) {
        await this.deckService.update(this.deckId, {
          name: this.name,
          description: this.description,
          now,
        });
        window.location.hash = `#/decks/${this.deckId}`;
      } else {
        const created = await this.deckService.create({
          name: this.name,
          description: this.description,
          now,
        });
        window.location.hash = `#/decks/${created.id}`;
      }
    } catch (error) {
      console.error("Failed to save deck:", error);
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

    const title = this.isEdit ? "Edit Deck" : "Create New Deck";

    return html`
      <div class="header">
        <div class="header-left">
          <button class="back-button" @click=${this.handleBack}>←</button>
          <h1>${title}</h1>
        </div>
      </div>

      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label for="name">Deck Name</label>
          <input
            id="name"
            type="text"
            .value=${this.name}
            @input=${(e: Event) => {
              this.name = (e.target as HTMLInputElement).value;
            }}
            placeholder="e.g., Spanish Vocabulary"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            .value=${this.description}
            @input=${(e: Event) => {
              this.description = (e.target as HTMLTextAreaElement).value;
            }}
            placeholder="Optional description for this deck..."
          ></textarea>
        </div>

        <div class="actions">
          <button type="button" class="cancel-button" @click=${this.handleBack}>Cancel</button>
          <button type="submit" class="submit-button">
            ${this.isEdit ? "Save Changes" : "Create Deck"}
          </button>
        </div>
      </form>
    `;
  }
}
