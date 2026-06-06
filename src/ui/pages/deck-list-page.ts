import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { css } from "lit";
import type { DeckService } from "@application/deck-service";
import { deckServiceContext } from "@ui/context";
import type { Deck } from "@domain/models/deck";
import "@ui/components/deck-card";

@customElement("deck-list-page")
export class DeckListPage extends LitElement {
  @consume({ context: deckServiceContext, subscribe: true })
  private deckService?: DeckService;

  @state() private allDecks: Deck[] = [];
  @state() private searchQuery: string = "";
  private hasLoaded = false;

  protected updated(): void {
    if (this.deckService && !this.hasLoaded) {
      void this.loadDecks();
    }
  }

  private async loadDecks(): Promise<void> {
    if (!this.deckService) return;
    this.hasLoaded = true;
    this.allDecks = await this.deckService.list();
  }

  private get filteredDecks(): Deck[] {
    if (!this.searchQuery.trim()) return this.allDecks;
    return this.allDecks.filter(
      (deck) =>
        deck.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        deck.description.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  private handleSearchInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  private handleNewDeck(): void {
    window.location.hash = "#/decks/new";
  }

  private handleDeckClick(deckId: string): void {
    window.location.hash = `#/decks/${deckId}`;
  }

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
    }

    h1 {
      margin: 0 0 24px 0;
      font-size: 32px;
      font-weight: 700;
    }

    .controls {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    input[type="search"] {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    input[type="search"]:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }

    button {
      padding: 12px 24px;
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

    .decks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }
  `;

  render() {
    return html`
      <div class="header">
        <h1>Decks</h1>
        <div class="controls">
          <input
            type="search"
            placeholder="Search decks..."
            .value=${this.searchQuery}
            @input=${this.handleSearchInput}
          />
          <button @click=${this.handleNewDeck}>+ New Deck</button>
        </div>
      </div>

      ${this.filteredDecks.length === 0
        ? html`
            <div class="empty-state">
              <p>
                ${this.searchQuery
                  ? "No decks match your search."
                  : "No decks yet. Create one to get started!"}
              </p>
            </div>
          `
        : html`
            <div class="decks-grid">
              ${this.filteredDecks.map(
                (d) => html`
                  <deck-card .deck=${d} @click=${() => this.handleDeckClick(d.id)}></deck-card>
                `,
              )}
            </div>
          `}
    `;
  }
}
