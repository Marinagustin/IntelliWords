git # IntelliWords — API Contract

Version: 1.0  
Status: FROZEN v1.0

---

## Auth Routes

---

### POST /api/auth/register

**Purpose:** Register a new User account (parent or teacher).  
**Auth:** Public

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "name": "string",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "role": "PARENT | TEACHER"
}
```

**Response 201:**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "PARENT | TEACHER",
    "avatar": null,
    "emailVerified": null,
    "createdAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Missing or malformed required fields
- 409: A user with this email already exists
- 422: Password does not meet minimum length requirement; role value not in allowed set

**Business Rules:**

1. `email` must be unique across all `User` records (data-model §User unique constraint).
2. Password must be hashed before storage — never persisted in plaintext.
3. `role` must be either `PARENT` or `TEACHER`; `CHILD` is not a valid self-registration role.

**Notes:**

- The response never includes the hashed password field.
- After registration, send a verification email; `emailVerified` remains null until confirmed.

---

### POST /api/auth/login

**Purpose:** Authenticate a user and issue a session. _(Reference only — handled by NextAuth.)_  
**Auth:** Public

**Request:**

- Handled by NextAuth at `/api/auth/[...nextauth]`
- Credentials provider accepts `{ email, password }`

**Response 200:** NextAuth session cookie + session object.

**Error Responses:**

- 401: Invalid email or password

**Notes:**

- Do not implement this route manually. Configure the NextAuth `CredentialsProvider`.
- Session strategy: JWT or database sessions depending on adapter configuration.
- All other NextAuth callbacks (`/api/auth/signout`, `/api/auth/session`) are also handled automatically.

---

## Child Routes

---

### POST /api/children

**Purpose:** Parent creates a new child learner profile.  
**Auth:** Authenticated (Parent)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "name": "string",
  "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
  "avatarEmoji": "string (optional, single emoji)"
}
```

**Response 201:**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
    "avatarEmoji": "🌟",
    "parentId": "string",
    "streak": 0,
    "longestStreak": 0,
    "totalWordsLearned": 0,
    "lastActiveDate": null,
    "createdAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Missing required field `name` or `ageGroup`
- 401: No valid session
- 403: Authenticated user is not a Parent
- 422: `ageGroup` not in allowed enum values; `avatarEmoji` is not a single emoji character

**Business Rules:**

1. `parentId` is set server-side from the authenticated session — never accepted from the client.
2. `avatarEmoji` defaults to `"🌟"` if not provided (data-model §Child).

---

### GET /api/children

**Purpose:** Get all child profiles belonging to the logged-in parent.  
**Auth:** Authenticated (Parent)

**Request:**

- Params: none
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
      "avatarEmoji": "string",
      "streak": 0,
      "longestStreak": 0,
      "totalWordsLearned": 0,
      "lastActiveDate": "ISO string | null"
    }
  ],
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user is not a Parent

**Business Rules:**

1. Only returns children where `Child.parentId` matches the authenticated user's id.
2. Children with a non-null `deletedAt` are excluded.

**Notes:**

- Returns an empty array `[]` if the parent has no children; never returns 404.

---

### GET /api/children/:id

**Purpose:** Get one child's full profile including streak and learning totals.  
**Auth:** Authenticated (Parent — must own this child)

**Request:**

- Params: `id` — the child's cuid
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
    "avatarEmoji": "string",
    "streak": 0,
    "longestStreak": 0,
    "totalWordsLearned": 0,
    "lastActiveDate": "ISO string | null",
    "createdAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user does not own this child
- 404: No child found with this id, or child is soft-deleted

**Business Rules:**

1. Server must verify `Child.parentId === session.user.id` before returning data.

---

### PATCH /api/children/:id

**Purpose:** Update a child's name, age group, or avatar emoji.  
**Auth:** Authenticated (Parent — must own this child)

**Request:**

- Params: `id` — the child's cuid
- Query: none
- Body:

```json
{
  "name": "string (optional)",
  "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE (optional)",
  "avatarEmoji": "string (optional)"
}
```

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "ageGroup": "string",
    "avatarEmoji": "string",
    "updatedAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Body is empty (at least one field required)
- 401: No valid session
- 403: Authenticated user does not own this child
- 404: Child not found or soft-deleted
- 422: Invalid `ageGroup` value; `avatarEmoji` is not a single emoji

**Business Rules:**

1. Server must verify `Child.parentId === session.user.id`.
2. Only `name`, `ageGroup`, and `avatarEmoji` may be updated via this endpoint — streak and progress fields are managed by other routes.

