# Cartario — Technical Architecture

## 1. Summary

Cartario is a **client-only static web application** for studying flashcards with
spaced repetition. It ships as a bundle of static assets (HTML, JS, CSS) that can be
served from any static host or CDN — no application server, no backend, no
authentication. All user data lives on the device.

| Concern             | Decision                                               |
| ------------------- | ------------------------------------------------------ |
| UI framework        | [Lit](https://lit.dev) (Web Components)                |
| Language            | TypeScript (strict)                                    |
| Styling             | Plain CSS via Lit `css` tagged templates               |
| Persistence         | `localStorage`, hidden behind a data-layer abstraction |
| Runtime (dev/build) | Node.js                                                |
| Package manager     | pnpm                                                   |
| Build tool          | Vite                                                   |
| Output              | Static site (pre-built assets)                         |

The single most important architectural rule: **the persistence mechanism is an
implementation detail.** Application and UI code never touch `localStorage`
directly; they depend on storage-agnostic interfaces. Swapping `localStorage` for
IndexedDB, a remote API, or SQLite-WASM must be a localized change.

---

## 2. High-Level Architecture

The app is organized into four layers with a strict, one-directional dependency
rule: **outer layers depend on inner layers, never the reverse.**

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Lit components, router, styles)      │
│  - <app-root>, pages, reusable UI elements                │
└───────────────────────────┬───────────────────────────────┘
                            │ depends on
┌───────────────────────────▼───────────────────────────────┐
│  Application Layer (services / use-cases)                  │
│  - DeckService, CardService, StudyService                  │
│  - Spaced-repetition scheduling logic                      │
└───────────────────────────┬───────────────────────────────┘
                            │ depends on (interfaces only)
┌───────────────────────────▼───────────────────────────────┐
│  Domain Layer (entities, value objects, repo contracts)    │
│  - Deck, Card, Review, SchedulingPolicy                    │
│  - Repository interfaces (ports)                           │
└───────────────────────────▲───────────────────────────────┘
                            │ implements
┌───────────────────────────┴───────────────────────────────┐
│  Infrastructure Layer (adapters)                           │
│  - LocalStorageDeckRepository, LocalStorageCardRepository  │
│  - StorageDriver abstraction, serialization, migrations    │
└─────────────────────────────────────────────────────────┘
```

This is a **Ports & Adapters (Hexagonal)** arrangement. The domain defines _ports_
(repository interfaces); infrastructure provides _adapters_ (the `localStorage`
implementations). The UI is wired to concrete adapters only at a single
composition root.

---

## 3. Project Structure

```
cartario/
├── docs/
│   ├── project-overview.md
│   └── architecture.md
├── index.html                 # single entry HTML, mounts <app-root>
├── public/                    # static assets copied verbatim
├── src/
│   ├── main.ts                # bootstrap + composition root (DI wiring)
│   │
│   ├── domain/                # pure, framework-free, no I/O
│   │   ├── models/
│   │   │   ├── deck.ts
│   │   │   ├── card.ts
│   │   │   └── review.ts
│   │   ├── scheduling/
│   │   │   ├── scheduler.ts          # SchedulingPolicy interface
│   │   │   └── sm2-scheduler.ts       # default SM-2-style implementation
│   │   └── repositories/             # PORTS (interfaces only)
│   │       ├── deck-repository.ts
│   │       └── card-repository.ts
│   │
│   ├── infrastructure/        # ADAPTERS — the only place that knows storage
│   │   ├── storage/
│   │   │   ├── storage-driver.ts          # KV abstraction interface
│   │   │   ├── local-storage-driver.ts    # localStorage implementation
│   │   │   ├── memory-storage-driver.ts   # in-memory impl (tests)
│   │   │   └── codec.ts                    # (de)serialization
│   │   ├── repositories/
│   │   │   ├── local-deck-repository.ts
│   │   │   └── local-card-repository.ts
│   │   └── migrations/
│   │       └── migrations.ts              # schema versioning
│   │
│   ├── application/           # use-cases / services
│   │   ├── deck-service.ts
│   │   ├── card-service.ts
│   │   └── study-service.ts
│   │
│   ├── ui/                    # Lit presentation layer
│   │   ├── app-root.ts
│   │   ├── router.ts
│   │   ├── context.ts                # DI context (@lit/context)
│   │   ├── pages/
│   │   │   ├── deck-list-page.ts
│   │   │   ├── deck-detail-page.ts
│   │   │   ├── card-editor-page.ts
│   │   │   └── study-session-page.ts
│   │   ├── components/
│   │   │   ├── deck-card.ts
│   │   │   ├── flashcard-view.ts
│   │   │   ├── rating-bar.ts
│   │   │   └── search-box.ts
│   │   └── styles/
│   │       ├── tokens.ts             # CSS custom properties (design tokens)
│   │       ├── reset.ts              # shared reset/base styles
│   │       └── shared.ts             # reusable CSSResult fragments
│   │
│   └── shared/                # cross-cutting, framework-free
│       ├── id.ts              # id generation (crypto.randomUUID)
│       ├── result.ts          # Result/Either type for error handling
│       └── clock.ts           # injectable time source (testability)
│
├── tests/                     # unit/integration tests
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

