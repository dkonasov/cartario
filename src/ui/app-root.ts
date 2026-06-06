import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { ContextProvider } from "@lit/context";
import type { DeckService } from "@application/deck-service";
import type { CardService } from "@application/card-service";
import type { StudyService } from "@application/study-service";
import { deckServiceContext, cardServiceContext, studyServiceContext } from "@ui/context";
import { router } from "@ui/router";
import "@ui/components/toolbar";

interface AppDeps {
  deckService: DeckService;
  cardService: CardService;
  studyService: StudyService;
}

const DEPS_READY_EVENT = "cartario:deps-ready";

export function createAppRoot(deps: AppDeps) {
  // Ensures wiring is centralized in main.ts and components stay dumb.
  (globalThis as unknown as { __cartarioDeps?: AppDeps }).__cartarioDeps = deps;
  window.dispatchEvent(new Event(DEPS_READY_EVENT));
}

@customElement("app-root")
export class AppRoot extends LitElement {
  static styles = css`
    header {
      margin: 0px auto;
      max-width: 1200px;
      padding: 24px;
    }
  `;

  private readonly deckServiceProvider = new ContextProvider(this, {
    context: deckServiceContext,
  });
  private readonly cardServiceProvider = new ContextProvider(this, {
    context: cardServiceContext,
  });
  private readonly studyServiceProvider = new ContextProvider(this, {
    context: studyServiceContext,
  });
  private ready = false;
  private readonly handleDepsReady = () => this.initializeDeps();
  private readonly handleHashChange = () => this.requestUpdate();

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(DEPS_READY_EVENT, this.handleDepsReady);
    window.addEventListener("hashchange", this.handleHashChange);
    this.initializeDeps();
  }

  disconnectedCallback(): void {
    window.removeEventListener(DEPS_READY_EVENT, this.handleDepsReady);
    window.removeEventListener("hashchange", this.handleHashChange);
    super.disconnectedCallback();
  }

  private initializeDeps(): void {
    const deps = (globalThis as unknown as { __cartarioDeps?: AppDeps }).__cartarioDeps;
    if (!deps) return;

    this.deckServiceProvider.setValue(deps.deckService);
    this.cardServiceProvider.setValue(deps.cardService);
    this.studyServiceProvider.setValue(deps.studyService);
    this.ready = true;
    this.requestUpdate();
  }

  render() {
    if (!this.ready) return html``;
    return html`
      <header><cartario-toolbar></cartario-toolbar></header>
      <main>${router()}</main>
    `;
  }
}
