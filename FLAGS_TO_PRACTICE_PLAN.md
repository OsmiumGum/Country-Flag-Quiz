# Flags to Practice Plan

This document outlines a future enhancement for the profile drawer: a dedicated **Flags to Practice** section that helps players focus on their weakest countries.

## Goals

- Help users identify flags they miss most often
- Make practice more intentional and repeatable
- Keep the feature lightweight enough to fit inside the profile drawer
- Avoid distracting from the main game flow

## What we can use today

The current data model already gives us a strong starting point:

- Per-flag aggregate stats in `users/{uid}/flagStats/{flagCode}`
- Accuracy percentage for each flag
- Attempt counts per flag
- The existing `getWeakestFlags()` and `getStrongestFlags()` helpers

That means we can already rank flags by performance and display the most important ones without adding a lot of new backend work.

## Suggested implementation

### 1. Practice list
Show the bottom 5 to 10 flags in a small list or card grid.

Each item could include:

- Flag image
- Country name
- Accuracy percentage
- Attempt count
- A small action button like **Practice now**

### 2. Practice mode entry
Clicking **Practice now** could:

- Start a mini-session using only those missed flags
- Mix in a few mastered flags as a review buffer
- Rotate flags with lower accuracy more frequently

### 3. Spaced repetition rules
A basic spaced repetition system could be built with simple tiers:

- 0-25% accuracy: show frequently
- 26-50% accuracy: show moderately often
- 51-75% accuracy: show occasionally
- 76-100% accuracy: show rarely

### 4. Progress feedback
Add a small progress indicator such as:

- "3 flags improving"
- "2 flags need review"
- "Best improving flag this week"

### 5. Optional future upgrades
If we want to go further later:

- Weekly practice streaks
- Difficulty tiers by continent or region
- A dedicated practice page
- Smart sessions based on missed flags from the last 10 games
- Retention tracking over time

## Recommended next step

For now, the profile drawer can keep the current modern redesign and display a **practice focus preview** using the weakest flags list. Then this document can guide a future dedicated practice feature once the main profile redesign is complete.