**Dependency direction enforced:** `domain` imports nothing from other layers.
`application` imports only `domain` + `shared`. `infrastructure` implements
`domain` ports. `ui` may import `application` + `domain` types, but **never**
`infrastructure` directly — wiring happens in `main.ts`.

---

## 4. Domain Layer

Pure TypeScript. No Lit, no DOM, no `localStorage`. Fully unit-testable in
isolation.

### 4.1 Entities

```ts
// domain/models/card.ts
export interface Card {
  id: string;
  deckId: string;
  front: string; // prompt text
  back: string; // answer text
  createdAt: number; // epoch ms
  updatedAt: number;

  // spaced-repetition state
  due: number; // epoch ms when next due
  interval: number; // days
  easeFactor: number; // SM-2 ease
  repetitions: number; // consecutive successful reviews
  lapses: number;
}
```

```ts
// domain/models/deck.ts
export interface Deck {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}
```

```ts
// domain/models/review.ts
export type Grade = "again" | "hard" | "good" | "easy";
```

### 4.2 Scheduling Policy (strategy pattern)

The review algorithm is isolated behind an interface so it can evolve (SM-2 →
FSRS) without touching services or UI.

```ts
// domain/scheduling/scheduler.ts
export interface SchedulingPolicy {
  /** Returns the updated SR fields for a card given a grade and current time. */
  schedule(
    card: Card,
    grade: Grade,
    now: number,
  ): Pick<Card, "due" | "interval" | "easeFactor" | "repetitions" | "lapses">;
}
```

The MVP ships `Sm2Scheduler` (`sm2-scheduler.ts`).

### 4.3 Repository Ports

These interfaces are the **contract** between the app and persistence. They are
deliberately storage-agnostic and async (returning `Promise`) so a future
network/IndexedDB adapter is a drop-in replacement without API changes.

```ts
// domain/repositories/deck-repository.ts
export interface DeckRepository {
  getAll(): Promise<Deck[]>;
  getById(id: string): Promise<Deck | null>;
  save(deck: Deck): Promise<void>; // upsert
  delete(id: string): Promise<void>;
}
```

```ts
// domain/repositories/card-repository.ts
export interface CardRepository {
  getByDeck(deckId: string): Promise<Card[]>;
  getById(id: string): Promise<Card | null>;
  getDue(deckId: string, now: number): Promise<Card[]>;
  save(card: Card): Promise<void>;
  deleteByDeck(deckId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
```

> Why `Promise` for synchronous `localStorage`? Because it future-proofs the
> contract. IndexedDB, the File System Access API, and any remote backend are all
> async. Making the port async from day one means swapping the adapter never
> ripples up into services or components.

---

## 5. Infrastructure Layer (the swappable part)

This is the **only** layer that knows persistence exists. It has two sub-levels of
abstraction so the swap can happen at whichever granularity you prefer.

### 5.1 StorageDriver — low-level key/value abstraction

```ts
// infrastructure/storage/storage-driver.ts
export interface StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}
```

Implementations:

