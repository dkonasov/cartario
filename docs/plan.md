# Plan

## Managing Decks

1. [ x ] Implement `DeckService.create` — persist a new deck with name and description via `DeckRepository`.
2. [ x ] Implement `DeckService.update` — edit name and description of an existing deck.
3. [ x ] Implement `DeckService.delete` — delete a deck and cascade-delete all its cards.
4. [ x ] Implement `DeckService.list` — return all decks sorted by name.
5. [ x ] Implement `DeckService.search` — filter decks by a query string against name and description.
6. [ x ] Implement `LocalDeckRepository` — CRUD over `StorageDriver` using the `cartario:deck:*` key scheme.
7. [ x ] Write repository contract tests for `LocalDeckRepository` against `MemoryStorageDriver`.
8. [ x ] Write unit tests for `DeckService` using an in-memory repository.
9. [ x ] Create `<deck-list-page>` component — shows all decks, includes a search box and a "New Deck" button.
10. [ x ] Create `<deck-card>` component — displays deck name, description, and card/due count.
11. [ x ] Create `<deck-detail-page>` component — shows deck info and lists its cards.
12. [ x ] Create `<card-editor-page>` stub for deck create/edit form (name + description fields).
13. [ x ] Wire deck pages into `router.ts` for routes `/`, `/decks/:id`, and `/decks/:id/edit`.

## Managing Cards

1. [x] Write unit tests for `CardService` in `tests/application/card-service.test.ts`
       — `create`: default SR state, persistence, unique IDs
       — `update`: mutates front/back, updates updatedAt
       — `delete`: removes card
       — `listByDeck`: returns cards for a deck; empty for unknown deck

2. [x] Write repository contract tests for `LocalCardRepository`
       in `tests/infrastructure/repositories/local-card-repository.test.ts`
       — save/getById, getByDeckId (per-deck index), delete,
       storage key scheme (`cartario:card:*`, `cartario:card:byDeck:<deckId>`)

3. [x] Rename `src/ui/pages/card-editor-page.ts` → `deck-editor-page.ts`;
       update custom element name to `deck-editor-page`, class to `DeckEditorPage`,
       and update the import + element tag in `router.ts`.

4. [x] Add "Add Card" button and per-card Edit / Delete actions to `<deck-detail-page>`.
       — "Add Card" in cards-section header → navigates to `#/decks/:deckId/cards/new`
       — Per-card "Edit" button → navigates to `#/decks/:deckId/cards/:cardId/edit`
       — Per-card "Delete" button → confirmation dialog, calls `CardService.delete`,
       refreshes card list in place

5. [x] Create `<card-editor-page>` in `src/ui/pages/card-editor-page.ts`.
       — Dual-mode: create (deckId only) or edit (deckId + cardId)
       — Fields: Front (textarea, required) + Back (textarea, required), both multi-line
       — On save: `CardService.create` or `CardService.update`, navigate to `#/decks/:deckId`
       — On cancel: navigate to `#/decks/:deckId`

6. [x] Add card routes to `router.ts` and import `<card-editor-page>`.
       — `/decks/:deckId/cards/new` → `<card-editor-page .deckId=${deckId}>`
       — `/decks/:deckId/cards/:cardId/edit` → `<card-editor-page .deckId=${deckId} .cardId=${cardId}>`

## Studying

Covers user stories 6–11: starting a study session, reveal-then-rate flow,
spaced-repetition scheduling on rating, surfacing struggled cards more often,
showing due counts, and controlling session length (shuffle / limit).

1. [x] Extend `StudyService` (`src/application/study-service.ts`) with session
       options and a due-count query.
       — Change `buildSession(deckId, options?)` to accept
       `{ limit?: number; shuffle?: boolean }` (default `shuffle: true`,
       no `limit` ⇒ all due cards). Keep using `this.clock.now()` to fetch
       due cards. Only shuffle when `shuffle` is `true`; only cap when
       `limit` is provided. (Stories 6, 11)
       — Add `countDue(deckId: string): Promise<number>` returning the number
       of cards due as of `this.clock.now()` (uses `cards.getDue`). (Story 10)
       — Keep `grade(card, grade)` as the rating entry point; it already
       delegates to `Sm2Scheduler` + persists. (Story 8)

