# VELYRA — FINAL RICH DOCUMENT EDITOR & MEDIA SYSTEM UPGRADE
## Post-Completion Implementation Specification

### PROJECT STATUS

Velyra is a **fully built and functional Windows desktop offline diary application**.

All previously planned development phases have already been completed.

This task is **NOT application development from scratch**.

This is a final, focused upgrade to the existing diary editor and media system.

The existing application, architecture, database, authentication, 3D diary, navigation, settings, backup/restore, and other completed functionality must be treated as working production functionality.

The objective is to improve the existing writing experience so that it behaves much more like a **Microsoft Word-style rich document editor**, especially for text formatting and multimedia placement.

---

# 1. ABSOLUTE RULES

Before doing anything:

1. Inspect the complete existing Velyra project.
2. Run the fully built application.
3. Inspect the current editor implementation.
4. Inspect the current document/data model.
5. Inspect how images and videos are stored.
6. Inspect how diary entries are serialized and restored.
7. Inspect the current toolbar.
8. Inspect undo/redo.
9. Inspect autosave.
10. Inspect the local database/storage layer.
11. Determine which rich-text editor library or custom editor implementation is currently being used.

### DO NOT:

- rebuild Velyra
- create a new application
- replace the existing architecture unnecessarily
- replace Electron
- replace React
- replace TypeScript
- replace Three.js
- replace the database unnecessarily
- remove existing diary entries
- remove authentication
- change the 3D diary unnecessarily
- change the existing visual design unnecessarily
- add cloud storage
- upload media to the internet
- add voice commands
- add microphone functionality
- add an online AI assistant
- add unrelated features
- rewrite working functionality simply because another implementation is possible

Use:

**INSPECT → PLAN → IMPLEMENT ONE STEP → TEST → VERIFY → NEXT STEP**

---

# 2. MOST IMPORTANT REQUIREMENT

The application is already fully built.

Therefore, the objective is:

> **Extend and improve the existing editor without breaking anything that already works.**

Do not assume that the existing implementation is wrong.

First understand it.

If the current editor library already supports a feature, use its native capabilities rather than creating a fragile custom implementation.

If the current architecture cannot support a feature directly, design the smallest safe extension.

---

# 3. WORK IN EXPLICIT STEPS

This task must be performed in separate steps.

## STEP 0 — FULL INSPECTION

Before modifying code:

- inspect the project structure
- identify the editor
- identify the document model
- identify the database schema
- identify media storage
- identify the save pipeline
- identify the restore pipeline
- identify undo/redo
- identify current media insertion behavior
- identify current toolbar behavior

Then produce a concise report:

### Current Editor
- editor technology:
- document model:
- storage format:
- media model:
- save mechanism:
- restore mechanism:
- undo/redo:
- current limitations:

### Proposed Architecture
Explain how the requested features can be added without breaking existing functionality.

### IMPORTANT

After completing Step 0:

**STOP AND WAIT FOR MY EXPLICIT APPROVAL.**

Do not modify the code during Step 0.

---

# 4. STEP 1 — IMPROVE WORD-STYLE TEXT EDITING

After approval, improve the existing editor.

Do not remove any currently supported features.

Add or improve the following.

## Text styles

Support:

- Normal text
- Title
- Subtitle
- Heading 1
- Heading 2
- Heading 3
- Heading 4 where practical

## Character formatting

Support:

- Bold
- Italic
- Underline
- Strikethrough
- Superscript
- Subscript
- Font family
- Font size
- Text color
- Text highlight
- Clear formatting

## Paragraph formatting

Support:

- left alignment
- center alignment
- right alignment
- justified alignment
- line spacing
- paragraph spacing
- indentation
- increase indent
- decrease indent
- block quote

## Lists

Support:

- bullet lists
- numbered lists
- nested lists
- checklist/task list if compatible with the existing editor

## Editing

Support:

- undo
- redo
- copy
- cut
- paste
- select all
- keyboard navigation
- normal cursor placement
- normal text selection

Do not break existing keyboard shortcuts.

---

# 5. STEP 1 TEST

After implementing text-editor improvements:

Test:

1. normal typing
2. headings
3. bold
4. italic
5. underline
6. text color
7. highlighting
8. alignment
9. lists
10. undo
11. redo
12. save
13. close application
14. reopen
15. verify formatting remains

Only proceed when these tests pass.

---

# 6. STEP 2 — CHANGE MEDIA FROM "END OF DOCUMENT" TO "CURSOR INSERTION"

This is one of the most important changes.

### CURRENT PROBLEM

Images/videos are currently added at the end of the diary content.

That behavior must be changed.

### REQUIRED BEHAVIOR

Media must be inserted at the user's current cursor/selection position.

Example:

User has:

```text
Today I visited the museum and saw
some amazing historical artifacts.
```

Cursor is between the two sentences.

When the user chooses Add Image:

```text
Today I visited the museum and saw

[IMAGE]

some amazing historical artifacts.
```

The image must NOT automatically move to the end.

---

# 7. CURSOR INSERTION TEST CASES

Test all of these.

## Test A — Middle of paragraph

```text
Hello this is my diary entry.
```

Place cursor after:

```text
Hello this
```

Insert image.

Expected:

```text
Hello this

[IMAGE]

is my diary entry.
```

If the editor supports true inline embedding, preserve the correct text/node flow.

## Test B — Between paragraphs

```text
Paragraph 1.

Paragraph 2.
```

Place cursor between paragraphs.

Insert image.

Expected:

```text
Paragraph 1.

[IMAGE]

Paragraph 2.
```

## Test C — After text

```text
Paragraph.
```

Place cursor at the end.

Insert video.

Expected:

```text
Paragraph.

[VIDEO]
```

## Test D — Between existing media and text

```text
[IMAGE]

Paragraph.
```

Place cursor between image and paragraph.

Insert video.

Expected:

```text
[IMAGE]

[VIDEO]

Paragraph.
```

## Test E — Continue typing after media

Insert an image.

Click below it.

Type text.

Expected:

```text
[IMAGE]

New text here.
```

---

# 8. STEP 3 — USE A REAL DOCUMENT FLOW

Text and media must be part of one ordered document structure.

Conceptually:

```text
Document
 ├── paragraph
 ├── paragraph
 ├── image
 ├── paragraph
 ├── video
 ├── paragraph
 └── paragraph
```

Do NOT maintain a model such as:

```text
all text
+
separate media array appended at the end
```

if that architecture prevents proper positioning.

Prefer the native document/node model of the existing editor.

Possible node types:

- paragraph
- heading
- list
- quote
- image
- video
- table
- link
- page break

Use only the node types actually required by the implementation.

---

# 9. STEP 4 — IMAGE RESIZING

Images currently consume too much screen space.

When an image is selected, show resize handles.

Allow:

- resize smaller
- resize larger
- proportional resize
- reset size

Maintain aspect ratio by default.

Do not distort photographs.

---

# 10. IMAGE SIZE PRESETS

Provide:

- Small
- Medium
- Large
- Full Width

Suggested behavior:

### Small
Approximately 25% of available content width.

### Medium
Approximately 50%.

### Large
Approximately 75%.

### Full Width
Approximately 100%.

These should be sensible presets, not rigid sizes that prevent manual resizing.

---

# 11. STEP 5 — IMAGE ALIGNMENT

When an image is selected, support:

- Left
- Center
- Right
- Full Width

Example:

```text
Text above.

        [IMAGE]

Text below.
```

The user should be able to choose the alignment.

---

# 12. STEP 6 — TEXT WRAPPING AROUND IMAGES

This is a major requirement.

Support Word-like image layout behavior where technically reliable.

At minimum:

### Inline

Image behaves as part of the document flow.

### Text Wrap / Square

Text can flow beside the image.

### Top and Bottom

Text stays above and below the image.

If true Microsoft Word-style floating positioning is incompatible with the current editor, implement the most stable equivalent.

Do not create unstable free-floating objects.

---

# 13. STEP 7 — WRITING BESIDE IMAGES

The user must be able to create layouts such as:

```text
┌───────────────┐
│               │   This is where I can
│     IMAGE     │   write text beside the
│               │   image. The text should
└───────────────┘   continue naturally.
```

The image should not automatically occupy the entire page width.