- `LocalStorageDriver` — wraps `window.localStorage` (default).
- `MemoryStorageDriver` — `Map`-backed, used in unit tests and SSR/prerender.

To switch to IndexedDB later you can implement an `IdbStorageDriver` and change a
single line in the composition root.

### 5.2 Repositories — domain-aware adapters

Concrete repositories implement the domain ports on top of a `StorageDriver`. They
own key naming, serialization (via `codec.ts`), and indexing strategy.

```ts
// infrastructure/repositories/local-deck-repository.ts
export class LocalDeckRepository implements DeckRepository {
  constructor(private readonly driver: StorageDriver) {}
  // reads/writes JSON under keys like "cartario:deck:<id>"
  // maintains an index key "cartario:deck:index" listing ids
}
```

**Key scheme** (namespaced to avoid collisions):

```
cartario:meta:schemaVersion   -> "1"
cartario:deck:index           -> ["id1","id2",...]
cartario:deck:<id>            -> Deck JSON
cartario:card:byDeck:<deckId> -> ["cardId1",...]
cartario:card:<id>            -> Card JSON
```

### 5.3 Migrations

A `schemaVersion` meta key tracks the on-disk shape. On boot, `migrations.ts`
upgrades stored data forward if the version lags. This makes data evolution safe
and is essential the day the storage backend changes.

### 5.4 Two ways to swap storage

1. **Same data model, different medium** → implement a new `StorageDriver`
   (e.g. `IdbStorageDriver`) and reuse the existing repositories. One-line change.
2. **Different access pattern / remote API** → implement new repository classes
   against the domain ports (e.g. `HttpDeckRepository`) and wire them in `main.ts`.
   Services and UI are untouched.

---

## 6. Application Layer (services / use-cases)

Services orchestrate domain logic and repositories. They contain no UI and no
storage details. They depend only on **port interfaces**, injected via the
constructor.

```ts
// application/study-service.ts
export class StudyService {
  constructor(
    private readonly cards: CardRepository,
    private readonly scheduler: SchedulingPolicy,
    private readonly clock: Clock,
  ) {}

  async buildSession(deckId: string, limit?: number): Promise<Card[]> {
    /* due + shuffle + limit */
  }

  async grade(card: Card, grade: Grade): Promise<Card> {
    const now = this.clock.now();
    const sr = this.scheduler.schedule(card, grade, now);
    const updated = { ...card, ...sr, updatedAt: now };
    await this.cards.save(updated);
    return updated;
  }
}
```

Other services:

- `DeckService` — create/edit/delete/search decks; cascades card deletion.
- `CardService` — CRUD for cards within a deck.

Services map to the MVP user stories (deck management, card management, studying,
due counts, session shuffling/limiting).

---

## 7. Presentation Layer (Lit)

### 7.1 Component model

- Every screen and reusable widget is a Lit `LitElement` custom element.
- Components are **dumb about persistence**. They receive services through Lit
  Context and render reactive state held in `@state()` properties.
- Communication upward uses DOM `CustomEvent`s; downward uses properties/attributes.

```ts
@customElement("deck-list-page")
export class DeckListPage extends LitElement {
  @consume({ context: deckServiceContext }) private deckService!: DeckService;
  @state() private decks: Deck[] = [];
  async connectedCallback() {
    super.connectedCallback();
    this.decks = await this.deckService.list();
  }
}
```

### 7.2 Dependency injection

