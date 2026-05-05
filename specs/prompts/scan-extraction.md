# IntelliWords — Scan Extraction Prompt Spec

Version: 1.0  
Status: FROZEN v1.0  
Used by: `POST /api/scan`  
Claude Model: `claude-sonnet-4-20250514`  
Max tokens: 1000

---

## Purpose

This document specifies the exact Claude API prompt used to extract difficult vocabulary words from arbitrary text pasted by a user (typically a paragraph from a physical book). Given a block of text and an age group, Claude identifies the words a child of that age is most likely not to know, then returns each word with a kid-friendly definition and an example sentence rooted in Indian everyday life. Like the story-generation prompt, this file is a versioned spec artifact: any change to the wording, selection criteria, or response format must be recorded here and the version incremented, because even subtle changes affect which words are surfaced and how they are explained.

---

## Input Variables

These variables are injected into the prompt template at runtime before the request is sent to Claude.

| Variable          | Type   | Example                             | Source                                         |
| ----------------- | ------ | ----------------------------------- | ---------------------------------------------- |
| `{{AGE_MIN}}`     | number | `6`                                 | `AGE_GROUPS[ageGroup]` constant                |
| `{{AGE_MAX}}`     | number | `8`                                 | `AGE_GROUPS[ageGroup]` constant                |
| `{{WORD_COUNT}}`  | number | `15`                                | `AGE_GROUPS[ageGroup].wordsPerDay` (upper cap) |
| `{{AGE_GROUP}}`   | string | `SPROUT`                            | `AgeGroupKey` enum value                       |
| `{{PASTED_TEXT}}` | string | `"The explorer trudged through..."` | Sanitised user input; max 2000 characters      |

**Note on `{{PASTED_TEXT}}`:** The text must be HTML-stripped and whitespace-normalised server-side before injection into the prompt. This prevents prompt injection via crafted HTML or markdown in the pasted content. See api-contract.md §POST /api/scan, Business Rule 3.

---

## Selection Criteria

Claude is instructed to apply these criteria when deciding which words to flag. This section makes the selection logic explicit and reviewable.

### Include a word if ALL of these are true:

- A child aged `{{AGE_MIN}}`–`{{AGE_MAX}}` is unlikely to know it
- The word appears verbatim in `{{PASTED_TEXT}}` (Claude must not invent words)
- It has genuine educational value for English vocabulary growth
- It is common enough in written English to be worth learning (not an obscure technical term the child will never see again)

### Exclude a word if ANY of these are true:

- It is a proper noun — names of people, places, brands, or titles (e.g. "Roald", "Mumbai", "Netflix")
- It is a number, symbol, or punctuation fragment
- It is a word the target age group almost certainly already knows (e.g. "happy", "big", "eat", "walk", "said" — for any age group)
- It has already appeared earlier in the returned `words` array (no duplicates)
- It is a very short word (≤ 3 letters) unless it is genuinely unusual for the age group
- It is a conjugated form of a simpler base word the child already knows (e.g. "running" if the child already knows "run")

### Ordering:

Words must be sorted by difficulty — the word a child of this age is **least** likely to know appears first (`displayOrder: 1`). If fewer difficult words exist in the text than `{{WORD_COUNT}}`, return only the qualifying words; do not pad the list.

---

## The System Prompt

Send this as the `system` parameter in the Claude API request.

```
You are an English vocabulary coach for Indian children. You read text from children's books and identify words that are challenging for a specific age group.

You explain words in the simplest possible language — the way a kind, patient teacher would explain to a child who has never heard the word before. Your example sentences always feature Indian children, Indian names, and everyday Indian situations.

You always respond in the exact JSON format requested. Never add preamble, explanation, or markdown outside the JSON.
```

---

## The User Prompt Template

Send this as the `user` message. Replace all `{{VARIABLE}}` placeholders with their runtime values before sending.

```
Read this text carefully:

"{{PASTED_TEXT}}"

Find the {{WORD_COUNT}} most difficult words in this text for a child aged {{AGE_MIN}} to {{AGE_MAX}} years old.

Rules:
- Only use words that actually appear in the text above — do not invent or substitute words
- Do not include proper nouns (names of people or places)
- Pick the words a child this age is MOST likely not to know
- If there are fewer than {{WORD_COUNT}} difficult words in the text, return only the ones that qualify — do not pad the list
- Do not include the same word twice
- Sort by difficulty: hardest word first (displayOrder: 1)

Respond ONLY in this exact JSON format with no text outside it:
{
  "words": [
    {
      "word": "exact word from the text",
      "partOfSpeech": "noun | verb | adjective | adverb",
      "definition": "simple meaning a {{AGE_MIN}}-year-old understands",
      "exampleSentence": "new sentence with Indian context, easy for this age group",
      "displayOrder": 1
    }
  ]
}
```

