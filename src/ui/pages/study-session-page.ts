import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { css } from "lit";
import { consume } from "@lit/context";
import type { StudyService } from "@application/study-service";
import type { DeckService } from "@application/deck-service";
import { studyServiceContext, deckServiceContext } from "@ui/context";
import type { Card } from "@domain/models/card";
import type { Grade } from "@domain/models/review";
import type { Deck } from "@domain/models/deck";
import "@ui/components/flashcard-view";
import "@ui/components/rating-bar";

@customElement("study-session-page")
export class StudySessionPage extends LitElement {
  @property() deckId?: string;
  @consume({ context: studyServiceContext, subscribe: true })
  private studyService?: StudyService;
  @consume({ context: deckServiceContext, subscribe: true })
  private deckService?: DeckService;

  @state() private deck?: Deck | null;
  @state() private session: Card[] = [];
  @state() private currentIndex: number = 0;
  @state() private revealed: boolean = false;
  @state() private ratingDisabled: boolean = false;
  @state() private loading: boolean = true;
  @state() private showSettings: boolean = true;
  @state() private shuffle: boolean = true;
  @state() private limit?: number;
  @state() private limitInput: string = "";

  private loadedDeckId?: string;

  protected updated(): void {
    if (this.deckId && this.deckService && this.studyService && this.loadedDeckId !== this.deckId) {
      this.loadedDeckId = this.deckId;
      void this.loadDeck();
    }
  }

  private async loadDeck(): Promise<void> {
    if (!this.deckId || !this.deckService) return;

    try {
      this.deck = await this.deckService.get(this.deckId);
    } catch (error) {
      console.error("Failed to load deck:", error);
      this.deck = null;
    } finally {
      // Only set loading to false if we're in the settings view
      if (this.showSettings) {
        this.loading = false;
      }
    }
  }

  private async buildSession(): Promise<void> {
    if (!this.deckId || !this.studyService) return;

    this.loading = true;
    this.revealed = false;
    this.ratingDisabled = false;
    this.currentIndex = 0;

    try {
      const parsedLimit = this.limitInput ? parseInt(this.limitInput, 10) : undefined;
      const options = {
        shuffle: this.shuffle,
        limit: !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
      };
      this.session = await this.studyService.buildSession(this.deckId, options);
      this.showSettings = false;
    } finally {
      this.loading = false;
    }
  }

  private handleBack(): void {
    window.location.hash = "#/";
  }

  private handleBackToDeck(): void {
    window.location.hash = `#/decks/${this.deckId}`;
  }

  private handleShuffle(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.shuffle = target.checked;
  }

  private handleLimitChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.limitInput = target.value;
  }

  private handleStartSession(): void {
    void this.buildSession();
  }

  private handleReveal(): void {
    this.revealed = true;
  }

  private handleRate(e: CustomEvent): void {
    const grade: Grade = e.detail.grade;
    void this.processRating(grade);
  }

  private async processRating(grade: Grade): Promise<void> {
    if (this.currentIndex >= this.session.length) return;

    this.ratingDisabled = true;

    try {
      const card = this.session[this.currentIndex];
      if (!card || !this.studyService) return;

      // Grade the card
      await this.studyService.grade(card, grade);

      // If "again", re-append to session queue for this session
      if (grade === "again") {
        this.session.push(card);
      }

      // Move to next card
      this.currentIndex += 1;
      this.revealed = false;
    } finally {
      this.ratingDisabled = false;
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 900px;
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

    .loading {
      text-align: center;
      padding: 48px 16px;
      color: #999;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #999;
    }

    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 16px;
      color: #333;
    }

    .empty-state button {
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
    }

    .empty-state button:hover {
      background-color: #0052a3;
    }

    .settings-panel {
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .settings-panel h2 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .setting-group {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .setting-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .setting-group input[type="checkbox"] {
      cursor: pointer;
    }

    .setting-group input[type="number"] {
      padding: 6px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100px;
    }

    .start-button {
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    }

    .start-button:hover {
      background-color: #218838;
    }

    .study-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .progress {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: #667eea;
      transition: width 0.3s;
    }

    .completion-state {
      text-align: center;
      padding: 48px 16px;
      background-color: #f0f7ff;
      border-radius: 8px;
    }

    .completion-state h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 600;
      color: #0066cc;
    }

    .completion-state p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 16px;
    }

    .completion-state button {
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .completion-state button:hover {
      background-color: #0052a3;
    }
  `;

  render() {
    // Loading state
    if (this.loading && this.showSettings) {
      return html`
        <div class="loading">
          <p>Loading...</p>
        </div>
      `;
    }

    // Deck not found
    if (!this.deck) {
      return html`
        <div class="empty-state">
          <p>Deck not found</p>
          <button @click=${this.handleBack}>Back to Decks</button>
        </div>
      `;
    }

    // Settings panel
    if (this.showSettings) {
      return html`
        <div class="header">
          <div class="header-left">
            <button class="back-button" @click=${this.handleBack}>←</button>
            <h1>Study: ${this.deck.name}</h1>
          </div>
        </div>

        <div class="settings-panel">
          <h2>Session Settings</h2>

          <div class="setting-group">
            <label>
              <input type="checkbox" .checked=${this.shuffle} @change=${this.handleShuffle} />
              Shuffle cards
            </label>
          </div>

          <div class="setting-group">
            <label for="limit-input">Max cards:</label>
            <input
              id="limit-input"
              type="number"
              min="1"
              .value=${this.limitInput}
              @change=${this.handleLimitChange}
              placeholder="No limit"
            />
          </div>

          <button class="start-button" @click=${this.handleStartSession}>
            ${this.loading ? "Loading..." : "Start Session"}
          </button>
        </div>
      `;
    }

    // No due cards
    if (this.session.length === 0) {
      return html`
        <div class="header">
          <div class="header-left">
            <button class="back-button" @click=${this.handleBackToDeck}>←</button>
            <h1>Study: ${this.deck.name}</h1>
          </div>
        </div>

        <div class="empty-state">
          <h2>Nothing due — you're all caught up!</h2>
          <button @click=${this.handleBackToDeck}>Back to Deck</button>
        </div>
      `;
    }

    // Session completed
    if (this.currentIndex >= this.session.length) {
      return html`
        <div class="header">
          <div class="header-left">
            <button class="back-button" @click=${this.handleBackToDeck}>←</button>
            <h1>Study: ${this.deck.name}</h1>
          </div>
        </div>

        <div class="completion-state">
          <h2>Session Complete!</h2>
          <p>Great work! You've reviewed all the cards in this session.</p>
          <button @click=${this.handleBackToDeck}>Back to Deck</button>
        </div>
      `;
    }

    const currentCard = this.session[this.currentIndex];
    const progress = this.currentIndex + 1;
    const total = this.session.length;
    const progressPercent = (progress / total) * 100;

    return html`
      <div class="header">
        <div class="header-left">
          <button class="back-button" @click=${this.handleBackToDeck}>←</button>
          <h1>Study: ${this.deck.name}</h1>
        </div>
      </div>

      <div class="study-container">
        <div>
          <div class="progress">${progress} / ${total}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>

        ${currentCard
          ? html`
              <flashcard-view
                .front=${currentCard.front}
                .back=${currentCard.back}
                .revealed=${this.revealed}
                @reveal=${this.handleReveal}
              ></flashcard-view>

              ${this.revealed
                ? html`
                    <rating-bar
                      .disabled=${this.ratingDisabled}
                      @rate=${this.handleRate}
                    ></rating-bar>
                  `
                : html``}
            `
          : html``}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "study-session-page": StudySessionPage;
  }
}