Services are instantiated once in `main.ts` (composition root) and provided to the
component tree via [`@lit/context`](https://lit.dev/docs/data/context/). Components
_consume_ contexts; they never construct services or repositories themselves. This
keeps the storage choice invisible to the UI and trivial to mock in tests.

```ts
// main.ts (composition root) — the ONLY place infrastructure is referenced
const driver = new LocalStorageDriver(window.localStorage);
const deckRepo = new LocalDeckRepository(driver);
const cardRepo = new LocalCardRepository(driver);
const clock = new SystemClock();

const deckService = new DeckService(deckRepo, cardRepo);
const cardService = new CardService(cardRepo);
const studyService = new StudyService(cardRepo, new Sm2Scheduler(), clock);

// provide via context to <app-root>
```

### 7.3 Routing

A lightweight client-side router (`ui/router.ts`) maps URL paths to page elements.
Recommended: the URL Pattern API or a tiny dependency (e.g. `@lit-labs/router` /
`navigo`). Routes:

```
/                       -> deck-list-page
/decks/:id              -> deck-detail-page
/decks/:id/cards/new    -> card-editor-page
/decks/:id/cards/:cid   -> card-editor-page
/decks/:id/study        -> study-session-page
```

Hash-based routing is acceptable for a static host with no server rewrites; history
API routing requires a host fallback to `index.html`.

---

## 8. Styling

No CSS framework. Styling uses Lit's `css` tagged template literals, scoped per
component through Shadow DOM.

- **Design tokens** are global CSS custom properties (colors, spacing, radius,
  typography) defined on `:root` and consumed inside components — this is what
  pierces Shadow DOM cleanly and enables theming/dark mode (story #21).
- `ui/styles/tokens.ts` exports the token sheet; `reset.ts` provides base rules;
  `shared.ts` exports reusable `CSSResult` fragments composed into components via
  `static styles = [shared, css\`...\`]`.
- Shadow DOM gives free style encapsulation — no BEM, no global class collisions.
- Dark mode: toggle a `data-theme` attribute on `<html>` and switch token values
  with `prefers-color-scheme` as the default.

```ts
static styles = css`
  :host { display: block; padding: var(--space-4); }
  .title { font: var(--font-h2); color: var(--color-text); }
`;
```

---

## 9. Error Handling & Edge Cases

- **`Result<T, E>`** type (`shared/result.ts`) for expected failures (quota
  exceeded, parse errors); exceptions reserved for programmer errors.
- **`localStorage` quota / disabled** (private mode): the `StorageDriver` surfaces
  a typed error; the app degrades to an in-memory session with a visible warning.
- **Corrupt data**: codec validates shape on read; migrations repair or quarantine
  bad records instead of crashing.
- **Cross-tab sync**: optionally listen to the `storage` event to refresh state
  when another tab mutates data.

---

## 10. Build, Tooling & Runtime

| Tool           | Purpose                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| Node.js        | Dev/build runtime (LTS, version pinned via `.nvmrc`/`engines`)               |
| pnpm           | Package management (`pnpm-lock.yaml` committed)                              |
| TypeScript     | `strict: true`, `noUncheckedIndexedAccess`, path aliases                     |
| Vite           | Dev server (HMR) + production static bundling                                |
| Vitest         | Unit/integration tests (jsdom for components)                                |
| oxlint + oxfmt | Fast Rust-based linting/formatting; import-boundary rule to enforce layering |

### Scripts (`package.json`)

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "oxlint",
    "format": "oxfmt",
    "format:check": "oxfmt --check",
    "typecheck": "tsc --noEmit",
  },
}
```

### Output & Deployment

`pnpm build` emits a fully static `dist/` (hashed JS/CSS + `index.html`) deployable
to any static host (GitHub Pages, Netlify, S3/CloudFront, etc.). The app works
**offline** after first load; a service worker (later phase) can add installable
PWA + offline-by-default behavior.

---

## 11. Testing Strategy

| Layer          | What / How                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | Pure unit tests for scheduler & models (no mocks needed)                                                                              |
| Infrastructure | Repository tests run against `MemoryStorageDriver`; a contract test suite runs against every `StorageDriver` impl to guarantee parity |
| Application    | Service tests with in-memory repositories + injectable `Clock`                                                                        |
| Presentation   | Component tests via Vitest + jsdom; services provided as fakes                                                                        |

A **shared repository contract test** (run against both `LocalStorage` and
`Memory` drivers) is the safety net that makes swapping storage backends safe.

---

## 12. Architectural Rules (enforced)

1. `domain/` has zero imports from `ui/`, `application/`, or `infrastructure/`.
2. UI and services depend on **repository interfaces**, never concrete adapters.
3. The word `localStorage` appears **only** inside `infrastructure/storage/`.
4. Wiring of concrete implementations happens **only** in `main.ts`.
5. New storage backend = new adapter + one line in the composition root.

These rules deliver the core requirement: persistence is decoupled and the
`localStorage` decision can be reversed swiftly.
