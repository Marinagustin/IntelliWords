# IntelliWords — Data Model Specification

Version: 1.0  
Status: FROZEN v1.0

---

## Rules

- Every model must have an `id` field using `cuid()` as default
- Every model must have `createdAt` and `updatedAt` timestamps (except append-only event tables where `updatedAt` is omitted by design)
- Soft deletes preferred — use `deletedAt DateTime?` instead of hard deletes
- No field should be nullable unless there is a clear business reason stated in its description

---

## 1. Enums

### AgeGroup

Represents the reading level / age bracket of a child learner.

| Value    | Age Range | Description                       |
| -------- | --------- | --------------------------------- |
| SEEDLING | 4–6 yrs   | Simple nouns and adjectives       |
| SPROUT   | 6–8 yrs   | Verbs, feelings, and nature words |
| SAPLING  | 8–10 yrs  | Abstract concepts and idioms      |
| TREE     | 10–12 yrs | Formal vocabulary and metaphors   |

---

### Role

Determines what a `User` account is permitted to do in the application.

| Value   | Description                                                     |
| ------- | --------------------------------------------------------------- |
| PARENT  | Can create and monitor child profiles; default role at sign-up  |
| CHILD   | (Future) Direct child login; currently a child is a sub-profile |
| TEACHER | Can create classrooms and assign stories to enrolled children   |

---

### WordSource

Indicates where a word-tap event originated.

| Value | Description                                   |
| ----- | --------------------------------------------- |
| STORY | The word came from a daily AI-generated story |
| SCAN  | The word came from a book-page scan session   |

---

### TaskStatus

Internal project-tracking only — not exposed to end users.

| Value       | Description              |
| ----------- | ------------------------ |
| TODO        | Work not yet started     |
| IN_PROGRESS | Actively being worked on |
| DONE        | Completed and verified   |

---

### ContentStatus

Lifecycle state of an AI-generated story.

| Value     | Description                                            |
| --------- | ------------------------------------------------------ |
| DRAFT     | Generated but not yet reviewed or released to children |
| PUBLISHED | Live — visible to children; cannot be edited           |
| ARCHIVED  | Retired from the daily feed; retained for history      |

---

## 2. Models

### User

Represents a parent or teacher who holds an account. Children are sub-profiles owned by a User.

| Field         | Type      | Required | Default | Description                                               |
| ------------- | --------- | -------- | ------- | --------------------------------------------------------- |
| id            | String    | Yes      | cuid()  | Primary key                                               |
| email         | String    | Yes      | —       | Unique login email address                                |
| name          | String    | Yes      | —       | Display name shown in the UI                              |
| role          | Role      | Yes      | PARENT  | Account type; determines feature access                   |
| avatar        | String?   | No       | null    | URL to profile picture; optional                          |
| emailVerified | DateTime? | No       | null    | Set when the user confirms their email; null = unverified |
| createdAt     | DateTime  | Yes      | now()   | Timestamp of account creation                             |
| updatedAt     | DateTime  | Yes      | auto    | Timestamp of last update                                  |
| deletedAt     | DateTime? | No       | null    | Soft-delete timestamp; null = active account              |

**Unique constraints:** `email`

---

### Child

Represents a child learner. Always owned by a `User` (parent). Children do not log in directly.

| Field             | Type      | Required | Default | Description                                                         |
| ----------------- | --------- | -------- | ------- | ------------------------------------------------------------------- |
| id                | String    | Yes      | cuid()  | Primary key                                                         |
| name              | String    | Yes      | —       | Child's first name or nickname                                      |
| ageGroup          | AgeGroup  | Yes      | —       | Determines which story and word list the child receives each day    |
| avatarEmoji       | String    | Yes      | "🌟"    | Single emoji used as the child's avatar in the UI                   |
| parentId          | String    | Yes      | —       | FK → User; the parent who created this profile                      |
| streak            | Int       | Yes      | 0       | Current consecutive-day streak of completed stories                 |
| longestStreak     | Int       | Yes      | 0       | All-time highest streak value; never decremented                    |
| totalWordsLearned | Int       | Yes      | 0       | Cumulative count of unique words tapped across all sessions         |
| lastActiveDate    | DateTime? | No       | null    | Date of most recent completed DailyProgress; null = never completed |
| createdAt         | DateTime  | Yes      | now()   | Timestamp of profile creation                                       |
| updatedAt         | DateTime  | Yes      | auto    | Timestamp of last update                                            |
| deletedAt         | DateTime? | No       | null    | Soft-delete timestamp; null = active profile                        |

---

### Classroom

