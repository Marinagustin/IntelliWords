# IntelliWords — Story Generation Prompt Spec

Version: 1.0  
Status: FROZEN v1.0  
Used by: `GET /api/story/today`, `POST /api/story/generate`  
Claude Model: `claude-sonnet-4-20250514`  
Max tokens: 1500

---

## Purpose

This document specifies the exact Claude API prompt used to generate the daily vocabulary story for each age group. It exists as a versioned spec artifact so that prompt changes are deliberate, reviewed, and traceable — in the same way that database schema changes or API contract changes are. Any modification to this prompt must increment the version number and be recorded in the Change Log, because even small wording changes can meaningfully alter the quality, length, or vocabulary level of generated stories.

---

## Input Variables

These variables are injected into the prompt template at runtime before sending the request to Claude.

| Variable              | Type   | Example       | Source                                      |
| --------------------- | ------ | ------------- | ------------------------------------------- |
| `{{AGE_MIN}}`         | number | `4`           | `AGE_GROUPS[ageGroup]` constant             |
| `{{AGE_MAX}}`         | number | `6`           | `AGE_GROUPS[ageGroup]` constant             |
| `{{WORD_COUNT}}`      | number | `10`          | `AGE_GROUPS[ageGroup].wordsPerDay`          |
| `{{STORY_MIN_WORDS}}` | number | `80`          | `AGE_GROUPS[ageGroup].storyMinWords`        |
| `{{STORY_MAX_WORDS}}` | number | `120`         | `AGE_GROUPS[ageGroup].storyMaxWords`        |
| `{{AGE_GROUP}}`       | string | `SEEDLING`    | `AgeGroupKey` enum value                    |
| `{{TODAY_DATE}}`      | string | `05 May 2026` | Current date in IST, formatted DD MMMM YYYY |

**Note on `{{TODAY_DATE}}`:** Including the date in the prompt is intentional. It seeds Claude's generation context with a unique daily value, reducing the chance of the model reproducing an identical story from a previous call. It also allows Claude to reference seasons, festivals, or current context naturally if relevant.

---

## Vocabulary Complexity Guide

This guide defines the intended difficulty level and definition style for each age group. Claude's system prompt instructs it to follow these norms; this section documents them explicitly for human reviewers.

### SEEDLING (4–6 years)

- **Target words:** Words a young child may have overheard but not fully grasped
- **Examples:** magnificent, curious, gentle, enormous, whisper, delicate, proud, graceful, brave, joyful
- **Avoid:** Abstract concepts, compound meanings, words requiring prior domain knowledge
- **Definition style:** Concrete and sensory. Use "very very" constructions. Example: _"Something that is very very big and amazing and makes you go 'wow!'"_

### SPROUT (6–8 years)

- **Target words:** Words appearing in school readers that children find unfamiliar
- **Examples:** determined, cautious, grateful, vibrant, serene, earnest, marvellous, gentle, radiant, swift
- **Avoid:** Technical jargon, multi-syllable abstract nouns, words requiring cultural context outside India
- **Definition style:** Behavioural or emotional anchoring. Example: _"When you really really want to do something and you don't give up, no matter what."_

### SAPLING (8–10 years)

- **Target words:** Words from chapter books and classroom reading at this level
- **Examples:** perseverance, eloquent, peculiar, ambiguous, resilient, meticulous, consequence, flourish, baffled, hesitant
- **Avoid:** Domain-specific professional vocabulary, legal or medical terms
- **Definition style:** Conceptual but still grounded. Example: _"The ability to keep trying hard, even when things get difficult and you feel like giving up."_

### TREE (10–12 years)

- **Target words:** Words from literature, newspapers, and competitive exam preparation
- **Examples:** ostentatious, melancholy, benevolent, tenacious, eloquence, presumptuous, astute, candid, perplexed, daunting
- **Avoid:** Highly technical or legal terminology; Latin abbreviations; professional jargon
- **Definition style:** Nuanced and precise. Example: _"A deep sadness that settles over you, sometimes without a clear reason — like a rainy day feeling inside."_

