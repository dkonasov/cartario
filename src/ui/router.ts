import { html } from "lit";
import "@ui/pages/deck-list-page";
import "@ui/pages/deck-detail-page";
import "@ui/pages/deck-editor-page";
import "@ui/pages/card-editor-page";
import "@ui/pages/study-session-page";

interface ParsedRoute {
  path: string;
  params: Record<string, string>;
}

function parseRoute(hash: string): ParsedRoute {
  // Remove the hash prefix
  const path = hash.startsWith("#") ? hash.slice(1) : hash;

  // Match: /decks/new
  if (path === "/decks/new") {
    return {
      path: "/decks/new",
      params: {},
    };
  }

  // Match: /decks/:id/cards/new
  const cardNewMatch = path.match(/^\/decks\/([^/]+)\/cards\/new$/);
  if (cardNewMatch && cardNewMatch[1]) {
    return {
      path: "/decks/:id/cards/new",
      params: { deckId: cardNewMatch[1] },
    };
  }

  // Match: /decks/:id/cards/:cardId/edit
  const cardEditMatch = path.match(/^\/decks\/([^/]+)\/cards\/([^/]+)\/edit$/);
  if (cardEditMatch && cardEditMatch[1] && cardEditMatch[2]) {
    return {
      path: "/decks/:id/cards/:cardId/edit",
      params: { deckId: cardEditMatch[1], cardId: cardEditMatch[2] },
    };
  }

  // Match: /decks/:id/study
  const studyMatch = path.match(/^\/decks\/([^/]+)\/study$/);
  if (studyMatch && studyMatch[1]) {
    return {
      path: "/decks/:id/study",
      params: { id: studyMatch[1] },
    };
  }

  // Match: /decks/:id/edit
  const deckEditMatch = path.match(/^\/decks\/([^/]+)\/edit$/);
  if (deckEditMatch && deckEditMatch[1]) {
    return {
      path: "/decks/:id/edit",
      params: { id: deckEditMatch[1] },
    };
  }

  // Match: /decks/:id
  const deckMatch = path.match(/^\/decks\/([^/]+)$/);
  if (deckMatch && deckMatch[1]) {
    return {
      path: "/decks/:id",
      params: { id: deckMatch[1] },
    };
  }

  // Default: /
  return {
    path: "/",
    params: {},
  };
}

export function router() {
  const hash = window.location.hash || "#/";
  const route = parseRoute(hash);

  switch (route.path) {
    case "/":
      return html`<deck-list-page></deck-list-page>`;

    case "/decks/new":
      return html`<deck-editor-page .isEdit=${false}></deck-editor-page>`;

    case "/decks/:id":
      return html`<deck-detail-page .deckId=${route.params.id}></deck-detail-page>`;

    case "/decks/:id/study":
      return html`<study-session-page .deckId=${route.params.id}></study-session-page>`;

    case "/decks/:id/edit":
      return html`<deck-editor-page .deckId=${route.params.id} .isEdit=${true}></deck-editor-page>`;

    case "/decks/:id/cards/new":
      return html`<card-editor-page .deckId=${route.params.deckId}></card-editor-page>`;

    case "/decks/:id/cards/:cardId/edit":
      return html`<card-editor-page
        .deckId=${route.params.deckId}
        .cardId=${route.params.cardId}
      ></card-editor-page>`;

    default:
      return html`<div>Page not found</div>`;
  }
}