---

### DELETE /api/children/:id

**Purpose:** Soft-delete a child profile.  
**Auth:** Authenticated (Parent — must own this child)

**Request:**

- Params: `id` — the child's cuid
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": { "id": "string", "deletedAt": "ISO string" },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user does not own this child
- 404: Child not found or already deleted

**Business Rules:**

1. Sets `Child.deletedAt` to the current timestamp (data-model §Rules — soft deletes).
2. Associated `DailyProgress` and `WordEvent` records are retained for historical analytics.
3. The child will no longer appear in `GET /api/children`.

---

## Story Routes

---

### GET /api/story/today

**Purpose:** Fetch today's published story for a given age group. Generates it via Claude if it does not yet exist.  
**Auth:** Public

**Request:**

- Params: none
- Query:

```
ageGroup: "SEEDLING" | "SPROUT" | "SAPLING" | "TREE"
```

- Body: none

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "title": "string",
    "body": "string (story text with <v>word</v> markers)",
    "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
    "status": "PUBLISHED",
    "publishedAt": "ISO string",
    "wordCount": 0,
    "words": [
      {
        "id": "string",
        "word": "string",
        "partOfSpeech": "string",
        "definition": "string",
        "exampleSentence": "string",
        "displayOrder": 0
      }
    ]
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Missing or invalid `ageGroup` query parameter
- 503: Claude API unavailable and no cached story exists for today

**Business Rules:**

1. "Today" is resolved in IST (UTC+5:30) — a request at 00:01 IST must return that day's story, not the previous day's.
2. If today's `PUBLISHED` story for this `ageGroup` already exists in the DB → return immediately without calling Claude (data-model §Business Rule 2).
3. If the story does not exist → call Claude, persist the `Story` + `StoryWord` records atomically, set `status = PUBLISHED`, then return.
4. Generation must be idempotent: use a DB-level unique constraint on `(ageGroup, publishedAt::date)` with status PUBLISHED to prevent duplicate generation under concurrent requests (data-model §Story unique constraint).

**Notes:**

- Response header: `Cache-Control: public, max-age=3600, stale-while-revalidate=300`
- Downstream CDN/edge caches may serve stale content for up to 5 minutes while revalidation runs.
- Caching key: `ageGroup + IST calendar date`. Cache is invalidated at midnight IST.

---

### GET /api/story/:id

**Purpose:** Fetch any story by its ID (for history and review).  
**Auth:** Public

**Request:**

- Params: `id` — the story's cuid
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "title": "string",
    "body": "string",
    "ageGroup": "string",
    "status": "PUBLISHED | ARCHIVED",
    "publishedAt": "ISO string",
    "wordCount": 0,
    "words": [
      {
        "id": "string",
        "word": "string",
        "partOfSpeech": "string",
        "definition": "string",
        "exampleSentence": "string",
        "displayOrder": 0
      }
    ]
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 404: Story not found, or story has `status = DRAFT` (drafts are not publicly accessible)

**Business Rules:**

1. Stories with `status = DRAFT` must not be returned by this endpoint.
2. Stories are immutable once PUBLISHED — the response will never change for a given id (data-model §Business Rule 1).

**Notes:**

- Response header: `Cache-Control: public, max-age=86400` — safe to cache for 24 hours since PUBLISHED stories never change.

---

### POST /api/story/generate

**Purpose:** Force-regenerate today's story for a given age group, replacing any existing draft or published story.  
**Auth:** Authenticated (Teacher or Parent)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE"
}
```

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "title": "string",
    "body": "string",
    "ageGroup": "string",
    "status": "PUBLISHED",
    "publishedAt": "ISO string",
    "wordCount": 0,
    "words": ["...StoryWord[]"]
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Missing or invalid `ageGroup`
- 401: No valid session
- 403: Authenticated user is not a Parent or Teacher
- 422: `ageGroup` not in allowed enum values
- 429: User has exceeded 3 story generation requests today

**Business Rules:**

1. If a story for this `ageGroup` and today's IST date already exists, it is soft-archived (`status = ARCHIVED`) before the new story is generated and published. The old story record is retained (data-model §Business Rule 1 — archive rather than delete).
2. "Today" resolves in IST (UTC+5:30).
3. Generation count is tracked per authenticated user per IST calendar day.

**Notes:**

- Rate limit: 3 calls per authenticated user per IST calendar day.
- Intended for content review and correction, not routine use.
- Invalidates the edge-cache entry for `GET /api/story/today?ageGroup=<X>` after generation.

---

## Scan Routes

---

### POST /api/scan

**Purpose:** Extract difficult words from pasted book text and return kid-friendly definitions.  
**Auth:** Public (works without login)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "text": "string (max 2000 characters)",
  "ageGroup": "SEEDLING | SPROUT | SAPLING | TREE",
  "childId": "string (optional cuid)"
}
```