---

## The System Prompt

Send this as the `system` parameter in the Claude API request. Do not alter wording without incrementing the spec version.

```
You are a master storyteller for children in India. You write warm, imaginative, culturally rich stories that help Indian children aged {{AGE_MIN}} to {{AGE_MAX}} years old learn advanced English vocabulary naturally through context.

Your stories feature Indian names, places, foods, festivals, and everyday situations that Indian children recognise. Every story teaches new words not by defining them but by using them in a context so vivid the child almost understands the meaning before they even tap the word.

You always respond in the exact JSON format requested. Never add preamble, explanation, or markdown formatting outside the JSON.
```

---

## The User Prompt Template

Send this as the `user` message. Replace all `{{VARIABLE}}` placeholders with their runtime values before sending.

```
Today is {{TODAY_DATE}}.

Write a brand new children's story for Indian kids aged {{AGE_MIN}} to {{AGE_MAX}} years old.

Requirements:
- Story length: between {{STORY_MIN_WORDS}} and {{STORY_MAX_WORDS}} words
- Include exactly {{WORD_COUNT}} vocabulary words that are slightly advanced for this age group
- Each vocabulary word must appear naturally in the story — never forced
- Wrap every vocabulary word in <v> tags: <v>magnificent</v>
- The story must have a positive, warm, or moral ending
- Indian cultural elements: use Indian names, settings, or references where natural (do not force it into every sentence)
- Never repeat a vocabulary word — each of the {{WORD_COUNT}} words must be unique

Respond ONLY in this exact JSON format with no text outside it:
{
  "title": "The story title here",
  "body": "Full story text with <v>vocabulary</v> words tagged",
  "words": [
    {
      "word": "the exact word as it appears in the story",
      "partOfSpeech": "noun | verb | adjective | adverb",
      "definition": "simple definition a {{AGE_MIN}}-year-old can understand",
      "exampleSentence": "a new example sentence different from the story, relatable for an Indian child",
      "displayOrder": 1
    }
  ]
}
```

---

## Validation Rules

After receiving the Claude response, the application **must** validate the following before persisting any records. Validation is performed in this order and must fully pass before writing to the database.

1. **Valid JSON** — Parse the raw response string with `JSON.parse()`. If it throws, go to Retry Strategy.
2. **`title` is a non-empty string** — `typeof title === 'string' && title.trim().length > 0`.
3. **`body` contains exactly `{{WORD_COUNT}}` `<v>` tags** — Count occurrences of the opening `<v>` tag. Must equal `WORD_COUNT` exactly.
4. **`words` array length equals `{{WORD_COUNT}}`** — `words.length === WORD_COUNT`.
5. **Every word in `words` appears in `body` wrapped in `<v>` tags** — For each `words[i].word`, check that `<v>${word}</v>` (case-sensitive) appears in `body`.
6. **No duplicate words** — The set of `words[i].word` values must have no repeats (case-insensitive comparison).
7. **`displayOrder` is sequential from 1** — Values must be `[1, 2, 3, ..., WORD_COUNT]` with no gaps or duplicates.
8. **`partOfSpeech` is in the allowed set** — Each value must be one of: `noun`, `verb`, `adjective`, `adverb` (lowercase, exact match).

If any validation rule fails → do not persist the record → proceed to Retry Strategy.

---

## Retry Strategy

- **Maximum retries:** 2 (meaning up to 3 total Claude API calls per request)
- **On retry:** Append the following sentence to the end of the user prompt before resending:
  > `"Your previous response failed validation. Please try again carefully and follow the JSON format exactly."`
- **Tracking retries:** Use an in-memory counter within the request handler. Do not persist retry attempts to the database.
- **If all retries exhausted:**
  1. Log the raw Claude response string at `ERROR` level for debugging (include the `ageGroup` and `TODAY_DATE` in the log context).
  2. Do **not** persist any partial data.
  3. Return HTTP `503` to the client with error code `STORY_GENERATION_FAILED`.