A named group created by a teacher. Children join via an invite code.

| Field      | Type      | Required | Default | Description                                                     |
| ---------- | --------- | -------- | ------- | --------------------------------------------------------------- |
| id         | String    | Yes      | cuid()  | Primary key                                                     |
| name       | String    | Yes      | —       | Human-readable classroom name (e.g. "Grade 3 – Morning Batch")  |
| teacherId  | String    | Yes      | —       | FK → User (must have role TEACHER)                              |
| inviteCode | String    | Yes      | —       | Unique 6-character alphanumeric code used to join the classroom |
| createdAt  | DateTime  | Yes      | now()   | Timestamp of classroom creation                                 |
| updatedAt  | DateTime  | Yes      | auto    | Timestamp of last update                                        |
| deletedAt  | DateTime? | No       | null    | Soft-delete timestamp; null = active classroom                  |

**Unique constraints:** `inviteCode`

---

### ClassroomMember

Join table connecting children to classrooms. A child may belong to more than one classroom.

| Field       | Type     | Required | Default | Description                                          |
| ----------- | -------- | -------- | ------- | ---------------------------------------------------- |
| id          | String   | Yes      | cuid()  | Primary key                                          |
| classroomId | String   | Yes      | —       | FK → Classroom                                       |
| childId     | String   | Yes      | —       | FK → Child                                           |
| createdAt   | DateTime | Yes      | now()   | Timestamp when the child was added to this classroom |
| updatedAt   | DateTime | Yes      | auto    | Last update timestamp                                |

**Unique constraints:** `(classroomId, childId)` — a child cannot appear in the same classroom twice

---

### Story

One AI-generated story produced per `AgeGroup` per calendar day. Stories contain vocabulary words wrapped in `<v>` tags within the `body` field.

| Field       | Type          | Required | Default | Description                                                              |
| ----------- | ------------- | -------- | ------- | ------------------------------------------------------------------------ |
| id          | String        | Yes      | cuid()  | Primary key                                                              |
| title       | String        | Yes      | —       | Story title generated by AI                                              |
| body        | String        | Yes      | —       | Full story text; vocabulary words are wrapped with `<v>word</v>` markers |
| ageGroup    | AgeGroup      | Yes      | —       | The age group this story targets                                         |
| status      | ContentStatus | Yes      | DRAFT   | Lifecycle state; PUBLISHED stories cannot be edited                      |
| generatedAt | DateTime?     | No       | null    | When the AI generation completed; null if generation is in progress      |
| publishedAt | DateTime?     | No       | null    | When the story was made live; null if not yet published                  |
| wordCount   | Int           | Yes      | —       | Number of words in the story body; used to verify length constraints     |
| createdAt   | DateTime      | Yes      | now()   | Timestamp of record creation                                             |
| updatedAt   | DateTime      | Yes      | auto    | Timestamp of last update                                                 |

**Unique constraints:** `(ageGroup, publishedAt::date)` — one published story per age group per calendar day

---

### StoryWord

Each vocabulary word embedded in a `Story`. Words are displayed in `displayOrder` when shown in a word list.

| Field           | Type     | Required | Default | Description                                                    |
| --------------- | -------- | -------- | ------- | -------------------------------------------------------------- |
| id              | String   | Yes      | cuid()  | Primary key                                                    |
| storyId         | String   | Yes      | —       | FK → Story                                                     |
| word            | String   | Yes      | —       | The vocabulary word exactly as it appears in the story body    |
| partOfSpeech    | String   | Yes      | —       | e.g. "noun", "verb", "adjective"                               |
| definition      | String   | Yes      | —       | Kid-friendly definition appropriate for the story's AgeGroup   |
| exampleSentence | String   | Yes      | —       | A fresh example sentence (different from the story) using word |
| displayOrder    | Int      | Yes      | —       | Ordinal position for rendering the word list in reading order  |
| createdAt       | DateTime | Yes      | now()   | Timestamp of record creation                                   |
| updatedAt       | DateTime | Yes      | auto    | Last update timestamp                                          |

> **Note:** Once a Story is PUBLISHED, its StoryWord records are never modified. `updatedAt` exists for schema consistency but will not change after initial creation.

---

### DailyProgress

Records a child's engagement with one story on one day. At most one record per child per calendar day.

