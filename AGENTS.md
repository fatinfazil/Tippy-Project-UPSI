# Project Guidelines & Architecture Reference

## 1. Project Purpose
This project is an interactive story-driven application built with React, TypeScript, Vite, and Tailwind CSS. The app presents sequential visual and interactive narrative scenes (e.g., Scene 1, Scene 2, Scene 3) where users progress through dialogue, story beats, and interactive mini-games or tasks.

---

## 2. Scene Architecture
The application uses a modular, scene-isolated architecture:
- Each narrative or interactive chapter is treated as an independent scene.
- Scenes are orchestrated by a central container (`StoryPlayer.tsx`) which manages global phases, scene mounting, developer controls, and overall state transitions.
- Each scene is encapsulated inside its own dedicated directory under `src/scenes/` to avoid tight coupling between different narrative chapters.

---

## 3. Folder Structure
```
src/
├── components/
│   ├── developer/       # Developer panel and debugging overlays
│   ├── layout/          # Layout wrappers, headers, orientation notices
│   ├── shared/          # Reusable UI components (character layers, dialogue bubbles, controls)
│   └── story/           # Story orchestration (StoryPlayer, WelcomeScreen, Video players)
├── config/              # Global story & application configuration
├── scenes/
│   ├── scene01/         # Dedicated folder for Scene 1
│   │   ├── Scene01.tsx  # Main entry component for Scene 1
│   │   └── scene01.config.ts # Configuration and story beats for Scene 1
│   ├── scene02/         # Dedicated folder for Scene 2 (when created)
│   │   ├── Scene02.tsx
│   │   └── scene02.config.ts
│   └── scene03/         # Dedicated folder for Scene 3 (when created)
├── types/               # Shared TypeScript interfaces, types, and enums
└── utils/               # Shared utility functions and helpers
```

---

## 4. Naming Conventions
- **Scene Folders**: Lowercase with zero-padded double digits: `scene01`, `scene02`, `scene03`, etc.
- **Main Scene Component**: `Scene01.tsx`, `Scene02.tsx`, `Scene03.tsx`.
- **Scene Props Interface**: `Scene01Props`, `Scene02Props`, `Scene03Props`.
- **Scene Config File**: `scene01.config.ts`, `scene02.config.ts`, `scene03.config.ts`.
- **Scene-Specific Sub-components**: PascalCase, placed inside the scene's subfolder (e.g., `src/scenes/scene02/CustomInteraction.tsx`).

---

## 5. Shared vs. Scene-Specific Code
- **Shared Code (`src/components/shared/`, `src/types/`, `src/utils/`)**:
  - Contains reusable visual widgets, character renderers, dialogue bubble drivers, sound management, and global type definitions.
  - Changes here must be strictly backwards-compatible with all existing scenes.
- **Scene-Specific Code (`src/scenes/sceneXX/`)**:
  - Contains code, states, interactive mini-games, custom UI mechanics, and configurations exclusive to that scene.
  - Must NOT be imported by other scenes.

---

## 6. StoryPlayer Responsibilities
- Manages high-level narrative state, phase transitions (e.g., `welcome` -> `introduction` -> `scene01` -> `scene02`), and progress tracking.
- Renders global overlays (orientation notice, developer panel, top navigation).
- Mounts and unmounts active scene components dynamically based on current phase.
- Does NOT contain scene-internal game logic or dialogue arrays.

---

## 7. Scene Responsibilities
- Manages internal progression, animations, user interactions, local timers, and dialogue sub-steps for that specific scene.
- Emits completion signals or navigation requests back to `StoryPlayer` via props callbacks (e.g., `onNextPhase`, `onRestart`).
- Handles scene-level state cleanly and resets cleanly on remount/restart.

---

## 8. Protection of Completed Scenes
- Previously completed scenes (e.g., `scene01`) are considered STABLE and LOCKED.
- When implementing Scene 2 or subsequent scenes, do **NOT** modify existing completed scene directories (e.g., `src/scenes/scene01/`) unless the user explicitly requests a Scene 1 change.
- Apply the same protection principle to every completed scene (`scene01`, `scene02`, etc.) as a frozen baseline.
- Never edit or refactor a completed scene while working on a new scene unless explicitly instructed by the user.
- New features or adjustments for Scene N must never break or modify Scene N-1.

---

## 9. Protection of Shared Components & Global Directories
- Shared modules in `src/components/shared/`, `src/components/story/`, `src/types/`, `src/utils/`, and `src/config/` serve as the foundation across multiple scenes.
- When implementing Scene 2 or later scenes, Google AI Studio should **NOT** modify:
  - `src/components/shared/`
  - `src/components/story/`
  - `src/types/`
  - `src/utils/`
  - `src/config/`
  unless absolutely necessary.
- Prefer implementing new functionality, helpers, types, and scene-scoped components directly inside the current scene folder (e.g., `src/scenes/scene02/`).
- Do NOT alter prop signatures or existing behaviors of shared components in ways that cause breaking changes for already implemented scenes.
- If a new scene requires modified behavior for a shared component, extend the component with optional props or create a specialized variant within the scene folder.

---

## 10. Protection of Public Assets
- Assets in `public/` (images, audio files, icons) are referenced by story configurations and CSS.
- Do NOT delete, move, or rename existing assets in `public/` unless explicitly instructed.
- When adding new assets, place them in logical subdirectories under `public/` using clear, lowercase, underscore-separated filenames.

---

## 11. Behaviour Preservation During Refactoring
- Refactoring tasks must retain 100% of the visual layout, dialogue sequences, audio cues, and interaction rules unless user explicitly requests changes.
- Verify before and after refactoring that state persistence, reset buttons, and next phase triggers function identically.

---

## 12. Scene Development Workflow
When adding a new scene (e.g., `scene02`):
1. Create a dedicated directory: `src/scenes/scene02/`.
2. Create the config file `scene02.config.ts` and scene component `Scene02.tsx`.
3. Add any scene-specific sub-components or interactions inside `src/scenes/scene02/`.
4. Register the new scene phase and component inside `StoryPlayer.tsx`.
5. Verify TypeScript definitions and build integrity.

---

## 13. Verification Workflow
After making any code or configuration change:
1. Run linter (`npm run lint` / `lint_applet`) to ensure zero TypeScript or syntax errors.
2. Run build check (`compile_applet`) to confirm production build success.
3. Fix any build or type error immediately before concluding the turn.

---

## 14. Required Change Report
When asked to implement or update code, provide a clear, concise summary covering:
- Added or modified files.
- Functional behavior added or preserved.
- Confirmation that no unrelated files or completed scenes were altered.

---

## 15. Prohibited Actions
- Do NOT place scene-specific components directly in root `src/` or `src/components/`.
- Do NOT modify `src/components/shared/`, `src/components/story/`, `src/types/`, `src/utils/`, or `src/config/` when implementing Scene 2 or later scenes unless strictly necessary.
- Do NOT mix logic or components between different scene subfolders.
- Do NOT delete or modify package dependencies unless instructed.
- Do NOT bypass TypeScript strict checks with `any` suppression unless strictly required.
- Do NOT modify completed scenes when adding a new scene.