---

## Validation Rules

After receiving the Claude response, the application **must** validate the following. Scan validation is intentionally more lenient than story generation — a partial result is better than a hard failure when the user has just pasted book text.

1. **Valid JSON** — Parse with `JSON.parse()`. If it throws, return HTTP 503 with `SCAN_FAILED` error code (no retry for scan — user can re-submit).
2. **`words` is an array** — `Array.isArray(words)`. An empty array `[]` is valid and means no difficult words were found.
3. **Each word exists in `{{PASTED_TEXT}}`** — For each entry, verify `PASTED_TEXT.toLowerCase().includes(words[i].word.toLowerCase())`. Remove any entries that fail this check rather than failing the whole request.
4. **No duplicate words** — Deduplicate by `word` value (case-insensitive). Keep the first occurrence.
5. **`displayOrder` is sequential from 1** — If the values are not sequential, re-assign them in the order received (`1, 2, 3, ...`) rather than failing.
6. **`words.length` does not exceed `{{WORD_COUNT}}`** — Truncate to `WORD_COUNT` if Claude returns more.

**Policy:** If individual entries fail rules 3 or 4, remove those entries silently and return the remaining valid words. Do not surface a 4xx error to the client for partial validation failures on scan — return whatever valid data was recovered.

---

## Edge Cases

| Scenario                                                               | Handling                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty text input**                                                   | Return `{ "sessionId": null, "words": [] }` immediately without calling Claude.                                                                                                                                                                                      |
| **Text shorter than 20 words**                                         | Call Claude as normal. Expect few or zero results. An empty `words` array is a valid response.                                                                                                                                                                       |
| **Text in a mix of Hindi and English (Hinglish)**                      | Claude should flag only English words that are difficult for the age group. Hindi words are not flagged. This is handled naturally by the prompt; no special pre-processing required.                                                                                |
| **Text with no difficult words**                                       | Claude returns `{ "words": [] }`. This is fully valid. Surface the `EmptyState` in `ScanResults`.                                                                                                                                                                    |
| **Text that appears inappropriate or harmful**                         | Claude will decline to process it and return a non-JSON response or a refusal message. The JSON parse in validation rule 1 will fail. Return HTTP 503 with a generic `"Unable to process this text."` message. Do not expose Claude's refusal message to the client. |
| **Text that is entirely a foreign language (not English or Hinglish)** | Claude will likely return `{ "words": [] }` or flag nothing. Surface `EmptyState`. No special handling required.                                                                                                                                                     |
| **`childId` provided but child not found**                             | Server-side check before calling Claude (see api-contract.md §POST /api/scan). Return 404 before the prompt is sent.                                                                                                                                                 |

---

## Example Output

### Input

**Age group:** SPROUT (6–8 years)  
**Text pasted:**

```
The explorer trudged through the dense undergrowth, her lantern casting a feeble glow in the darkness. She had been searching for the ancient ruins for three days. Every step felt more arduous than the last.
```

### Valid Claude Response

```json
{
  "words": [
    {
      "word": "trudged",
      "partOfSpeech": "verb",
      "definition": "To walk slowly and heavily when you are very tired, like walking through deep mud or sand",
      "exampleSentence": "Ravi trudged home from school carrying his heavy school bag in the hot afternoon sun.",
      "displayOrder": 1
    },
    {
      "word": "undergrowth",
      "partOfSpeech": "noun",
      "definition": "The low plants, bushes, and grass that grow close to the ground under tall trees in a forest",
      "exampleSentence": "When we went hiking near Coorg, Appa used a stick to clear the undergrowth from the path.",
      "displayOrder": 2
    },
    {
      "word": "feeble",
      "partOfSpeech": "adjective",
      "definition": "Something that is very weak and not very bright or strong — barely there",
      "exampleSentence": "During the power cut, the old torch gave only a feeble light that flickered every few seconds.",
      "displayOrder": 3
    },
    {
      "word": "arduous",
      "partOfSpeech": "adjective",
      "definition": "Something that needs a lot of effort and energy and is very hard to do",
      "exampleSentence": "Climbing all the steps to the temple on the hill was arduous, but the view from the top was worth it.",
      "displayOrder": 4
    }
  ]
}
```

**Note:** "ancient" was not flagged because SPROUT-age children are likely to encounter and understand it from school. "dense", "ruins", and "darkness" were not flagged because they fall within typical 6–8 year vocabulary. The proper noun "The explorer" was correctly excluded.

---

## Change Log

| Version | Date        | Change                                       | Author            |
| ------- | ----------- | -------------------------------------------- | ----------------- |
| 1.0-rc1 | 05 May 2026 | Initial spec                                 | IntelliWords Team |
| 1.0     | 05 May 2026 | No fixes required; consistency review passed | FROZEN            |
