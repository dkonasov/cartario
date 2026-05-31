import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { css } from "lit";
import { consume } from "@lit/context";
import type { CardService } from "@application/card-service";
import type { StudyService } from "@application/study-service";
import { cardServiceContext, studyServiceContext } from "@ui/context";
import type { Deck } from "@domain/models/deck";

@customElement("deck-card")
export class DeckCard extends LitElement {
  @property({ type: Object }) deck?: Deck;
  @consume({ context: cardServiceContext, subscribe: true }) private cardService?: CardService;
  @consume({ context: studyServiceContext, subscribe: true })
  private studyService?: StudyService;

  @state()
  private cardCount: number = 0;
  @state()
  private dueCount: number = 0;
  private loadedDeckId?: string;

  protected updated(): void {
    if (this.deck && this.cardService && this.loadedDeckId !== this.deck.id) {
      this.loadedDeckId = this.deck.id;
      void this.loadCardCount();
      void this.loadDueCount();
    }
  }

  private async loadCardCount(): Promise<void> {
    if (this.deck && this.cardService) {
      const cards = await this.cardService.listByDeck(this.deck.id);
      this.cardCount = cards.length;
    }
  }

  private async loadDueCount(): Promise<void> {
    if (this.deck && this.studyService) {
      this.dueCount = await this.studyService.countDue(this.deck.id);
    }
  }

  static styles = css`
    :host {
      display: block;
    }

    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      background-color: #fff;
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #111;
    }

    .card p {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }

    .stats {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #999;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #aaa;
    }

    .stat-value {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
  `;

  render() {
    if (!this.deck) return html``;

    return html`
      <div class="card">
        <h3>${this.deck.name}</h3>
        <p>${this.deck.description || "No description"}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Cards</div>
            <div class="stat-value">${this.cardCount}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Due</div>
            <div class="stat-value">${this.dueCount}</div>
          </div>
        </div>
      </div>
    `;
  }
}
