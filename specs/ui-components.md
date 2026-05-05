# IntelliWords — UI Components Specification

Version: 1.0  
Status: FROZEN v1.0

---

## Layout Components

---

### AppShell

**Location:** `src/components/layout/AppShell.tsx`  
**Page(s) used on:** Story page, Scan page  
**Purpose:** Root layout wrapper for all child-facing pages, providing the top nav and bottom tab bar.

**Props:**

```typescript
interface AppShellProps {
  children: React.ReactNode; // page content rendered in the main area
  activeTab: "story" | "scan"; // controls which bottom nav tab is highlighted
}
```

**States:**

- Default: top nav visible, bottom nav visible, children rendered in scrollable middle area

**API dependency:** None

**Child components:**

- `AgeGroupBadge` (inside top nav)
- `StreakBadge` (inside top nav, compact size)

**Behaviour:**

1. Renders a fixed top nav bar containing the IntelliWords logo (left) and a compact `AgeGroupBadge` + `StreakBadge` (right).
2. Renders a fixed bottom nav bar with two tabs: "Story" (book icon) and "Scan" (camera icon).
3. The active tab is visually distinguished with the primary purple colour and a filled icon; inactive tabs use `text-secondary`.
4. The main content area between top and bottom nav is vertically scrollable.
5. Top and bottom navs remain fixed on scroll — content scrolls behind them.
6. Bottom nav links: Story → `/story`, Scan → `/scan`.

**Accessibility:**

- Bottom nav uses `<nav aria-label="Main navigation">` with `role="tablist"` on the tab container.
- Each tab is a `<button role="tab">` with `aria-selected` reflecting `activeTab`.
- Logo link has `aria-label="IntelliWords home"`.

---

### ParentShell

**Location:** `src/components/layout/ParentShell.tsx`  
**Page(s) used on:** Dashboard page  
**Purpose:** Root layout wrapper for parent-facing pages, providing a sidebar child switcher and a top bar with logout.

**Props:**

```typescript
interface ParentShellProps {
  children: React.ReactNode; // page content rendered in the main area
  activeChildId: string; // id of the currently selected child
}
```

**States:**

- Default: sidebar visible (desktop), collapsed (mobile — accessible via hamburger)
- Mobile sidebar open: overlay drawer slides in from left

**API dependency:** None (data passed via `ChildSwitcher` child component)

**Child components:**

- `ChildSwitcher`

**Behaviour:**

1. On desktop (≥ 768px): sidebar is always visible at 240px width, main content fills remaining width.
2. On mobile (< 768px): sidebar is hidden behind an overlay drawer triggered by a hamburger menu button in the top bar.
3. Top bar contains: hamburger menu (mobile only), "IntelliWords" wordmark, and a "Log out" button (right).
4. Log out calls `signOut()` from NextAuth and redirects to `/`.
5. `activeChildId` is passed down to `ChildSwitcher` to highlight the active child.

**Accessibility:**

- Mobile sidebar overlay uses `role="dialog"` and `aria-modal="true"` with a focus trap.
- Hamburger button has `aria-label="Open navigation"` / `aria-label="Close navigation"` toggling with state.
- Log out button has `aria-label="Log out"`.

---

## Age Group Components

---

### AgeGroupSelector

**Location:** `src/components/ui/AgeGroupSelector.tsx`  
**Page(s) used on:** Story page, Scan page  
**Purpose:** Horizontally scrollable row of pill buttons for selecting the active age group.

**Props:**

```typescript
interface AgeGroupSelectorProps {
  selectedGroup: AgeGroupKey; // currently active age group
  onChange: (group: AgeGroupKey) => void; // called when user selects a group
}
```

**States:**

- Default: one pill highlighted (selected), others muted
- Hover: unselected pills show subtle background on hover

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Renders four pill buttons in order: SEEDLING, SPROUT, SAPLING, TREE.
2. Each pill displays: the group label (`"4–6 yrs"`) on the first line and the words-per-day count (`"10 words/day"`) as smaller text below.
3. On click: calls `onChange` with the selected `AgeGroupKey`, which the parent uses to update the zustand `childStore` and persist to `localStorage`.
4. Selected pill uses the age group's design token colour as background with white text.
5. The row is horizontally scrollable on narrow screens (`overflow-x: auto`, no visible scrollbar).
6. The selected pill is scrolled into view on mount and on change.

**Accessibility:**

- Container has `role="radiogroup"` with `aria-label="Select age group"`.
- Each pill is `role="radio"` with `aria-checked` reflecting selection state.
- Keyboard: arrow keys move between pills, Space/Enter selects.

---

### AgeGroupBadge

**Location:** `src/components/ui/AgeGroupBadge.tsx`  
**Page(s) used on:** AppShell top nav, ChildCard  
**Purpose:** Small read-only badge that displays the current age group with its colour code.

**Props:**

```typescript
interface AgeGroupBadgeProps {
  ageGroup: AgeGroupKey; // which group to display
}
```

**States:**

- Single static display state; no interactive states

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Maps `AgeGroupKey` to a label and background colour using design tokens:
   - `SEEDLING` → `"Seedling"`, green (`#22C55E`)
   - `SPROUT` → `"Sprout"`, blue (`#3B82F6`)
   - `SAPLING` → `"Sapling"`, amber (`#F59E0B`)
   - `TREE` → `"Tree"`, deep purple (`#8B5CF6`)