**Response 200:**

```json
{
  "data": {
    "sessionId": "string | null",
    "words": [
      {
        "word": "string",
        "partOfSpeech": "string",
        "definition": "string",
        "exampleSentence": "string",
        "displayOrder": 0
      }
    ]
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: `text` is missing or empty; `ageGroup` is missing or invalid
- 422: `text` exceeds 2000 characters; `childId` provided but not a valid cuid
- 429: Anonymous IP has exceeded 5 scan requests in the current hour
- 503: Claude API unavailable

**Business Rules:**

1. If `childId` is provided → verify the child exists and is not soft-deleted, then persist a `ScanSession` and its `ScanWord` records. Return the `sessionId` in the response.
2. If `childId` is omitted → call Claude, return results immediately, persist nothing. `sessionId` is `null` in the response. No `ScanSession` or `ScanWord` records are created.
3. `text` must be stripped of any HTML before being sent to Claude to prevent prompt injection.

**Notes:**

- Rate limit anonymous requests (no `childId`): 5 per IP per hour.
- Rate limit authenticated requests (with valid `childId`): 20 per hour per user.
- `text` is sanitised server-side before forwarding to the Claude prompt.

---

## Progress Routes

---

### POST /api/progress

**Purpose:** Record or update a child's story completion and engagement for today.  
**Auth:** Authenticated (Parent session) OR Unauthenticated (with valid `childId`)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "childId": "string",
  "storyId": "string",
  "wordsViewed": 0,
  "timeSpentSeconds": 0
}
```

**Response 200:**

