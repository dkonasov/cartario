import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { css } from "lit";
import { consume } from "@lit/context";
import type { DeckService } from "@application/deck-service";
import type { CardService } from "@application/card-service";
import type { StudyService } from "@application/study-service";
import { deckServiceContext, cardServiceContext, studyServiceContext } from "@ui/context";
import type { Deck } from "@domain/models/deck";
import type { Card } from "@domain/models/card";
import { SignalWatcher } from "@lit-labs/signals";
import { isInGodMod } from "../../state/god-mod";

@customElement("deck-detail-page")
export class DeckDetailPage extends SignalWatcher(LitElement) {
  @property() deckId?: string;
  @consume({ context: deckServiceContext, subscribe: true })
  private deckService?: DeckService;
  @consume({ context: cardServiceContext, subscribe: true })
  private cardService?: CardService;
  @consume({ context: studyServiceContext, subscribe: true })
  private studyService?: StudyService;

  @state() private deck?: Deck | null;
  @state() private cards: Card[] = [];
  @state() private dueCount: number = 0;
  @state() private loading: boolean = true;
  private loadedDeckId?: string;

  protected updated(): void {
    if (!this.deckId) {
      this.loading = false;
      return;
    }

    if (this.deckService && this.cardService && this.loadedDeckId !== this.deckId) {
      this.loadedDeckId = this.deckId;
      void this.loadDeckAndCards();
    }
  }

  private async loadDeckAndCards(): Promise<void> {
    if (!this.deckId || !this.deckService || !this.cardService) return;

    this.loading = true;
    try {
      this.deck = await this.deckService.get(this.deckId);
      if (this.deck) {
        this.cards = await this.cardService.listByDeck(this.deckId);
        // Load due count
        if (this.studyService) {
          this.dueCount = await this.studyService.countDue(this.deckId);
        }
      } else {
        this.cards = [];
        this.dueCount = 0;
      }
    } finally {
      this.loading = false;
    }
  }

  private handleBack(): void {
    window.location.hash = "#/";
  }

  private handleEdit(): void {
    if (this.deck) {
      window.location.hash = `#/decks/${this.deck.id}/edit`;
    }
  }

  private handleStudy(): void {
    if (this.deck) {
      window.location.hash = `#/decks/${this.deck.id}/study`;
    }
  }

  private async handleDelete(): Promise<void> {
    if (!this.deck || !this.deckService) return;

    const confirmed = window.confirm(
      `Delete "${this.deck.name}"? This also removes all cards in the deck.`,
    );
    if (!confirmed) return;

    await this.deckService.delete(this.deck.id);
    window.location.hash = "#/";
  }

  private handleAddCard(): void {
    if (this.deck) {
      window.location.hash = `#/decks/${this.deck.id}/cards/new`;
    }
  }

  private handleEditCard(cardId: string): void {
    if (this.deck) {
      window.location.hash = `#/decks/${this.deck.id}/cards/${cardId}/edit`;
    }
  }

  private async handleDeleteCard(cardId: string): Promise<void> {
    if (!this.cardService) return;

    const confirmed = window.confirm("Delete this card?");
    if (!confirmed) return;

    await this.cardService.delete(cardId);
    // Refresh cards list
    if (this.deckId) {
      this.cards = await this.cardService.listByDeck(this.deckId);
    }
  }

  private async handleResetDue(card: Card): Promise<void> {
    if (!this.cardService) return;

    await this.cardService.update(card.id, {
      front: card.front,
      back: card.back,
      now: Date.now(),
      due: Date.now(),
    });

    if (this.deckId && this.studyService) {
      void this.cardService.listByDeck(this.deckId).then((cards) => {
        this.cards = cards;
      });

      this.dueCount = await this.studyService.countDue(this.deckId);
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
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

    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .due-count {
      font-size: 14px;
      color: #666;
    }

    button {
      padding: 8px 16px;
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: #0052a3;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .study-button {
      background-color: #28a745;
    }

    .study-button:hover:not(:disabled) {
      background-color: #218838;
    }

    .delete-button {
      background-color: #b42318;
    }

    .delete-button:hover {
      background-color: #8f1d14;
    }

    .description {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 6px;
      color: #666;
      line-height: 1.5;
    }

    .cards-section {
      margin-top: 32px;
    }

    .cards-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .cards-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .add-card-button {
      background-color: #0066cc;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .add-card-button:hover {
      background-color: #0052a3;
    }

    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-item {
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background-color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-content {
      flex: 1;
      margin-right: 16px;
    }

    .card-front {
      font-weight: 600;
      margin-bottom: 8px;
      color: #111;
    }

    .card-back {
      color: #666;
      font-size: 14px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .card-actions button {
      padding: 6px 12px;
      font-size: 12px;
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .card-actions button:hover {
      background-color: #0052a3;
    }

    .card-actions .delete-button {
      background-color: #b42318;
    }

    .card-actions .delete-button:hover {
      background-color: #8f1d14;
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: #999;
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

    if (!this.deck) {
      return html`
        <div class="empty-state">
          <p>Deck not found</p>
          <button @click=${this.handleBack}>Back to Decks</button>
        </div>
      `;
    }

    return html`
      <div class="header">
        <div class="header-left">
          <button class="back-button" @click=${this.handleBack}>←</button>
          <div class="header-name-and-due">
            <h1>${this.deck.name}</h1>
            ${this.dueCount > 0
              ? html`<div class="due-count">${this.dueCount} due today</div>`
              : html``}
          </div>
        </div>
        <div class="actions">
          <button class="study-button" @click=${this.handleStudy} ?disabled=${this.dueCount === 0}>
            Study
          </button>
          <button @click=${this.handleEdit}>Edit</button>
          <button class="delete-button" @click=${this.handleDelete}>Delete</button>
        </div>
      </div>

      ${this.deck.description
        ? html` <div class="description">${this.deck.description}</div> `
        : html``}

      <div class="cards-section">
        <div class="cards-header">
          <h2>Cards (${this.cards.length})</h2>
          <button class="add-card-button" @click=${this.handleAddCard}>+ Add Card</button>
        </div>

        ${this.cards.length === 0
          ? html`
              <div class="empty-state">
                <p>No cards in this deck yet.</p>
              </div>
            `
          : html`
              <div class="cards-list">
                ${this.cards.map(
                  (card) => html`
                    <div class="card-item">
                      <div class="card-content">
                        <div class="card-front">${card.front}</div>
                        <div class="card-back">${card.back}</div>
                        ${isInGodMod.get()
                          ? html`<div class="godmod-controls">
                              <small>Due: ${new Date(card.due).toLocaleDateString()}</small>
                              <button @click=${() => this.handleResetDue(card)}>Reset due</button>
                            </div>`
                          : ""}
                      </div>
                      <div class="card-actions">
                        <button @click=${() => this.handleEditCard(card.id)}>Edit</button>
                        <button
                          class="delete-button"
                          @click=${() => this.handleDeleteCard(card.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  `,
                )}
              </div>
            `}
      </div>
    `;
  }
}