---

## Example Output

A complete valid Claude response for `AGE_GROUP = SEEDLING` (ages 4–6, 10 vocabulary words, 80–120 word story):

```json
{
  "title": "Priya and the Magnificent Mango Tree",
  "body": "In a small village near Mysore, there lived a <v>curious</v> girl named Priya. Every morning, she would sit beneath an <v>enormous</v> mango tree and watch the world with <v>eager</v> eyes. One day, a <v>gentle</v> old woman named Ammachi came to rest in the tree's shade. She spoke in a <v>soft</v> whisper and told Priya that the tree was <v>ancient</v> — older than the village itself. Priya felt a <v>warm</v> glow in her heart. She decided to be the tree's <v>faithful</v> guardian. From that day on, she watered it every evening with <v>tender</v> care, and the tree grew more <v>magnificent</v> than ever before.",
  "words": [
    {
      "word": "curious",
      "partOfSpeech": "adjective",
      "definition": "When you really want to know about something and keep asking questions and looking around",
      "exampleSentence": "Arjun was curious about why the sky turns orange and pink during sunset.",
      "displayOrder": 1
    },
    {
      "word": "enormous",
      "partOfSpeech": "adjective",
      "definition": "Something that is very very big — much bigger than you expected",
      "exampleSentence": "The elephant at the Mysore zoo was so enormous that Leela could not see over its back.",
      "displayOrder": 2
    },
    {
      "word": "eager",
      "partOfSpeech": "adjective",
      "definition": "Feeling very excited and ready to do something straight away",
      "exampleSentence": "Meera was eager to open her new book the moment she got home from school.",
      "displayOrder": 3
    },
    {
      "word": "gentle",
      "partOfSpeech": "adjective",
      "definition": "Soft and kind, without being rough or scary",
      "exampleSentence": "The gentle breeze from the fan felt nice during the hot afternoon.",
      "displayOrder": 4
    },
    {
      "word": "soft",
      "partOfSpeech": "adjective",
      "definition": "Very quiet and light, like a sound you have to listen carefully to hear",
      "exampleSentence": "Grandmother spoke in a soft voice so she would not wake the baby.",
      "displayOrder": 5
    },
    {
      "word": "ancient",
      "partOfSpeech": "adjective",
      "definition": "Something that is very very old — older than your grandparents and their grandparents",
      "exampleSentence": "The ancient temple near our house has beautiful stone carvings on the walls.",
      "displayOrder": 6
    },
    {
      "word": "warm",
      "partOfSpeech": "adjective",
      "definition": "A nice, happy feeling inside your chest, like a hug",
      "exampleSentence": "Seeing her little brother smile gave Divya a warm feeling all day.",
      "displayOrder": 7
    },
    {
      "word": "faithful",
      "partOfSpeech": "adjective",
      "definition": "Always there, always loyal — someone or something you can always count on",
      "exampleSentence": "Tommy was a faithful dog who waited at the gate every day for Rahul to come home.",
      "displayOrder": 8
    },
    {
      "word": "tender",
      "partOfSpeech": "adjective",
      "definition": "Doing something very carefully and gently because you care a lot",
      "exampleSentence": "Amma planted the seeds with tender hands so they would grow strong.",
      "displayOrder": 9
    },
    {
      "word": "magnificent",
      "partOfSpeech": "adjective",
      "definition": "So beautiful or so wonderful that it takes your breath away",
      "exampleSentence": "The peacock spread its magnificent feathers at the garden and everyone stopped to stare.",
      "displayOrder": 10
    }
  ]
}
```

---

## Change Log

| Version | Date        | Change                                       | Author            |
| ------- | ----------- | -------------------------------------------- | ----------------- |
| 1.0-rc1 | 05 May 2026 | Initial spec                                 | IntelliWords Team |
| 1.0     | 05 May 2026 | No fixes required; consistency review passed | FROZEN            |