```json
{
  "data": {
    "id": "string",
    "childId": "string",
    "storyId": "string",
    "date": "ISO string (date only)",
    "completed": true,
    "wordsViewed": 0,
    "timeSpentSeconds": 0,
    "updatedAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: Missing required fields
- 401: No valid session and no valid `childId` provided
- 403: Authenticated parent does not own the specified child
- 404: `childId` or `storyId` not found
- 422: `wordsViewed` or `timeSpentSeconds` is negative; `storyId` does not reference today's published story for this child's age group

**Business Rules:**

1. If a parent session exists → verify `Child.parentId === session.user.id` before proceeding (data-model §Business Rule 6).
2. If no parent session exists → accept the request if `childId` refers to a valid, non-deleted `Child` record. The child-facing page does not require parent login.
3. `DailyProgress.date` is set server-side to today's IST calendar date — never accepted from the client (data-model §Business Rule 3).
4. The API must validate that `storyId` references a `Story` with a `publishedAt` date matching today in IST. Submitting progress for a past story returns 422 (data-model §Business Rule 3a).
5. `completed` is set to `true` when `wordsViewed` equals the total number of `StoryWord` records for the given `storyId`.
6. After setting `completed = true`, the server recalculates `Child.streak`: if the previous `DailyProgress` with `completed = true` was exactly one calendar day ago, increment by 1; otherwise reset to 1. Update `Child.longestStreak` if the new streak exceeds it (data-model §Business Rule 5).
7. Uses upsert on `(childId, date)` — calling this endpoint multiple times on the same day updates the existing record rather than creating duplicates (data-model §DailyProgress unique constraint).

**Notes:**

- Unauthenticated child-facing pages store `childId` in `localStorage` and pass it in the request body. No cookie or Bearer token is required for this flow.
- Rate limit unauthenticated progress submissions: 10 per `childId` per day.

---

### GET /api/children/:id/progress

**Purpose:** Get a child's progress history and summary statistics.  
**Auth:** Authenticated (Parent — must own this child)

**Request:**

- Params: `id` — the child's cuid
- Query:

```
days: number (optional, default 7, max 30)
```

- Body: none

**Response 200:**

```json
{
  "data": {
    "progress": [
      {
        "id": "string",
        "storyId": "string",
        "date": "ISO string",
        "completed": true,
        "wordsViewed": 0,
        "timeSpentSeconds": 0
      }
    ],
    "streak": 0,
    "longestStreak": 0,
    "totalWordsLearned": 0,
    "completionRate": 0.0,
    "todayTargetWords": 0
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user does not own this child
- 404: Child not found or soft-deleted
- 422: `days` is not a positive integer or exceeds 30

**Business Rules:**

1. Server must verify `Child.parentId === session.user.id`.
2. `completionRate` is calculated as `(count of DailyProgress where completed = true) / days` for the requested window, rounded to two decimal places.
3. `streak` and `longestStreak` are read from the `Child` record — not recalculated on every request.
4. `todayTargetWords` is derived from the word count of today's published `Story` for the child's `ageGroup`. If no story has been published today, use the default target from the `AGE_GROUPS` constant.

**Notes:**

- No caching — always returns fresh data.
- `days` is capped at 30 server-side regardless of the value provided.

---

## Word Event Routes

---

### POST /api/events/word-tap

**Purpose:** Log a word-tap event when a child opens a word definition card.  
**Auth:** Public (child may not be authenticated)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "childId": "string (optional)",
  "word": "string",
  "source": "STORY | SCAN",
  "storyId": "string (REQUIRED when source = STORY, null when source = SCAN)"
}
```

**Response 200:**

```json
{
  "data": { "ok": true },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: `word` is missing; `source` is missing or invalid; `storyId` missing when `source = STORY`
- 422: `childId` or `storyId` provided but not valid cuids

**Business Rules:**

1. This endpoint inserts a single `WordEvent` row and returns immediately (data-model §Business Rule 4 — append-only, no updates or deletes).
2. If `childId` is provided, `Child` existence is verified but failure does not block the insert — the event is still recorded.
3. `source = STORY` with `storyId = null` → return 400.
4. `source = SCAN` with `storyId` provided → silently discard `storyId`; do not populate `WordEvent.storyId`.
5. `WordEvent.childId` may be null — insert the event regardless of authentication state.

**Notes:**

- Client-side: fire-and-forget. Clients should not block UX on this request. A 200ms timeout is acceptable on the client.
- Server-side: fail silently and log to monitoring if the DB insert fails — do not surface 500 errors to the client.
- Rate limit: 60 req/min per IP (high frequency during story reading).

---

## Classroom Routes

---

### POST /api/classrooms

**Purpose:** Teacher creates a new classroom.  
**Auth:** Authenticated (Teacher)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "name": "string"
}
```

**Response 201:**

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "teacherId": "string",
    "inviteCode": "string (6 chars)",
    "createdAt": "ISO string"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: `name` is missing or empty
- 401: No valid session
- 403: Authenticated user is not a Teacher

**Business Rules:**

1. `inviteCode` is generated server-side as a cryptographically random 6-character uppercase alphanumeric string.
2. `inviteCode` uniqueness is enforced by the DB constraint (data-model §Classroom unique constraint). Retry generation on collision (expected to be extremely rare).
3. `teacherId` is set server-side from the authenticated session.

---

### GET /api/classrooms

**Purpose:** Get all classrooms belonging to the logged-in teacher, with member counts.  
**Auth:** Authenticated (Teacher)

**Request:**

- Params: none
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "inviteCode": "string",
      "memberCount": 0,
      "createdAt": "ISO string"
    }
  ],
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user is not a Teacher

**Business Rules:**

1. Only classrooms where `Classroom.teacherId === session.user.id` are returned.
2. Soft-deleted classrooms (`deletedAt IS NOT NULL`) are excluded.
3. `memberCount` counts `ClassroomMember` records for each classroom.

**Notes:**

- Returns `[]` if the teacher has no classrooms; never 404.

---

### POST /api/classrooms/join

**Purpose:** Parent adds their child to a classroom using an invite code.  
**Auth:** Authenticated (Parent)

**Request:**

- Params: none
- Query: none
- Body:

```json
{
  "inviteCode": "string",
  "childId": "string"
}
```

**Response 200:**

```json
{
  "data": {
    "classroom": {
      "id": "string",
      "name": "string",
      "inviteCode": "string"
    },
    "child": {
      "id": "string",
      "name": "string",
      "ageGroup": "string"
    }
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 400: `inviteCode` or `childId` missing
- 401: No valid session
- 403: Authenticated user is not a Parent; or `childId` does not belong to this parent (data-model §Business Rule 6)
- 404: No classroom found with the given `inviteCode`; classroom is soft-deleted
- 409: This child is already a member of this classroom

**Business Rules:**

1. Server verifies `Child.parentId === session.user.id` before allowing the join (data-model §Business Rule 6).
2. A duplicate `(classroomId, childId)` pair returns 409, not a silent upsert (data-model §ClassroomMember unique constraint).
3. The classroom's soft-deleted status is checked — a child cannot join a deleted classroom.

---

### GET /api/classrooms/:id/members

**Purpose:** Get all children in a classroom with their last 7 days of progress.  
**Auth:** Authenticated (Teacher — must own this classroom)

**Request:**

- Params: `id` — the classroom's cuid
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": [
    {
      "memberId": "string",
      "joinedAt": "ISO string",
      "child": {
        "id": "string",
        "name": "string",
        "ageGroup": "string",
        "avatarEmoji": "string",
        "streak": 0,
        "totalWordsLearned": 0
      },
      "recentProgress": [
        {
          "date": "ISO string",
          "completed": true,
          "wordsViewed": 0
        }
      ]
    }
  ],
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 401: No valid session
- 403: Authenticated user is not a Teacher or does not own this classroom
- 404: Classroom not found or soft-deleted

**Business Rules:**

1. Server verifies `Classroom.teacherId === session.user.id`.
2. `recentProgress` contains entries for the last 7 IST calendar days. Days with no progress record are omitted (sparse array).
3. Soft-deleted children are excluded from the member list.

---

## Admin / Internal Routes

---

### GET /api/health

**Purpose:** Health check endpoint for uptime monitoring and deployment verification.  
**Auth:** Public

**Request:**

- Params: none
- Query: none
- Body: none

**Response 200:**

```json
{
  "data": {
    "status": "ok",
    "timestamp": "ISO string",
    "version": "string (from package.json)"
  },
  "meta": { "timestamp": "ISO string" }
}
```

**Error Responses:**

- 503: Application is starting up or a critical dependency (DB) is unreachable

**Business Rules:**

- None.

**Notes:**

- Must respond in under 200ms.
- May optionally check DB connectivity and include `"db": "ok" | "error"` in the response body.
- Rate limit: 60 req/min per IP (shared with public read endpoints).

---

## Common Response Envelopes

All endpoints return one of these two shapes.

### Success

```json
{
  "data": "<the actual payload — object or array>",
  "meta": {
    "timestamp": "2026-05-05T12:00:00.000Z"
  }
}
```

### Error

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable description of what went wrong.",
    "details": {}
  }
}
```

- `code` examples: `EMAIL_TAKEN`, `INVALID_AGE_GROUP`, `CHILD_NOT_OWNED`, `STORY_GENERATION_FAILED`, `RATE_LIMIT_EXCEEDED`
- `details` is included for validation errors (422) and contains field-level messages, e.g. `{ "ageGroup": "Must be one of SEEDLING, SPROUT, SAPLING, TREE" }`
- `details` is omitted for simple errors (401, 403, 404)

---

## Rate Limiting Strategy

| Endpoint Category                                 | Limit                         | Key        |
| ------------------------------------------------- | ----------------------------- | ---------- |
| Public read (`GET /api/story/*`, `/api/health`)   | 60 requests / minute          | IP address |
| `POST /api/scan` — anonymous (no `childId`)       | 5 requests / hour             | IP address |
| `POST /api/scan` — authenticated (with `childId`) | 20 requests / hour            | User ID    |
| `POST /api/events/word-tap`                       | 60 requests / minute          | IP address |
| Authenticated endpoints (all others)              | 100 requests / minute         | User ID    |
| Story generation (`POST /api/story/generate`)     | 3 requests / IST calendar day | User ID    |

- Rate limit responses return HTTP **429** with header `Retry-After: <seconds>` and error code `RATE_LIMIT_EXCEEDED`.
- Anonymous scan requests additionally enforce 5 per IP per hour tracked in a Redis sliding window.

---

## Caching Strategy

| Resource                     | Cache Location | TTL / Invalidation                                                                                       |
| ---------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| Today's story per `ageGroup` | DB + HTTP edge | `max-age=3600, stale-while-revalidate=300`; invalidated at midnight IST or on `POST /api/story/generate` |
| Story by ID                  | HTTP edge      | `Cache-Control: public, max-age=86400` — PUBLISHED stories are immutable                                 |
| Child progress / stats       | None           | Always fetched fresh from DB                                                                             |
| Scan results                 | None           | Stateless; each call invokes Claude fresh                                                                |
| Classroom member list        | None           | Always fetched fresh from DB                                                                             |

---

## Revision History

| Version | Date        | Changes                                               | Status |
| ------- | ----------- | ----------------------------------------------------- | ------ |
| 1.0-rc1 | 05 May 2026 | Initial draft                                         | DRAFT  |
| 1.0     | 05 May 2026 | Fixed 4 ERRORs and 8 WARNINGs from consistency review | FROZEN |