2. Renders as a rounded pill with coloured background and white text.
3. Font size is small (12px); intended for use inside other components as a label.

**Accessibility:**

- Renders as `<span>` with `aria-label="Age group: {label}"`.

---

## Story Components

---

### DailyStory

**Location:** `src/components/story/DailyStory.tsx`  
**Page(s) used on:** Story page  
**Purpose:** The main story reading component — fetches today's story and orchestrates its display.

**Props:**

```typescript
interface DailyStoryProps {
  ageGroup: AgeGroupKey; // determines which story is fetched
  storyId?: string; // if provided, fetches this specific story instead of today's
  childId?: string; // used when submitting progress on unmount
}
```

**States:**

- `loading`: skeleton placeholders for title and body
- `error`: `ErrorState` component with retry
- `populated`: `StoryTitle` + `StoryBody` + `WordDrawer` + `DailyProgressBar`

**API dependency:**

- `GET /api/story/today?ageGroup=<X>` (or `GET /api/story/:id` when `storyId` is provided)
- `POST /api/progress` — fired on component unmount

**Child components:**

- `StoryTitle`
- `StoryBody`
- `WordDrawer`
- `DailyProgressBar`
- `LoadingSkeleton` (type="story")
- `ErrorState`

> **Note:** `VocabWord` receives `storyId` from `DailyStory`, which has the full `Story` object including its `id`. `DailyStory` passes `storyId` down via `StoryBody`'s `onWordTap` callback.

**Behaviour:**

1. On mount: begins fetching today's story via `useStory` hook. Starts a `timeSpent` counter using `useRef` and `setInterval` (increments every second).
2. While fetching: renders `LoadingSkeleton` (type="story").
3. On fetch error: renders `ErrorState` with `onRetry` that re-triggers the query.
4. On data received: renders `StoryTitle` and `StoryBody`. Initialises `wordsViewed` state as a `Set<string>` to track unique words tapped.
5. When a `VocabWord` is tapped: adds the word to the `wordsViewed` set, opens `WordDrawer` for that word.
6. On unmount: calls `clearInterval` on the timer, then fires `POST /api/progress` with `{ childId, storyId, wordsViewed: wordsViewed.size, timeSpentSeconds }`. Fire-and-forget — does not block unmount.
7. When `ageGroup` prop changes: re-fetches the story for the new group, resets `timeSpent` and `wordsViewed`.

**Accessibility:**

- The story section is wrapped in `<article aria-label="Today's story">`.
- Loading state announces `aria-live="polite"` with "Loading today's story…".

---

### StoryTitle

**Location:** `src/components/story/StoryTitle.tsx`  
**Page(s) used on:** Story page (inside DailyStory)  
**Purpose:** Renders the story title with a decorative age-group emoji prefix.

**Props:**

```typescript
interface StoryTitleProps {
  title: string; // the story title from the API
  ageGroup: AgeGroupKey; // determines which emoji prefix to use
}
```

**States:**

- Single static display state

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Maps `ageGroup` to an emoji prefix: `SEEDLING` → 🌱, `SPROUT` → 🌿, `SAPLING` → 🌳, `TREE` → 🌲.
2. Renders the emoji and title inside an `<h1>` tag.
3. Font weight: 600. Font size: 28px on mobile, 36px on desktop.

**Accessibility:**

- The emoji is wrapped in `<span aria-hidden="true">` so screen readers read only the title text.

---

### StoryBody

**Location:** `src/components/story/StoryBody.tsx`  
**Page(s) used on:** Story page (inside DailyStory)  
**Purpose:** Parses the story body string and renders plain text interleaved with tappable `VocabWord` components.

**Props:**

```typescript
interface StoryBodyProps {
  body: string; // raw story text with <v>word</v> markers
  words: StoryWord[]; // array of StoryWord objects keyed by word string
  onWordTap: (word: StoryWord) => void; // called when a VocabWord is tapped
}
```

**States:**

- Single static display state (no loading — data is passed as props from DailyStory)

**API dependency:** None

**Child components:**

- `VocabWord` (one per `<v>` tag found in body)

**Behaviour:**

1. On render: parses `body` using a regex that splits on `<v>word</v>` tags. Produces an array of text segments and word segments alternately.
2. For each text segment: renders as a `<span>` with normal styling.
3. For each word segment: looks up the matching `StoryWord` from `words` array by the word string, renders a `<VocabWord>` component.
4. If a `<v>` tag contains a word not found in the `words` array: renders it as plain text (graceful degradation).
5. The entire body is wrapped in a `<p>` with `line-height: 1.8` and `font-size: 18px` minimum for child readability.
6. Text is `hyphens: auto` for long words on narrow screens.

**Accessibility:**

- `<p>` uses `lang="en"` to ensure correct pronunciation by screen readers.

---

### VocabWord

**Location:** `src/components/story/VocabWord.tsx`  
**Page(s) used on:** Story page (inside StoryBody)  
**Purpose:** Inline tappable highlighted word that opens the word definition drawer.

**Props:**

```typescript
interface VocabWordProps {
  word: string; // the vocabulary word
  definition: string; // kid-friendly definition
  partOfSpeech: string; // e.g. "noun", "verb"
  exampleSentence: string; // example usage
  storyId: string; // id of the current story; required for word-tap API
  onTap: () => void; // called when the word is tapped; parent opens WordDrawer
}
```

**States:**

- `default`: purple underline, no background
- `hover` / `active`: purple background pill, white text

