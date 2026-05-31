import { LocalStorageDriver } from "@infrastructure/storage/local-storage-driver";
import { LocalDeckRepository } from "@infrastructure/repositories/local-deck-repository";
import { LocalCardRepository } from "@infrastructure/repositories/local-card-repository";
import { MemoryStorageDriver } from "@infrastructure/storage/memory-storage-driver";
import { SystemClock } from "@shared/clock";
import { Sm2Scheduler } from "@domain/scheduling/sm2-scheduler";
import { DeckService } from "@application/deck-service";
import { CardService } from "@application/card-service";
import { StudyService } from "@application/study-service";
import { createAppRoot } from "@ui/app-root";

function createStorageDriver() {
  // If localStorage is unavailable (disabled cookies/private mode/quota issues),
  // fall back to in-memory so the app remains usable.
  try {
    return new LocalStorageDriver(window.localStorage);
  } catch {
    return new MemoryStorageDriver();
  }
}

const driver = createStorageDriver();
const deckRepo = new LocalDeckRepository(driver);
const cardRepo = new LocalCardRepository(driver);
const clock = new SystemClock();
const scheduler = new Sm2Scheduler();

const deckService = new DeckService(deckRepo, cardRepo);
const cardService = new CardService(cardRepo);
const studyService = new StudyService(cardRepo, scheduler, clock);

createAppRoot({ deckService, cardService, studyService });