The user should be able to choose a smaller size and a wrapping mode.

---

# 14. STEP 8 — VIDEO RESIZING

Videos must behave similarly to images.

Support:

- Small
- Medium
- Large
- Full Width
- manual resize
- alignment

Maintain video aspect ratio.

Do not automatically make every imported video full-page width.

---

# 15. STEP 9 — VIDEO CONTROLS

Keep normal local video controls:

- play/pause
- seek
- volume
- fullscreen where supported

Videos must remain local/offline.

Do not upload or stream videos through an external service.

---

# 16. STEP 10 — MEDIA CONTEXT TOOLBAR

When an image/video is selected, show a contextual toolbar.

For example:

```text
Align:
[Left] [Center] [Right]

Size:
[Small] [Medium] [Large] [Full]

Layout:
[Inline] [Wrap] [Top & Bottom]

[Replace] [Delete]
```

For images:

- Replace
- Reset size
- Reset position where supported

For videos:

- Replace
- Reset size
- Delete

Do not permanently occupy the main toolbar with these controls.

Show them only when media is selected.

---

# 17. STEP 11 — MEDIA SELECTION

When clicking an image/video:

- show a subtle selection border
- show resize handles
- show media toolbar
- allow Delete/Backspace to remove it
- maintain normal document behavior

Click elsewhere to deselect.

---

# 18. STEP 12 — MEDIA PERSISTENCE

When saving the diary, persist:

- media
- media order
- media size
- media alignment
- media layout mode
- media position where supported

After restarting Velyra, restore the document exactly enough that the user does not lose their layout.

Example:

Before closing:

```text
Paragraph

[Small centered image]

Paragraph

[Medium wrapped video]

Paragraph
```

After reopening:

```text
Paragraph

[Small centered image]

Paragraph

[Medium wrapped video]

Paragraph
```

---

# 19. STEP 13 — UNDO/REDO

Where supported by the editor architecture, integrate media operations with undo/redo.

Examples:

- insert image
- resize image
- change alignment
- change wrapping
- delete image
- insert video
- resize video
- delete video

Do not break existing text undo/redo.

---

# 20. STEP 14 — TABLES

If the current editor library supports tables cleanly, add:

- insert table
- rows
- columns
- basic cell editing
- add row
- delete row
- add column
- delete column
- basic cell alignment

This is lower priority than media insertion/resizing/wrapping.

If implementing tables would destabilize the editor, do not force them.

---

# 21. STEP 15 — HYPERLINKS

If not already supported:

- insert link
- edit link
- remove link

Keep the application offline.

Opening a link should be an explicit user action and may use the system browser.

---

# 22. STEP 16 — PAGE BREAKS

If compatible with the current diary architecture, provide:

**Insert → Page Break**

This must not break the physical diary's existing two-page navigation.

Page breaks should be document-level formatting, not a replacement for the existing physical diary page system.

---

# 23. STEP 17 — DATA MIGRATION / BACKWARD COMPATIBILITY

Existing diary entries must not be lost.

Before changing the document model:

1. inspect existing stored entries
2. determine their current format
3. design a backward-compatible migration
4. test with existing entries
5. preserve existing images/videos
6. preserve existing text
7. preserve formatting

If old media was stored separately, migrate it safely into the new document flow where necessary.

Never delete existing user data.

---

# 24. STEP 18 — PERFORMANCE

The editor must remain responsive with:

- long diary entries
- many paragraphs
- many images
- multiple videos
- mixed text/media
- scrolling
- resizing
- undo/redo
- reopening large entries

Do not load all large videos into memory unnecessarily.

Do not duplicate large media files unnecessarily.

Use the existing local storage architecture efficiently.

---

# 25. STEP 19 — VISUAL DESIGN

Do not redesign the entire Velyra interface.

Keep the existing Velyra visual identity.

The editor should feel like:

**Microsoft Word functionality + Velyra antique diary appearance.**

Maintain:

- warm/off-white paper
- elegant typography
- existing diary styling
- restrained toolbar
- readable controls

Do not make it look like a generic web text editor.

---

# 26. STEP 20 — FINAL END-TO-END TEST

After implementation, actually run the application and perform this test.