| Field            | Type     | Required | Default | Description                                                             |
| ---------------- | -------- | -------- | ------- | ----------------------------------------------------------------------- |
| id               | String   | Yes      | cuid()  | Primary key                                                             |
| childId          | String   | Yes      | —       | FK → Child                                                              |
| storyId          | String   | Yes      | —       | FK → Story; the story assigned on this date                             |
| date             | DateTime | Yes      | —       | Calendar date of this progress record (time stored as 00:00:00 UTC)     |
| completed        | Boolean  | Yes      | false   | True when the child has read the story and tapped all highlighted words |
| wordsViewed      | Int      | Yes      | 0       | Count of distinct vocabulary words the child tapped at least once       |
| timeSpentSeconds | Int      | Yes      | 0       | Cumulative seconds the child spent on the story screen                  |
| createdAt        | DateTime | Yes      | now()   | Timestamp of record creation                                            |
| updatedAt        | DateTime | Yes      | auto    | Timestamp of last update                                                |

**Unique constraints:** `(childId, date)` — one progress record per child per calendar day

---

### WordEvent

Append-only event log. One row is inserted each time a child taps a vocabulary word. Records are never updated or deleted.

| Field    | Type       | Required | Default | Description                                                      |
| -------- | ---------- | -------- | ------- | ---------------------------------------------------------------- |
| id       | String     | Yes      | cuid()  | Primary key                                                      |
| childId  | String?    | No       | null    | FK → Child; null when child is not authenticated (see note)      |
| word     | String     | Yes      | —       | The exact word that was tapped                                   |
| source   | WordSource | Yes      | —       | Whether the tap occurred in a story or a scan session            |
| storyId  | String?    | No       | null    | FK → Story; present when source = STORY, null when source = SCAN |
| tappedAt | DateTime   | Yes      | now()   | Timestamp of the tap event; serves as the event time             |

> **Note:** `childId` is nullable. Word-tap events are valid without an authenticated child session. A child reading a story without being logged in can still tap words. `childId` is populated only when a child profile is active on the device.

---

### ScanSession

Records a single book-scan session. Stores the original pasted text so results can be reproduced. A `ScanSession` record is only created when a `childId` is provided — anonymous scans are not persisted.

| Field        | Type     | Required | Default | Description                                                 |
| ------------ | -------- | -------- | ------- | ----------------------------------------------------------- |
| id           | String   | Yes      | cuid()  | Primary key                                                 |
| childId      | String?  | No       | null    | FK → Child; null for anonymous / unauthenticated scans      |
| originalText | String   | Yes      | —       | The full text pasted by the user; used to reproduce results |
| ageGroup     | AgeGroup | Yes      | —       | Age group used to calibrate word difficulty for extraction  |
| wordCount    | Int      | Yes      | —       | Number of difficult words extracted from the text           |
| createdAt    | DateTime | Yes      | now()   | Timestamp of session creation                               |

---

### ScanWord

Each difficult word extracted during a `ScanSession`.

| Field           | Type     | Required | Default | Description                                                  |
| --------------- | -------- | -------- | ------- | ------------------------------------------------------------ |
| id              | String   | Yes      | cuid()  | Primary key                                                  |
| sessionId       | String   | Yes      | —       | FK → ScanSession                                             |
| word            | String   | Yes      | —       | The difficult word identified in the original text           |
| partOfSpeech    | String   | Yes      | —       | e.g. "noun", "verb", "adjective"                             |
| definition      | String   | Yes      | —       | Kid-friendly definition calibrated to the session's AgeGroup |
| exampleSentence | String   | Yes      | —       | A fresh example sentence using the word                      |
| displayOrder    | Int      | Yes      | —       | Ordinal position for rendering extracted words in sequence   |
| createdAt       | DateTime | Yes      | now()   | When this word was extracted                                 |

> **Note:** ScanWord records are immutable once created. `updatedAt` is intentionally omitted as these records are never modified.

> **Note:** This model is referred to as `ScannedWord` in API responses and TypeScript types. The database table is `scan_words`. Use `ScannedWord` as the canonical TypeScript interface name everywhere.

---

## 3. Relationships

| Relationship           | Cardinality  | Via                            | Notes                                        |
| ---------------------- | ------------ | ------------------------------ | -------------------------------------------- |
| User → Child           | One-to-many  | `Child.parentId`               | One parent can have multiple child profiles  |
| User → Classroom       | One-to-many  | `Classroom.teacherId`          | One teacher can own multiple classrooms      |
| Child ↔ Classroom      | Many-to-many | `ClassroomMember`              | A child may join multiple classrooms         |
| Story → StoryWord      | One-to-many  | `StoryWord.storyId`            | A story owns its vocabulary word list        |
| Child → DailyProgress  | One-to-many  | `DailyProgress.childId`        | One progress record per child per day        |
| Story → DailyProgress  | One-to-many  | `DailyProgress.storyId`        | Many children may progress through one story |
| Child → WordEvent      | One-to-many  | `WordEvent.childId`            | Append-only; grows with every word tap       |
| Story → WordEvent      | One-to-many  | `WordEvent.storyId` (nullable) | Only when source = STORY                     |
| Child → ScanSession    | One-to-many  | `ScanSession.childId`          | Optional; null childId = anonymous session   |
| ScanSession → ScanWord | One-to-many  | `ScanWord.sessionId`           | Each session owns its extracted word list    |

