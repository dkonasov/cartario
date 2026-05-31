import { createContext } from "@lit/context";
import type { DeckService } from "@application/deck-service";
import type { CardService } from "@application/card-service";
import type { StudyService } from "@application/study-service";

export const deckServiceContext = createContext<DeckService>("cartario:DeckService");
export const cardServiceContext = createContext<CardService>("cartario:CardService");
export const studyServiceContext = createContext<StudyService>("cartario:StudyService");