### Text

1. Create a new diary entry.
2. Type multiple paragraphs.
3. Add headings.
4. Apply bold/italic/underline.
5. Change text color.
6. Apply alignment.
7. Create lists.
8. Undo.
9. Redo.

### Image

10. Place cursor between paragraphs.
11. Insert image.
12. Verify it appears at the cursor.
13. Resize to Small.
14. Resize to Medium.
15. Resize manually.
16. Center it.
17. Set text wrapping.
18. Write text beside it.
19. Move to another location if supported.
20. Delete it.
21. Undo deletion.

### Video

22. Place cursor between paragraphs.
23. Insert video.
24. Verify it appears at the cursor.
25. Resize it.
26. Change alignment.
27. Continue typing below it.
28. Play the video.
29. Save.

### Persistence

30. Close Velyra.
31. Reopen Velyra.
32. Verify text.
33. Verify formatting.
34. Verify image position.
35. Verify image size.
36. Verify video position.
37. Verify video size.
38. Verify wrapping/alignment.
39. Verify no media was moved to the end.

### Existing data

40. Open an old diary entry created before this implementation.
41. Verify its content.
42. Verify existing media.
43. Verify formatting.
44. Save it.
45. Reopen it.

---

# 27. IMPORTANT VISUAL TEST

The current screenshot shows an image taking almost the entire available page.

The final implementation must allow the user to turn that into something more like:

```text
┌──────────────────────────────────────────────┐
│ My diary entry begins here.                  │
│                                              │
│ ┌──────────────┐   I can continue writing   │
│ │              │   beside the image here.   │
│ │    IMAGE     │   The image does not       │
│ │              │   consume the entire page. │
│ └──────────────┘                             │
│                                              │
│ The next paragraph continues below...        │
└──────────────────────────────────────────────┘
```

The user must have control over the media's size.

---

# 28. DEFINITION OF DONE

This task is complete only when:

- text editing feels significantly closer to Microsoft Word
- media inserts at the cursor
- images can be resized
- videos can be resized
- media can be aligned
- images can use text wrapping where supported
- the user can write beside smaller images
- media remains in the correct document position after saving
- media remains in the correct position after restarting
- existing diary entries still work
- existing functionality still works
- undo/redo still works
- the application remains fully offline
- the application remains responsive
- no existing features are removed

---

# 29. REQUIRED WORKFLOW FOR ANTIGRAVITY

Follow this exact workflow.

## Phase A — Inspect

Inspect the complete existing implementation.

**STOP.**

Report findings.

## Phase B — Plan

Create a detailed implementation plan based on the actual existing architecture.

**STOP.**

Wait for approval.

## Phase C — Text editor upgrade

Implement Step 1.

Test.

Report.

**STOP.**

## Phase D — Document/media architecture

Implement Steps 2–3.

Test.

Report.

**STOP.**

## Phase E — Image system

Implement Steps 4–7.

Test.

Report.

**STOP.**

## Phase F — Video system

Implement Steps 8–10.

Test.

Report.

**STOP.**

## Phase G — Persistence and compatibility

Implement Steps 12–13 and 17.

Test existing and new diary entries.

Report.

**STOP.**

## Phase H — Optional editor features

Implement Steps 14–15 only if they are compatible and stable.

Test.

Report.

**STOP.**

## Phase I — Final validation

Implement remaining requirements.

Run the complete end-to-end test.

Report all results.

**STOP.**

---

# 30. FINAL INSTRUCTION

The existing Velyra application is already fully built.

Your job is to **upgrade the existing editor**, not build another application.

Do not make large architectural changes unless the current implementation genuinely prevents the required behavior.

Prioritize:

1. Cursor-based media insertion
2. Proper text + media document flow
3. Image resizing
4. Video resizing
5. Image alignment
6. Text wrapping
7. Writing beside images
8. Correct persistence
9. Word-style formatting
10. Backward compatibility
11. Stability
12. Performance

At every stage:

**Inspect → Implement → Run → Test → Report → STOP**

Never automatically continue to the next stage without explicit approval.

The final result should feel like:

> **Microsoft Word-level document flexibility inside a beautiful offline Velyra diary.**
