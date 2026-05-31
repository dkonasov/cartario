# Flashcard App — Project Description

## Overview

A flashcard application that helps users learn and memorize information through digital flashcards. Users create decks of cards, each with a question (front) and answer (back), then study them using spaced repetition to maximize retention. The app focuses on a simple, distraction-free study experience for learners of any subject — languages, exam prep, professional certifications, or general knowledge.

All data is stored locally on the user's device. There are no user accounts and no cloud sync — opening the app gives the user immediate access to their decks without signing in.

## Goals

- Make creating and organizing study material fast and effortless.
- Help users retain information efficiently through proven review techniques (spaced repetition).
- Keep the app private and self-contained — everything lives on the device.
- Be approachable for casual learners while flexible enough for power users.

## Target Users

- **Students** preparing for tests and exams.
- **Language learners** building vocabulary.
- **Professionals** studying for certifications.
- **Lifelong learners** memorizing facts in any domain.

## Core Concepts

- **Card** — a single unit with a front (prompt) and back (answer), text only.
- **Deck** — a named collection of cards on a topic.
- **Study session** — a round of reviewing cards from one or more decks.
- **Spaced repetition** — scheduling reviews based on how well a card is remembered.

## Out of Scope (current)

- User accounts and authentication.
- Cloud storage / cross-device sync.
- Images or other media on cards.
- Sharing decks with other users.

---

# User Stories

## MVP

### Managing Decks

1. As a user, I want to create a new deck with a name and description so I can organize cards by topic.
2. As a user, I want to edit or delete a deck so I can keep my library tidy.
3. As a user, I want to browse and search my decks so I can quickly find the one I need.

### Managing Cards

4. As a user, I want to add a card with a front and back (text) to a deck so I can build my study material.
5. As a user, I want to edit or delete individual cards so I can fix mistakes or remove outdated content.

### Studying

6. As a user, I want to start a study session for a deck so I can review its cards.
7. As a user, I want to see the front of a card, then reveal the answer, so I can test my recall.
8. As a user, I want to rate how well I knew each card (e.g., easy/good/hard/again) so the app schedules my next review appropriately.
9. As a user, I want cards I struggle with to appear more often so I focus on weak spots.
10. As a user, I want the app to tell me how many cards are due today so I know what to study.
11. As a user, I want to shuffle or limit the number of cards in a session so I can control session length.

### Data & Experience

12. As a user, I want all my decks and progress saved locally so my data persists between sessions without an account.
13. As a user, I want to study fully offline so I can review anywhere without an internet connection.

---

## Later Phases

### Progress & Motivation

14. As a user, I want to see stats on my learning (cards mastered, due, accuracy) so I can track progress.
15. As a user, I want to see a study streak so I stay motivated to practice daily.
16. As a user, I want reminders/notifications to study so I don't forget my daily review.

### Organization at Scale

17. As a user, I want to organize decks (e.g., folders, tags, or favorites) so large libraries stay manageable.
18. As a user, I want to reorder or move cards between decks so I can restructure my material.

### Import / Export (local)

19. As a user, I want to import cards from a file (e.g., CSV) so I can quickly populate a deck.
20. As a user, I want to export a deck to a file so I can back it up or move it to another device manually.

### Experience Enhancements

21. As a user, I want a dark mode so studying is comfortable at night.