---

## 4. Business Rules

1. **PUBLISHED stories are immutable.** A `Story` with `status = PUBLISHED` must not have its `title`, `body`, or associated `StoryWord` records modified. Any correction requires archiving the existing story and publishing a replacement.

2. **One story per age group per day.** The combination of `ageGroup` and the calendar date derived from `publishedAt` must be unique across all stories with `status = PUBLISHED`.

3. **DailyProgress date must correspond to the story's publication date.** The `date` field on `DailyProgress` must equal the calendar date of the linked `Story.publishedAt`. A progress record cannot reference a story that was not published on that date.

3a. **DailyProgress storyId validation.** When creating a `DailyProgress` record, the API must validate that the `Story` referenced by `storyId` has a `publishedAt` date matching today's date in IST (UTC+5:30). Submitting progress for a past story must return HTTP 422.

4. **WordEvent is append-only.** No `UPDATE` or `DELETE` operations are permitted on the `WordEvent` table. All analytics must be derived by reading and aggregating existing rows.

5. **Streak logic.** `Child.streak` increments by 1 only when a new `DailyProgress` record with `completed = true` is created and the previous `DailyProgress` with `completed = true` for that child has a `date` exactly one calendar day earlier. If the gap is greater than one day, `streak` resets to 1. `longestStreak` is updated whenever `streak` exceeds the current `longestStreak` value.

6. **Classroom membership is parent-gated.** A `ClassroomMember` record may only reference a `childId` whose `Child.parentId` matches a parent who has approved the classroom join. A teacher cannot add arbitrary children directly.

7. **Anonymous scans are not persisted.** Anonymous scans (no `childId`) are NOT persisted to the database. The `ScanSession` and `ScanWord` models are only created when a `childId` is provided. Anonymous scan results are returned to the client and immediately discarded server-side.

---

## 5. Indexes

### Unique indexes (enforced as constraints)

| Table           | Fields                    | Reason                                                                                         |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| User            | `email`                   | Login identity; must be globally unique                                                        |
| Classroom       | `inviteCode`              | Used as a lookup key when a child joins                                                        |
| ClassroomMember | `(classroomId, childId)`  | Prevents duplicate membership records                                                          |
| DailyProgress   | `(childId, date)`         | Enforces one progress record per child per day                                                 |
| Story           | `(ageGroup, publishedAt)` | Enforces one published story per group per day (partial — apply only where status = PUBLISHED) |

### Performance indexes (non-unique)

| Table           | Field(s)      | Reason                                                        |
| --------------- | ------------- | ------------------------------------------------------------- |
| Child           | `parentId`    | Fast lookup of all children belonging to a parent             |
| Child           | `ageGroup`    | Filter children by age group for bulk story assignment        |
| Story           | `ageGroup`    | Fetch today's story by age group — the most common read query |
| Story           | `status`      | Filter PUBLISHED stories quickly                              |
| Story           | `publishedAt` | Range queries for history and analytics                       |
| StoryWord       | `storyId`     | Retrieve all words for a given story                          |
| DailyProgress   | `childId`     | Fetch a child's full progress history                         |
| DailyProgress   | `storyId`     | Count how many children engaged with a story                  |
| WordEvent       | `childId`     | Aggregate word-tap counts per child                           |
| WordEvent       | `tappedAt`    | Time-range analytics (e.g. words tapped today)                |
| WordEvent       | `storyId`     | Aggregate which words were tapped most per story              |
| ScanSession     | `childId`     | Fetch scan history for a child                                |
| ScanWord        | `sessionId`   | Retrieve all extracted words for a session                    |
| ClassroomMember | `classroomId` | List all children in a classroom                              |
| ClassroomMember | `childId`     | List all classrooms a child belongs to                        |

---

## Revision History

| Version | Date        | Changes                                               | Status |
| ------- | ----------- | ----------------------------------------------------- | ------ |
| 1.0-rc1 | 05 May 2026 | Initial draft                                         | DRAFT  |
| 1.0     | 05 May 2026 | Fixed 4 ERRORs and 8 WARNINGs from consistency review | FROZEN |