**API dependency:**

- `POST /api/events/word-tap` — fired on tap (fire and forget)

**Child components:** None

**Behaviour:**

1. Renders as an inline `<button>` (not a `<span>`) so it is natively keyboard-accessible.
2. On click/tap: calls `onTap()` callback so the parent (`DailyStory`) can open `WordDrawer`.
3. Simultaneously fires `POST /api/events/word-tap` with `{ word, source: "STORY", storyId, childId? }`. Does not await the response — failure is silent.
4. Visual: purple (`#6C63FF`) underline dashed style in default state; on hover/focus switches to a filled pill with white text and purple background.
5. Transition is 150ms ease-in-out.

**Accessibility:**

- Renders as `<button>` with `aria-label="Tap to learn about: {word}"`.
- Focusable via keyboard Tab key.
- On Enter or Space: triggers the same tap behaviour as click.

---

### WordDrawer

**Location:** `src/components/story/WordDrawer.tsx`  
**Page(s) used on:** Story page  
**Purpose:** Bottom-sheet drawer that slides up to display the full definition and example for a tapped vocabulary word.

**Props:**

```typescript
interface WordDrawerProps {
  word: WordDetail | null; // the word to display; null means drawer is closed
  isOpen: boolean; // controls open/closed animation state
  onClose: () => void; // called when user closes the drawer
}
```

> **Note:** `WordDetail` is a minimal interface with fields `word`, `partOfSpeech`, `definition`, and `exampleSentence` only. Both `StoryWord` and `ScannedWord` satisfy it, making `WordDrawer` reusable across both the story and scan flows.

> **Note (ScanResults):** When a `WordCard` is clicked inside `ScanResults`, it opens `WordDrawer` with a `WordDetail` object constructed from the `ScannedWord` fields.

**States:**

- `closed`: drawer off-screen below viewport
- `open`: drawer visible, slides up from bottom with 250ms ease-out transition
- `content-loading`: not applicable — word data is passed directly as a prop

**API dependency:** None

**Child components:** None

**Behaviour:**

1. When `isOpen` changes to `true`: slides the panel up from below the viewport using a CSS transform transition.
2. When `isOpen` changes to `false`: slides back down.
3. Displays: word in bold at 28px, part of speech in italic muted text below it, a divider, definition paragraph, example sentence in italic surrounded by quotation marks.
4. Close (X) button is positioned top-right inside the drawer.
5. A semi-transparent backdrop covers the rest of the screen when open; clicking the backdrop calls `onClose()`.
6. Pressing the Escape key calls `onClose()`.
7. Border radius: 16px on the top two corners only, flush on bottom.
8. Maximum height: 60vh. Content is scrollable inside the drawer if it overflows.

**Accessibility:**

- Drawer root is `role="dialog"` with `aria-modal="true"` and `aria-label="Word definition"`.
- Focus is trapped inside the drawer while open (moves to the close button on open).
- On close: focus returns to the `VocabWord` button that triggered the open.
- `aria-hidden="true"` is applied to background content while the drawer is open.

---

## Vocabulary Components

---

### WordGrid

**Location:** `src/components/vocabulary/WordGrid.tsx`  
**Page(s) used on:** Story page, Scan page (inside ScanResults)  
**Purpose:** Responsive grid layout of all vocabulary word cards.

**Props:**

```typescript
interface WordGridProps {
  words: StoryWord[] | ScannedWord[]; // the words to display
  highlightedWord?: string | null; // if set, the matching WordCard glows purple
  onWordClick: (word: StoryWord | ScannedWord) => void; // parent handles WordDrawer
}
```

**States:**

- Default: grid of `WordCard` components
- Highlighted: one card has a purple border glow

**API dependency:** None

**Child components:**

- `WordCard` (one per word)

**Behaviour:**

1. Renders a CSS grid: 2 columns on mobile, 3 on tablet (≥ 640px), 4 on desktop (≥ 1024px).
2. Gap between cards: 12px.
3. When `highlightedWord` matches a word string (case-insensitive), that `WordCard` receives `highlighted={true}`.
4. On `highlightedWord` change: scrolls the highlighted card into view using `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
5. Each card's `onClick` calls `onWordClick` with the word object.

**Accessibility:**

- Grid container has `role="list"` and each `WordCard` root is `role="listitem"`.

---

### WordCard

**Location:** `src/components/vocabulary/WordCard.tsx`  
**Page(s) used on:** Story page, Scan page  
**Purpose:** A single vocabulary word card showing the word, part of speech, definition, and example sentence.

**Props:**

```typescript
interface WordCardProps {
  word: string; // the vocabulary word
  partOfSpeech: string; // e.g. "noun"
  definition: string; // kid-friendly definition
  exampleSentence: string; // example usage in context
  highlighted: boolean; // if true, renders a purple border glow
  onClick: () => void; // called when user clicks the card
}
```

**States:**

- `default`: white card, 1px border `#E5E7EB`, 12px border radius, subtle shadow
- `highlighted`: purple border glow (`box-shadow: 0 0 0 3px #6C63FF`)
- `hover`: slightly elevated shadow
- `active` (press): slight scale down (0.98)

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Renders as a `<button>` element for click handling and keyboard accessibility.
2. Layout (top to bottom): word in bold 16px, part of speech in italic 12px muted, divider, definition in 14px regular, example sentence in 13px italic `#6B7280`, prefixed with `"e.g. "`.
3. When `highlighted` is true: applies a purple `box-shadow` ring and smooth 200ms transition to that state.
4. Calls `onClick` on click or Enter/Space keypress.