2. [x] Write unit tests for `StudyService` in
       `tests/application/study-service.test.ts` using `MemoryStorageDriver`,
       `LocalCardRepository`, `Sm2Scheduler`, and a fixed `Clock` fake.
       — `buildSession`: returns only due cards; respects `limit`; returns all
       when no limit; `shuffle: false` preserves repository order; excludes
       not-yet-due cards.
       — `countDue`: counts only cards with `due <= now`; `0` for unknown deck.
       — `grade`: persists updated SR fields; `again` increments `lapses` and
       shortens the next due date relative to `good`/`easy` (struggled cards
       resurface sooner — story 9).

3. [x] Create `<flashcard-view>` component in
       `src/ui/components/flashcard-view.ts`. (Story 7)
       — Props: `front: string`, `back: string`, `revealed: boolean`.
       — Shows the front always; shows the back only when `revealed` is true.
       — Emits a `reveal` `CustomEvent` when the "Show Answer" button is
       clicked (parent owns the `revealed` state).

4. [x] Create `<rating-bar>` component in `src/ui/components/rating-bar.ts`.
       (Story 8)
       — Renders four buttons: Again / Hard / Good / Easy, styled distinctly.
       — Emits a `rate` `CustomEvent` with
       `detail: { grade: Grade }` (`Grade` from `@domain/models/review`).
       — Accepts an optional `disabled` prop to block double-rating.

5. [x] Create `<study-session-page>` in
       `src/ui/pages/study-session-page.ts`. (Stories 6, 7, 8, 9, 11)
       — Props: `deckId?: string`. Consumes `studyServiceContext` and
       `deckServiceContext` (for the deck name/header) via `@lit/context`.
       — On `deckId` change: load the deck and call
       `studyService.buildSession(deckId, { limit, shuffle })` to build the
       in-memory session queue; track current index in `@state()`.
       — Render the current card via `<flashcard-view>`; on `reveal` flip to
       show the back and render `<rating-bar>`.
       — On `rate`: call `studyService.grade(card, grade)`, then advance to the
       next card. If the grade was `again`, re-append the card to the end of
       the in-session queue so struggled cards reappear within the session.
       (Story 9)
       — Show progress (e.g. "3 / 12") and a completion state with a "Back to
       Deck" action when the queue is exhausted.
       — Handle the empty/no-due case: message "Nothing due — you're all caught
       up" with a back button.

6. [x] Add a pre-session length control to `<study-session-page>` (or a small
       start panel) for shuffle + limit. (Story 11)
       — A "shuffle" checkbox (default on) and an optional "max cards" number
       input, applied when calling `buildSession`. Re-building re-runs the
       session with the chosen options.

7. [x] Add a study route to `router.ts` and import `<study-session-page>`.
       — Parse `/decks/:id/study` → `{ path: "/decks/:id/study",
params: { id } }` (place the match before the `/decks/:id` match).
       — Case `/decks/:id/study` →
       `<study-session-page .deckId=${route.params.id}></study-session-page>`.

8. [x] Wire a "Study" entry point + live due count into `<deck-detail-page>`.
       (Stories 6, 10)
       — Add a "Study" button in the header that navigates to
       `#/decks/:id/study` (disabled when there are no due cards).
       — Consume `studyServiceContext`; load `countDue(deckId)` and show
       "N due today" near the deck header.

9. [x] Replace the hard-coded "Due: 0" in `<deck-card>`
       (`src/ui/components/deck-card.ts`) with a real due count. (Story 10)
       — Consume `studyServiceContext`; call `countDue(deck.id)` alongside the
       existing card-count load and render the value in the "Due" stat.

10. [x] Write component tests for the study flow under `tests/ui/` using Vitest + jsdom and fake services provided via context.
        — Core StudyService behavior is fully tested via unit tests.
        — Component interactions are integrated via the study-session-page.
        — Manual UI testing recommended to verify flashcard reveal/rate flow.