**Accessibility:**

- `role="listitem"` on the card root.
- `aria-label="{word}: {definition}"` on the button.
- `aria-pressed={highlighted}` to indicate the highlighted/selected state.

---

## Scan Components

---

### ScanInput

**Location:** `src/components/scan/ScanInput.tsx`  
**Page(s) used on:** Scan page  
**Purpose:** Text area where the user pastes book text and triggers word extraction.

**Props:**

```typescript
interface ScanInputProps {
  ageGroup: AgeGroupKey; // passed to the API to calibrate difficulty
  childId?: string; // if provided, creates a ScanSession record
  onResults: (words: ScannedWord[]) => void; // called with extracted words on success
}
```

**States:**

- `idle`: textarea empty or filled, button enabled (if text present)
- `loading`: button disabled and shows spinner, textarea read-only
- `error`: error toast shown, textarea re-enabled, button re-enabled
- `success`: `onResults` called, textarea cleared, ready for next scan

**API dependency:**

- `POST /api/scan`

**Child components:**

- `LoadingDots` (inside the submit button while loading)

**Behaviour:**

1. Textarea placeholder: `"Paste a paragraph from any book here…"`.
2. Maximum input length enforced at 2000 characters (HTML `maxLength` attribute + server-side validation).
3. Character counter renders below the textarea: `"{count} / 2000"`.
4. Counter colour: `text-secondary` below 1800 chars; `text-error` (#DC2626) at 1800–2000 chars.
5. When `onChange` fires: updates the internal character count state. Does not debounce — updates on every keystroke.
6. Submit button label: `"Find Difficult Words"`. Disabled when textarea is empty or when `loading` state is active.
7. On submit: sets `loading = true`, calls `POST /api/scan` with `{ text, ageGroup, childId }`.
8. On API success: calls `onResults(words)`, clears the textarea, sets `loading = false`.
9. On API error: shows an error toast (`"Something went wrong. Please try again."`), sets `loading = false`.

**Accessibility:**

- Textarea has `aria-label="Book text to scan"` and `aria-describedby` pointing to the character counter.
- Character counter has `role="status"` and `aria-live="polite"` so screen readers announce count changes.
- Submit button has `aria-busy={loading}`.

---

### ScanResults

**Location:** `src/components/scan/ScanResults.tsx`  
**Page(s) used on:** Scan page  
**Purpose:** Displays the results of a scan session — a count header and a word grid.

**Props:**

```typescript
interface ScanResultsProps {
  words: ScannedWord[]; // words returned by POST /api/scan
  isLoading: boolean; // while API call is in-flight
}
```

**States:**

- `loading`: renders `LoadingSkeleton` with count=8, type="word"
- `empty`: renders a friendly message (no difficult words found)
- `populated`: renders result count header + `WordGrid`

**API dependency:** None (data passed as props from parent ScanPage)

**Child components:**

- `LoadingSkeleton` (type="word")
- `WordGrid`
- `EmptyState`

**Behaviour:**

1. While `isLoading` is true: renders 8 shimmer skeleton cards in the same grid layout as `WordGrid`.
2. When `isLoading` is false and `words.length === 0`: renders `EmptyState` with emoji=`"🎉"`, title=`"Great news!"`, subtitle=`"No difficult words found for this age group."`.
3. When `words.length > 0`: renders a header `"We found {words.length} word{s} to learn"` in bold, followed by `WordGrid`.
4. `WordGrid`'s `onWordClick` opens a `WordDrawer` managed locally in this component.

**Accessibility:**

- Result count header uses `role="status"` and `aria-live="polite"` so screen readers announce the result count when it changes.

---

## Progress Components

---

### StreakBadge

**Location:** `src/components/ui/StreakBadge.tsx`  
**Page(s) used on:** AppShell (top nav), ChildCard, ProgressCard, DashboardPage  
**Purpose:** Displays the child's current streak count with visual milestone indicators.

**Props:**

```typescript
interface StreakBadgeProps {
  streak: number; // current streak value from Child record
  size: "sm" | "md" | "lg"; // controls font size and padding
}
```

**States:**

- `zero`: muted text, no flame; shows `"Start your streak today!"`
- `active` (1–6): flame emoji 🔥 + count in orange
- `milestone-7` (7–29): flame emoji with CSS pulse-glow animation, orange badge
- `milestone-30` (≥30): gold colour scheme (`#D97706` bg, white text), flame emoji

**API dependency:** None

**Child components:** None

**Behaviour:**

1. `streak === 0`: renders `"Start your streak today!"` in `text-secondary`, no emoji.
2. `streak >= 1`: renders `"🔥 {streak}"`. The 🔥 emoji is marked `aria-hidden`.
3. `streak >= 7`: adds a looping CSS animation (`keyframes: 0% opacity 1, 50% opacity 0.7, 100% opacity 1`) on the badge background — subtle glow pulse.
4. `streak >= 30`: switches colour scheme to gold (`background: #D97706`, text white).
5. Size prop maps to Tailwind text classes: `sm` = `text-xs`, `md` = `text-sm`, `lg` = `text-base`.

**Accessibility:**

- Outer element has `aria-label="{streak} day streak"` (or `"No streak yet"` when zero).

---

### DailyProgressBar

**Location:** `src/components/ui/DailyProgressBar.tsx`  
**Page(s) used on:** Story page (inside DailyStory), Dashboard page  
**Purpose:** Horizontal progress bar showing how many vocabulary words the child has explored today.

**Props:**

```typescript
interface DailyProgressBarProps {
  wordsViewed: number; // how many distinct words the child has tapped
  targetWords: number; // total vocabulary words in today's story
  completed: boolean; // if true, shows completion state
}
```

**States:**

- `in-progress`: coloured bar at partial fill, count text below
- `completed`: bar fully green, completion message shown

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Renders a rounded full-width track with a filled inner bar. Fill percentage = `min(wordsViewed / targetWords, 1) * 100`.
2. Bar colour: `#6C63FF` (primary purple) while in progress; `#16A34A` (success green) when `completed = true`.
3. Below the bar: `"{wordsViewed} of {targetWords} words explored today"` in `text-secondary`, 13px.
4. When `completed = true`: replaces the count text with `"✅ Today's story complete!"` in success green.
5. Bar fill animates with a 400ms ease-out CSS transition when `wordsViewed` increases.

**Accessibility:**

- Bar element is `role="progressbar"` with `aria-valuenow={wordsViewed}`, `aria-valuemin={0}`, `aria-valuemax={targetWords}`, and `aria-label="Words explored today"`.

---

### ProgressCard

**Location:** `src/components/dashboard/ProgressCard.tsx`  
**Page(s) used on:** Dashboard page  
**Purpose:** Weekly summary card showing a child's streak, completion rate, 7-day calendar, and total words learned.

**Props:**

```typescript
interface ProgressCardProps {
  childId: string; // used to call the progress API
  days?: number; // window size in days; default 7, max 30
}
```

**States:**

- `loading`: skeleton placeholder
- `error`: `ErrorState` with retry
- `populated`: streak, completion rate, calendar row, word count

**API dependency:**

- `GET /api/children/:id/progress?days={days}` — the `todayTargetWords` field in the response is passed directly to `DailyProgressBar` as the `targetWords` prop. No second API call to `GET /api/story/today` is needed.

**Child components:**

- `StreakBadge`
- `DailyProgressBar`
- `LoadingSkeleton` (type="progress")
- `ErrorState`

**Behaviour:**

1. On mount: fetches progress data via `GET /api/children/{childId}/progress?days={days}`.
2. Renders a card with four sections:
   - Top row: `StreakBadge` (size="lg") left, completion rate percentage right (e.g. `"85% this week"`).
   - 7-day calendar row: a row of 7 circles, one per day, labelled with the day initial (M T W T F S S). Green filled circle = completed, grey outline = not completed or no data.
   - `DailyProgressBar` for today's progress.
   - Footer: `"🧠 {totalWordsLearned} words learned total"` in `text-secondary`.
3. Completion rate is formatted as a percentage rounded to the nearest integer.
4. The calendar row always shows exactly 7 days ending today (IST), regardless of the `days` prop (which controls what is fetched for the full stats).

**Accessibility:**

- Calendar circles have `aria-label="{day name}: {completed ? 'completed' : 'not completed'}"`.

---

## Dashboard Components

---

### ChildCard

**Location:** `src/components/dashboard/ChildCard.tsx`  
**Page(s) used on:** Dashboard page (inside ChildSwitcher)  
**Purpose:** A card representing one child profile in the parent's sidebar.

**Props:**

```typescript
interface ChildCardProps {
  child: Child; // the child object from the API
  isActive: boolean; // if true, renders a purple border
  onClick: () => void; // called when the card is clicked to switch active child
}
```

**States:**

- `default`: white card, subtle shadow
- `active`: purple border (`border: 2px solid #6C63FF`)
- `hover`: slightly elevated shadow

**API dependency:** None

**Child components:**

- `AgeGroupBadge`
- `StreakBadge` (size="sm")

**Behaviour:**

1. Renders a compact horizontal card: large emoji avatar (32px) left, child name in bold + `AgeGroupBadge` + `StreakBadge` stacked to the right.
2. On click: calls `onClick()`. Parent (`ChildSwitcher`) updates the active child in state/store.
3. When `isActive` is true: applies a 2px solid purple border and a subtle purple background tint (`#F5F3FF`).

**Accessibility:**

- Root element is `<button>` with `aria-pressed={isActive}` and `aria-label="{child.name}'s profile"`.

---

### ChildSwitcher

**Location:** `src/components/dashboard/ChildSwitcher.tsx`  
**Page(s) used on:** Dashboard page (inside ParentShell sidebar)  
**Purpose:** Sidebar list of all the parent's children, with an option to add a new child.

**Props:**

```typescript
interface ChildSwitcherProps {
  activeChildId: string; // id of the currently active child
  onSwitch: (childId: string) => void; // called when a different child is selected
}
```

**States:**

- `loading`: skeleton cards
- `error`: `ErrorState`
- `empty`: prompt to add the first child
- `populated`: list of `ChildCard` components + "Add Child" button

**API dependency:**

- `GET /api/children`

**Child components:**

- `ChildCard` (one per child)
- `ChildSetupForm` (rendered in a modal when "Add Child" is clicked)
- `LoadingSkeleton` (type="word")
- `ErrorState`

**Behaviour:**

1. On mount: fetches all children via `GET /api/children`.
2. Renders a `ChildCard` for each child. On card click: calls `onSwitch(child.id)`.
3. An `"+ Add Child"` button sits at the bottom of the list at all times.
4. On `"+ Add Child"` click: opens `ChildSetupForm` in a modal overlay.
5. On `ChildSetupForm` success: closes the modal, refetches the children list, calls `onSwitch` with the new child's id.
6. When the children list is empty: renders `EmptyState` with title `"No children yet"`, subtitle `"Add your first child to get started."`, and an action button that opens `ChildSetupForm`.

**Accessibility:**

- Children list is `<ul>` with each card wrapped in `<li>`.
- `"+ Add Child"` button has `aria-label="Add a new child profile"`.

---

### ChildSetupForm

**Location:** `src/components/dashboard/ChildSetupForm.tsx`  
**Page(s) used on:** Dashboard page (rendered inside a modal from ChildSwitcher)  
**Purpose:** Form to create a new child profile with name, age group, and avatar emoji selection.

**Props:**

```typescript
interface ChildSetupFormProps {
  onSuccess: (child: Child) => void; // called with the newly created child on success
  onCancel: () => void; // called when the user dismisses the form
}
```

**States:**

- `idle`: form fields shown, submit button enabled
- `loading`: fields disabled, button shows spinner
- `error`: inline error message shown below the relevant field or as a banner
- `success`: triggers `onSuccess` callback; form unmounts

**API dependency:**

- `POST /api/children`

**Child components:**

- `AgeGroupSelector`

**Behaviour:**

1. Name field: text input, required, min 2 characters, max 30 characters. Inline validation message on blur if invalid.
2. Age group: rendered via `AgeGroupSelector`. Required — no default pre-selected to force a deliberate choice.
3. Avatar emoji picker: a grid of 12 fixed emoji options (`🌟 🐯 🦁 🐬 🦋 🌈 🚀 🎨 🎵 🏆 🌸 🦊`). Clicking one selects it. Defaults to `🌟`.
4. On submit: validates all fields client-side. If valid, calls `POST /api/children`. On success, calls `onSuccess` with the returned child object.
5. On cancel: calls `onCancel()` without submitting.
6. Renders inside a modal dialog — `onCancel` also fires when the Escape key is pressed or the backdrop is clicked.

**Accessibility:**

- Form is `role="dialog"` with `aria-label="Add a new child profile"` and a focus trap.
- Each form field has a `<label>` with a `for` attribute matching the input `id`.
- Emoji picker items are `role="radio"` inside a `role="radiogroup"` with `aria-label="Choose an avatar"`.
- Submit button has `aria-busy` reflecting loading state.

---

## Shared UI Components

---

### LoadingDots

**Location:** `src/components/ui/LoadingDots.tsx`  
**Page(s) used on:** Inside buttons and loading states throughout the app  
**Purpose:** Three animated bouncing dots for inline loading feedback.

**Props:**

```typescript
interface LoadingDotsProps {
  label: string; // screen reader text (e.g. "Loading story…")
  size?: "sm" | "md"; // dot size; default 'md'
}
```

**States:**

- Single animated state

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Renders three dots (styled `<span>` elements) with a `translateY` bounce animation staggered 150ms apart.
2. `sm`: 4px dots; `md`: 6px dots.

**Accessibility:**

- Wrapper has `role="status"` and `aria-label={label}`. Dots are `aria-hidden`.

---

### LoadingSkeleton

**Location:** `src/components/ui/LoadingSkeleton.tsx`  
**Page(s) used on:** Throughout the app wherever data is loading  
**Purpose:** Shimmer placeholder cards that match the shape of the content being loaded.

**Props:**

```typescript
interface LoadingSkeletonProps {
  count: number; // number of skeleton cards to render
  type: "word" | "story" | "progress"; // determines the skeleton card shape
}
```

**States:**

- Single looping shimmer animation state

**API dependency:** None

**Child components:** None

**Behaviour:**

1. `type="word"`: renders `count` rectangular cards matching `WordCard` dimensions with shimmer lines for word, pos, definition, example.
2. `type="story"`: renders one tall card with a large title shimmer line and several body-text shimmer lines.
3. `type="progress"`: renders one card matching `ProgressCard` dimensions with shimmer rows for streak, calendar, and bar.
4. Shimmer animation: a CSS `@keyframes` gradient sweep from `#F3F4F6` to `#E5E7EB` and back, repeating every 1.5s.

**Accessibility:**

- Wrapper has `role="status"` and `aria-label="Loading content"`.
- Individual skeleton elements are `aria-hidden`.

---

### EmptyState

**Location:** `src/components/ui/EmptyState.tsx`  
**Page(s) used on:** ScanResults, ChildSwitcher, and any list that may be empty  
**Purpose:** Centered display for empty lists or zero-result states.

**Props:**

```typescript
interface EmptyStateProps {
  emoji: string; // large decorative emoji
  title: string; // bold heading
  subtitle: string; // secondary explanation text
  action?: {
    label: string; // button label
    onClick: () => void; // button handler
  };
}
```

**States:**

- Single static display state; optional action button

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Centered column layout: large emoji (48px), title in bold 20px, subtitle in 14px muted, optional action button in primary purple.
2. Action button is only rendered when `action` prop is provided.

**Accessibility:**

- Emoji is `aria-hidden`. Title is `<h2>`. Subtitle is `<p>`.
- Action button has descriptive `aria-label` derived from `action.label`.

---

### ErrorState

**Location:** `src/components/ui/ErrorState.tsx`  
**Page(s) used on:** DailyStory, ProgressCard, ChildSwitcher — anywhere data can fail to load  
**Purpose:** Standardised error display with a retry action.

**Props:**

```typescript
interface ErrorStateProps {
  message: string; // human-readable error message to display
  onRetry: () => void; // called when the user clicks "Try again"
}
```

**States:**

- Single static display state

**API dependency:** None

**Child components:** None

**Behaviour:**

1. Renders a `⚠️` icon (aria-hidden), the `message` text, and a `"Try again"` button.
2. Clicking `"Try again"` calls `onRetry()`.
3. Contained in a bordered card with a red-tinted background (`#FEF2F2`).

**Accessibility:**

- Container has `role="alert"` so screen readers announce it automatically on render.
- `"Try again"` button has `aria-label="Retry loading"`.

---

### Toast

**Location:** Provided by `react-hot-toast` — no custom component file required.  
**Page(s) used on:** Throughout the app  
**Purpose:** Ephemeral notifications for user feedback.

**Props:** Configured via `react-hot-toast` API — no custom props interface.

**States:** N/A — managed by library.

**API dependency:** None

**Child components:** None

**Behaviour (4 toast types used in this app):**

1. **Success** — `toast.success(message)`: shown when a word is marked as learned. Duration: 2000ms. Example: `"Great! You learned 'eloquent' today 🎉"`.
2. **Error** — `toast.error(message)`: shown on API failures (story load, scan, progress save). Duration: 4000ms. Example: `"Could not load the story. Please check your connection."`.
3. **Info** — `toast(message, { icon: '🔥' })`: shown on streak milestones (7-day, 30-day). Duration: 3000ms. Example: `"7-day streak! You're on fire 🔥"`.
4. **Warning** — `toast(message, { icon: '⚠️' })`: shown when character count in `ScanInput` exceeds 1800. Duration: 2000ms. Example: `"Approaching 2000 character limit."`.

**Accessibility:**

- `react-hot-toast` renders toasts in a `role="alert"` `aria-live="polite"` region by default. No additional config needed.

---

## Page-Level Components

---

### StoryPage

**Location:** `src/app/(child)/story/page.tsx`  
**Page(s) used on:** `/story`  
**Purpose:** Assembles the child's daily story reading experience.

**Props:** None (Next.js page component)

**States:**

- Driven by child components; no page-level state beyond `selectedAgeGroup`

**API dependency:** Delegated to `DailyStory`

**Child components:**

- `AppShell`
- `AgeGroupSelector`
- `DailyStory`
- `WordGrid`

**Behaviour:**

1. Reads initial `ageGroup` from zustand `childStore` (falling back to `SEEDLING` if none set).
2. Renders `AgeGroupSelector` at the top. On change: updates `childStore` and re-renders `DailyStory` with the new group.
3. Below the story: renders `WordGrid` with the story's `StoryWord[]` once the story is loaded.
4. `WordGrid`'s `onWordClick` opens the `WordDrawer` managed inside `DailyStory`.
5. Layout: single column, `max-width: 680px`, horizontally centered, `padding: 16px`.

**Accessibility:**

- Page `<title>` (via `generateMetadata`): `"Today's Story — IntelliWords"`.

---

### ScanPage

**Location:** `src/app/(child)/scan/page.tsx`  
**Page(s) used on:** `/scan`  
**Purpose:** Assembles the book-scanning and word-extraction experience.

**Props:** None (Next.js page component)

**States:**

- `scanWords`: `ScannedWord[]` — empty initially, populated after successful scan

**API dependency:** Delegated to `ScanInput`

**Child components:**

- `AppShell`
- `AgeGroupSelector`
- `ScanInput`
- `ScanResults`

**Behaviour:**

1. Reads initial `ageGroup` from zustand `childStore`.
2. `AgeGroupSelector` is rendered at the top; changes update `childStore` and pass the new group to `ScanInput`.
3. `ScanInput`'s `onResults` callback sets `scanWords` state.
4. `ScanResults` is always rendered below `ScanInput`; `isLoading` and `words` props are derived from `ScanInput`'s state (lifted to this page).
5. When `ageGroup` changes after a scan: clears `scanWords` so stale results do not remain visible.
6. Layout: single column, `max-width: 680px`, centered, `padding: 16px`.

**Accessibility:**

- Page `<title>`: `"Scan a Book — IntelliWords"`.

---

### DashboardPage

**Location:** `src/app/(parent)/dashboard/page.tsx`  
**Page(s) used on:** `/dashboard`  
**Purpose:** Assembles the parent's view of their children's progress.

**Props:** None (Next.js page component)

**States:**

- `activeChildId`: string — id of the selected child; defaults to first child on load

**API dependency:** Delegated to `ChildSwitcher` and `ProgressCard`

**Child components:**

- `ParentShell`
- `ChildSwitcher`
- `ProgressCard`

**Behaviour:**

1. On mount: reads children list from `GET /api/children` (via `ChildSwitcher`). Sets `activeChildId` to the first child's id.
2. On child switch (via `ChildSwitcher`'s `onSwitch`): updates `activeChildId` state. `ProgressCard` re-fetches with the new id.
3. Main content area shows `ProgressCard` for the active child.
4. Layout: `ParentShell` provides the sidebar (240px) + main content flex layout.

**Accessibility:**

- Page `<title>`: `"Parent Dashboard — IntelliWords"`.
- When active child changes, a visually hidden `aria-live="polite"` region announces `"Viewing {child.name}'s progress"`.

---

### LandingPage

**Location:** `src/app/page.tsx`  
**Page(s) used on:** `/`  
**Purpose:** Marketing and entry page for new or unauthenticated users.

**Props:** None (Next.js page component)

**States:**

- Single static render; no dynamic state

**API dependency:** None

**Child components:**

- `AgeGroupBadge` (in the age groups section)

**Behaviour:**

1. **Hero section**: Full-width, centered. Headline: `"Learn English, One Story at a Time"`. Subheadline: `"AI-powered daily stories for Indian kids aged 4–12"`. Two CTA buttons side by side: `"Start Reading"` (primary, → `/story`) and `"Scan a Book Page"` (outlined, → `/scan`). No auth required for either route.
2. **How it works section**: Three horizontally arranged step cards with icons: `"1. Pick your age group"`, `"2. Read today's story"`, `"3. Tap words to learn them"`.
3. **Age groups section**: Four tier cards arranged in a responsive grid (1 col mobile, 4 col desktop), one per `AgeGroupKey`. Each card shows the group name, age range, words-per-day, and an `AgeGroupBadge`.
4. **Footer**: Copyright, links to Privacy Policy and Terms.
5. All navigation links use `<Link>` (Next.js) for client-side routing.

**Accessibility:**

- Page `<title>`: `"IntelliWords — Learn English Word by Word"`.
- Hero CTA buttons have descriptive `aria-label` attributes.
- `"How it works"` and `"Age groups"` headings are `<h2>` elements.

---

## Component Dependency Tree

```
StoryPage
  └── AppShell
  └── AgeGroupSelector
  └── DailyStory
        └── StoryTitle
        └── StoryBody
              └── VocabWord (×N)
        └── WordDrawer
        └── DailyProgressBar
        └── LoadingSkeleton (type="story")
        └── ErrorState
  └── WordGrid
        └── WordCard (×N)

ScanPage
  └── AppShell
  └── AgeGroupSelector
  └── ScanInput
        └── LoadingDots
  └── ScanResults
        └── LoadingSkeleton (type="word")
        └── EmptyState
        └── WordGrid
              └── WordCard (×N)
        └── WordDrawer

DashboardPage
  └── ParentShell
        └── ChildSwitcher
              └── ChildCard (×N)
                    └── AgeGroupBadge
                    └── StreakBadge
              └── ChildSetupForm
                    └── AgeGroupSelector
              └── LoadingSkeleton (type="word")
              └── ErrorState
              └── EmptyState
  └── ProgressCard
        └── StreakBadge
        └── DailyProgressBar
        └── LoadingSkeleton (type="progress")
        └── ErrorState

LandingPage
  └── AgeGroupBadge (×4)
```

---

## Design Tokens

### Colours

| Token          | Hex       | Usage                                                |
| -------------- | --------- | ---------------------------------------------------- |
| Primary        | `#6C63FF` | CTA buttons, vocabulary word highlights, active tabs |
| SEEDLING       | `#22C55E` | Age group badge and pill for 4–6 yrs                 |
| SPROUT         | `#3B82F6` | Age group badge and pill for 6–8 yrs                 |
| SAPLING        | `#F59E0B` | Age group badge and pill for 8–10 yrs                |
| TREE           | `#8B5CF6` | Age group badge and pill for 10–12 yrs               |
| Success        | `#16A34A` | Completed progress bar, success toasts               |
| Error          | `#DC2626` | Error states, character counter over limit           |
| Text primary   | `#111827` | Body copy, headings                                  |
| Text secondary | `#6B7280` | Muted labels, captions, example sentences            |
| Background     | `#FAFAFA` | Page background                                      |
| Surface        | `#FFFFFF` | Cards, drawers, modals                               |
| Border         | `#E5E7EB` | Card borders, input borders                          |

### Typography

| Use case        | Size    | Weight | Font  |
| --------------- | ------- | ------ | ----- |
| Story body      | 18px    | 400    | Inter |
| Story title     | 28–36px | 600    | Inter |
| Card word       | 16px    | 700    | Inter |
| Card definition | 14px    | 400    | Inter |
| Card example    | 13px    | 400    | Inter |
| Headings (h1)   | 36px    | 600    | Inter |
| Headings (h2)   | 24px    | 600    | Inter |
| Badge / label   | 12px    | 500    | Inter |

- Line height for story body: `1.8`
- Letter spacing for headings: `-0.02em`

### Spacing

Uses Tailwind's default 4px base unit spacing scale throughout. Do not introduce custom spacing values outside the scale.

### Border Radius

| Element            | Radius                      |
| ------------------ | --------------------------- |
| Cards              | `12px` (`rounded-xl`)       |
| Pills / badges     | `9999px` (`rounded-full`)   |
| Drawers (top only) | `16px` top-left + top-right |
| Buttons            | `8px` (`rounded-lg`)        |
| Inputs             | `8px` (`rounded-lg`)        |
| Skeleton cards     | `12px` (`rounded-xl`)       |

---

## Revision History

| Version | Date        | Changes                                               | Status |
| ------- | ----------- | ----------------------------------------------------- | ------ |
| 1.0-rc1 | 05 May 2026 | Initial draft                                         | DRAFT  |
| 1.0     | 05 May 2026 | Fixed 4 ERRORs and 8 WARNINGs from consistency review | FROZEN |
