# 3D OFFLINE DIARY — ANTIGRAVITY PROJECT SPECIFICATION

## PROJECT OVERVIEW

Build a complete, polished, production-quality **offline personal diary application for Windows**.

This is a real desktop application, not a website mockup.

The final application must be installable as a Windows `.exe` and must work fully offline after installation.

The centerpiece of the application is a realistic **3D physical diary/book rendered with Three.js**.

The application should feel like a premium physical journal transformed into a private digital desktop diary.

---

# IMPORTANT REFERENCE IMAGE

A visual reference image is included in the same project folder.

Expected reference image filename:

`diary_reference.png`

If the actual filename is different, locate the diary reference image in the project folder and use it.

## HOW TO USE THE REFERENCE

Use the image as a **visual design reference**, not as a runtime image asset and not as something that must simply be displayed in the application.

Recreate the diary as an original optimized Three.js 3D model inspired by the reference.

Match the overall visual direction, including:

- dark burgundy / deep reddish-brown leather cover
- antique / magical-journal aesthetic
- ornate golden decorative details
- premium old-book appearance
- visible spine
- realistic page thickness
- warm off-white / ivory pages
- slightly aged but clean paper
- elegant medieval / magical-book feeling
- realistic physical proportions
- subtle imperfections
- warm, sophisticated presentation

IMPORTANT:

The INSIDE PAGES of the application should remain mostly **plain off-white/ivory pages**, suitable for writing.

Do not fill the normal diary pages with large decorative illustrations.

Small subtle decorative details are acceptable around page edges or corners, but readability and writing space are the priority.

Do NOT use copyrighted Hogwarts/Harry Potter logos, exact house crests, characters, movie assets, or other protected artwork.

Create an original magical-school / antique-journal aesthetic.

---

# 1. CORE REQUIREMENTS

The application must:

1. Work completely offline after installation.
2. Require no internet connection for normal usage.
3. Require no cloud database.
4. Require no online account.
5. Store diary entries locally.
6. Store imported images and videos locally.
7. Start by showing a realistic closed 3D diary.
8. On first launch, ask the user to create a password.
9. On later launches, clicking the diary should show the password login.
10. After successful authentication, the diary should open.
11. Show two pages at the same time like a real open physical journal.
12. On the initial spread:
   - left page = beautiful welcome note
   - right page = dynamic index of diary entries
13. Provide small page navigation buttons on the left and right sides.
14. Clicking a visible page should enlarge/focus that page.
15. The user should be able to write and edit diary content.
16. Provide a rich text editor.
17. Support headings, font styles, colors, alignment, underline and other important formatting controls.
18. Allow users to insert images from their Windows computer.
19. Allow users to insert videos from their Windows computer.
20. Allow imported media to be resized and repositioned before insertion.
21. Autosave diary changes locally.
22. Restore diary data after restarting the application.
23. Provide local search.
24. Provide local backup and restore.
25. Provide settings.
26. Produce a Windows installer / executable.
27. Remain usable with no internet connection.
28. Do NOT implement voice commands.

---

# 2. TECHNOLOGY STACK

Use this stack unless a strong technical reason requires a change.

## Desktop

Electron

## Frontend

React + TypeScript

## Build Tool

Vite

## 3D Engine

Three.js

The physical diary must genuinely use Three.js.

Do not fake the entire diary using only CSS transforms.

## Rich Text Editing

Use a mature editor such as:

- Tiptap / ProseMirror

or another strong open-source editor suitable for a local desktop application.

The editor should remain high quality and maintainable.

## Local Database

Prefer SQLite or another robust local database.

## Packaging

Use Electron Builder or an equivalent reliable Windows packaging solution.

---

# 3. OFFLINE-FIRST ARCHITECTURE

The project must be designed around local-first operation.

Do NOT use:

- Firebase
- Supabase
- MongoDB Atlas
- cloud storage
- online authentication
- remote API dependencies
- CDN-loaded application assets
- Google Fonts loaded over the network
- AI services requiring internet

All runtime dependencies, assets and fonts must be bundled with the application.

Suggested architecture:

Electron Main Process
        |
        | secure IPC
        v
Local Services
        |
        +---- SQLite database
        |
        +---- password/security layer
        |
        +---- media storage
        |
        +---- backup/restore
        |
        +---- application settings

Renderer:

React UI
    |
    +---- Three.js diary scene
    |
    +---- Page viewer
    |
    +---- Rich text editor
    |
    +---- Media manager
    |
    +---- Search
    |
    +---- Settings

Keep clear separation between:

- Electron main process
- preload
- renderer
- database
- media storage
- Three.js engine
- UI state

---

# 4. ELECTRON SECURITY

Use secure Electron architecture.

Required:

- `contextIsolation: true`
- `nodeIntegration: false`
- secure preload bridge
- controlled IPC methods
- validate IPC arguments
- never expose arbitrary Node.js APIs to the renderer

Do not directly expose filesystem access to the React renderer.

Create explicit APIs for:

- authentication
- entries
- pages
- media
- settings
- backup
- restore
- file selection

---

# 5. PASSWORD / AUTHENTICATION

## FIRST LAUNCH

When the application is launched for the first time:

Show:

### CREATE YOUR DIARY PASSWORD

Fields:

- Password
- Confirm password

Validate:

- password cannot be empty
- both values must match
- enforce a sensible minimum password length

Never store the plaintext password.

Store a secure salted password hash using an appropriate password-hashing approach.

## NORMAL LAUNCH

Flow:

Application starts
        ↓
Closed 3D diary
        ↓
User clicks diary
        ↓
Password dialog appears
        ↓
Correct password
        ↓
Diary unlock animation
        ↓
Diary opens

Incorrect password:

- show clear error
- do not unlock
- do not reveal sensitive details

Add sensible protection against repeated incorrect attempts.

Do not create a hidden master password.

---

# 6. LOCAL DATA SECURITY

Because diary content is private, design the storage layer with strong local security in mind.

Prefer an architecture where the user's password can be used to derive a key for protecting sensitive diary data.

Use a modern authenticated encryption approach such as AES-GCM where appropriate.

At minimum:

- password should not be stored in plaintext
- sensitive structured diary data should be protected where practical
- document the security architecture in `ARCHITECTURE.md`

If full video-file encryption causes unacceptable performance or complexity, architect the media layer so encryption can be added cleanly later.

---

# 7. FIRST VISUAL EXPERIENCE

When the application launches, the user should immediately see a **beautiful closed diary** in the center.

The diary is the main visual element.

## Visual style

Use the provided reference image as direction.

Desired qualities:

- deep burgundy / wine-colored leather
- antique magical-journal character
- ornate gold detailing
- premium leather texture
- visible stitching/details where practical
- visible spine
- metal clasp/details if appropriate
- realistic page block
- warm off-white/ivory paper
- subtle natural paper texture
- elegant shadows
- soft warm lighting
- dark neutral surroundings
- cinematic but not distracting presentation

The final result should feel like:

**a premium enchanted antique journal**

not:

**a generic 3D book**

and not:

**a cartoon game prop**.

---

# 8. THREE.JS DIARY MODEL

Create the diary itself using Three.js.

The scene should contain at minimum:

- front cover
- back cover
- spine
- page block
- individual or grouped page layers
- page surfaces
- paper edges
- realistic cover thickness
- realistic page thickness

Use efficient geometry.

Do not create unnecessarily high-poly assets.

---

# 9. MATERIALS

## COVER

Create an original leather-like material.

Properties should suggest:

- deep burgundy
- rough leather
- subtle variation
- low-to-moderate specular response
- realistic roughness

Add gold/brass-like decorative material for:

- corner elements
- border
- clasps
- symbols
- other decorative pieces

## PAGES

Pages should be:

- plain off-white
- warm ivory
- readable
- lightly textured
- slightly rough

Do not make pages look dark brown.

Do not make every page heavily decorated.

---

# 10. COVER DESIGN

Inspired by the reference, create an original ornate cover.

Possible elements:

- decorative gold border
- corner protection
- central original crest/symbol
- star-like or celestial accents
- subtle magical ornament
- antique clasp

IMPORTANT:

Do not use exact Hogwarts branding, Harry Potter artwork, house logos, movie props, or protected logos.

The design should feel inspired by classic magical-school fantasy while remaining original.

---

# 11. LIGHTING

Use a sophisticated Three.js lighting setup.

Possible setup:

- warm key light
- soft fill
- ambient light
- subtle rim light
- soft shadowing

Avoid excessive bloom/glow.

The pages must remain easy to read.

---

# 12. CAMERA

Use a controlled camera.

Initial state:

- diary centered
- closed
- visible from a slightly elevated perspective
- enough space around it
- attractive book proportions

Do not allow unrestricted camera rotation that could make the diary difficult to use.

Possible camera interaction:

- controlled zoom
- limited pan

The diary should remain the focus.

---

# 13. OPENING ANIMATION

When the user clicks the closed diary:

1. React to the click.
2. Trigger a subtle interaction animation.
3. Show password screen if authentication is required.
4. After successful authentication, animate the diary opening.
5. Open the front cover.
6. Move pages naturally.
7. Settle into the two-page spread.

Use smooth easing.

The animation should feel physical rather than mechanical.

---

# 14. TWO-PAGE OPEN DIARY

After unlocking:

Display a real open-book spread.

Example:

+----------------------+----------------------+
|                      |                      |
|      LEFT PAGE       |      RIGHT PAGE      |
|                      |                      |
|   WELCOME NOTE       |        INDEX         |
|                      |                      |
+----------------------+----------------------+

The pages should meet naturally at the spine.

Use slight curvature if possible.

Maintain realistic perspective.

---

# 15. WELCOME PAGE

First left page:

# Welcome to Your Diary

Suggested content:

"These pages belong only to you.

Write your thoughts, memories, ideas, plans and moments here.

There is no right way to fill these pages.

Your story begins here."

Make the content editable later.

Use elegant typography.

Keep the page mostly plain off-white with subtle decorative details only.

---

# 16. INDEX PAGE

First right page:

# INDEX

Populate dynamically from actual diary entries.

Each row/item can show:

- title
- date
- page number

Clicking an index item should navigate directly to the corresponding entry/page.

The index must automatically update when:

- an entry is created
- title changes
- entry deleted
- page structure changes

Do NOT hardcode the index.

---

# 17. PAGE NAVIGATION

Add small elegant controls on both sides of the diary.

Left:

Previous spread

Right:

Next spread

Controls should:

- be visually subtle
- not cover the diary
- be easy to click
- work with mouse
- be keyboard accessible

Keyboard:

Left Arrow = previous spread
Right Arrow = next spread

Do not intercept arrow keys while the user is actively typing in an editor.

---

# 18. REALISTIC PAGE TURNING

This is a core feature.

When moving forward:

Right-hand page turns toward the left.

When moving backward:

Left-hand page turns toward the right.

Create a physical-looking animation.

The page should:

- rotate
- bend/curve slightly
- cast/receive appropriate shadow
- have realistic thickness
- have natural easing

Do not merely instantly replace page content.

Target page-turn duration:

approximately 500–900 ms.

Prevent glitches during rapid repeated clicking.

Possible approach:

- Three.js page meshes
- pivot points near the spine
- controlled rotation
- simple bending deformation/shader if practical
- appropriate shadowing

Keep the implementation performant.

---

# 19. CLICKING A PAGE

When the user clicks either currently visible page:

Enter a focus mode.

Example:

Normal:

[ LEFT PAGE ][ RIGHT PAGE ]

Focused:

[           LARGE SELECTED PAGE            ]

Animate smoothly.

The focused page should become easier to read and edit.

Provide a clear method to return to the normal spread:

- Back to Diary button
- Escape key
- clicking outside the focused area where appropriate

---

# 20. PAGE MODES

Use three main interaction modes.

## NORMAL MODE

Two pages visible.

Used mainly for navigation and reading.

## FOCUS MODE

One page is enlarged.

Used for detailed reading.

## EDIT MODE

A focused page becomes editable with the rich text toolbar.

Keep these modes visually consistent.

---

# 21. ENTRY CREATION

Provide:

`+ New Entry`

Creating an entry should allow:

- title
- date
- body

Example:

Title:
`Today`

Date:
`2 October 2026`

Body:
`Today I...`

Entries must receive stable IDs.

---

# 22. RICH TEXT EDITOR

Provide a polished toolbar.

Include at minimum:

- Undo
- Redo
- H1
- H2
- H3
- Paragraph
- Font family
- Font size
- Bold
- Italic
- Underline
- Strikethrough
- Text color
- Highlight color
- Align left
- Center
- Align right
- Justify
- Bullet list
- Numbered list
- Checklist
- Indent
- Outdent
- Quote
- Horizontal divider
- Clear formatting

Useful keyboard shortcuts should work.

---

# 23. PAGE TYPOGRAPHY

The default diary page should use a readable elegant serif style.

Possible:

Body:
classical serif

Headings:
ornate but readable serif

Optional small handwritten accent:

Use only if it remains highly readable.

All fonts must be bundled locally.

Do not load fonts from Google or other external websites at runtime.

---

# 24. WRITING AREA

The editor must respect realistic page margins.

The text should stay inside the printable region.

Create:

- top margin
- bottom margin
- inner margin
- outer margin

Do not allow text to cover the spine.

Do not allow content to visually escape the paper.

If content exceeds one page:

continue into additional pages.

Do not simply overflow beyond page boundaries.

---

# 25. OPTIONAL PAPER STYLES

Architect the page renderer so additional themes can be added later.

Possible future styles:

- Classic
- Lined
- Minimal
- Vintage
- Dotted

For the first release:

Implement only a clean warm **plain off-white** paper.

---

# 26. IMAGE IMPORT

Provide:

`+ Add Image`

Use the native Windows file picker through Electron.

Support at minimum:

- JPG / JPEG
- PNG
- WEBP

GIF is optional.

After selecting an image:

show an insertion/editing interface.

Allow:

- resize
- move
- crop if practical
- rotate if practical
- delete
- confirm insertion

Preserve aspect ratio by default.

Keep image inside page bounds.

---

# 27. VIDEO IMPORT

Provide:

`+ Add Video`

Use a native file picker.

Support common locally playable video formats.

After selection:

1. Show preview.
2. Allow resize.
3. Allow repositioning.
4. Insert into the diary page.

The video should support normal playback controls.

Do not upload it anywhere.

Do not depend on online video playback.

Avoid loading entire large video files into memory.

Use local file references/streaming as appropriate.

---

# 28. MEDIA RESIZING AND POSITIONING

When an image or video is selected:

Display a visible bounding box.

Allow:

- drag to move
- corner/edge handles to resize
- maintain aspect ratio by default
- delete
- rotate if implemented

Keep media inside the page boundaries.

Media properties should persist.

---

# 29. MEDIA STORAGE

Use a dedicated application-data directory.

Conceptual structure:

AppData/
    Diary/
        database/
        media/
            images/
            videos/
        backups/
        settings/

Store media files on disk.

Store metadata in the database.

Possible metadata:

- media ID
- entry ID
- page ID
- file reference
- media type
- width
- height
- x position
- y position
- rotation
- created date

Do not depend on temporary browser object URLs for persistence.

---

# 30. DATABASE DESIGN

Create a robust schema.

Possible tables/entities:

- diary
- entries
- pages
- media
- settings

Example relationship:

Diary
    |
    +--- Entries
          |
          +--- Pages
                |
                +--- Media

Every entry/page should have stable IDs and timestamps.

Avoid hardcoded page numbers.

---

# 31. PAGE DATA MODEL

A page should contain fields conceptually similar to:

- id
- entryId
- orderIndex
- pageNumber
- content
- createdAt
- updatedAt

Additional fields may be used when necessary.

The page renderer must read data dynamically.

---

# 32. AUTOSAVE

Autosave all editing changes locally.

Do not save to the database on every keystroke without debouncing.

Recommended behavior:

User stops typing
        ↓
wait approximately 500–1500 ms
        ↓
save

Also save on:

- page change
- editor blur
- image position change
- media insertion
- media deletion
- entry close
- application exit

Show subtle status:

`Saving...`

or

`Saved`

Do not make saving notifications distracting.

---

# 33. RESTORATION AFTER RESTART

When the application restarts, restore:

- diary entries
- pages
- text formatting
- titles
- dates
- images
- videos
- media sizes
- media positions
- settings
- selected theme
- last viewed page/spread where practical

The diary should feel persistent.

---

# 34. SEARCH

Create a local search system.

Search through:

- entry titles
- diary body text

Display:

- title
- date
- text preview

Clicking a result navigates directly to the entry/page.

Search must work entirely offline.

---

# 35. ENTRY MANAGEMENT

Each entry should support:

- Edit
- Rename
- Delete

Deleting an entry must require confirmation.

Example:

`Delete this diary entry?`

Buttons:

`Cancel`

`Delete`

Do not delete an entry accidentally with one click.

Unused local media should be safely cleaned up where appropriate.

---

# 36. SETTINGS

Create a clean settings panel.

Include:

- Change password
- Autosave settings
- Page-turn animation enable/disable
- Page-turn animation speed
- Diary theme
- Backup/export
- Restore/import
- About

Password change must require successful authentication.

---

# 37. BACKUP / RESTORE

Provide:

`Export Backup`

and

`Import Backup`

The backup should contain:

- diary database
- settings
- metadata
- images
- videos
- other required local diary information

Use a self-contained backup format where practical.

Validate imported backup files.

Do not overwrite the current diary silently.

Ask for confirmation before destructive restore operations.

Version the backup format so future migrations are possible.

---

# 38. COMMAND BAR — TEXT ONLY

IMPORTANT:

**DO NOT IMPLEMENT VOICE COMMANDS.**

No microphone.

No speech recognition.

No voice assistant.

No online AI.

Instead create an optional small **text command bar/controller** for future extensibility.

Supported commands:

- `next page`
- `previous page`
- `open page 5`
- `open index`
- `new entry`
- `search [text]`

Architect this as a standalone `CommandController`.

The command system should call existing application actions rather than directly manipulating the Three.js scene.

This keeps the architecture clean and allows future extensions without rewriting the core.

---

# 39. NO VOICE DEPENDENCY

The first version must NOT include:

- microphone permission
- speech-to-text
- online assistant
- local voice recognition
- voice recording

The application should remain a mouse + keyboard desktop diary.

---

# 40. WINDOW UI

The application should look like a premium desktop application.

Preferred appearance:

- dark neutral surrounding space
- centered diary
- elegant minimal controls
- small page arrows
- minimal top-level UI
- no generic admin dashboard appearance

Possible custom/minimal title bar if stable.

The UI should adapt to window resizing.

Test at:

- 1280×720
- 1366×768
- 1920×1080

and larger displays.

---

# 41. PERFORMANCE

Target smooth interaction.

Aim for approximately 60 FPS on a reasonable consumer Windows laptop during normal interaction.

Optimize:

- Three.js geometry
- textures
- render resolution
- React rendering
- media loading
- video handling
- animations

Dispose unused:

- geometries
- materials
- textures
- media resources

Do not decode every diary video simultaneously.

Do not load very large images at unnecessary resolutions.

---

# 42. ERROR HANDLING

Handle:

- wrong password
- password setup validation
- failed database operation
- corrupted data
- missing media
- invalid backup
- unsupported image
- unsupported video
- failed media loading
- disk full
- permission failure
- failed save

Never let one missing image/video crash the application.

Show clear human-readable messages.

---

# 43. EMPTY STATE

If there are no diary entries:

Show a beautiful empty state.

Example:

`Your story begins here.`

`+ Create your first entry`

Avoid blank screens.

---

# 44. VISUAL DESIGN PRINCIPLES

The overall feeling should be:

- premium
- private
- magical
- calm
- elegant
- warm
- sophisticated
- slightly mysterious
- realistic

Avoid:

- neon colors
- cartoon graphics
- generic dashboard cards
- excessive glassmorphism
- excessive gradients
- overly bright UI
- unnecessary animations
- clutter

The visual reference image should strongly influence the diary's physical design.

---

# 45. REALISM PRIORITIES

Prioritize realism in this order:

1. Book proportions
2. Cover material
3. Page thickness
4. Page curvature
5. Lighting and shadows
6. Spine construction
7. Page-turn behavior
8. Typography
9. Small decorative details

Do not sacrifice performance just to add tiny visual details.

---

# 46. THREE.JS + REACT RESPONSIBILITIES

This separation is critical.

## Three.js handles:

- diary model
- covers
- pages
- spine
- physical page turns
- 3D lighting
- shadows
- camera
- scene transitions

## React/HTML handles:

- login form
- password setup
- text editor
- toolbar
- search
- settings
- dialogs
- media picker UI
- forms
- command bar

Do NOT build a full text editor directly inside Three.js.

The editing experience must remain high quality.

---

# 47. PAGE RENDERING STRATEGY

When reading:

Show diary content in the page presentation.

When editing:

Use an HTML-based rich text editor in a focused editing layer associated with the selected page.

Synchronize the editor with the stored page content.

Do not compromise text editing quality simply to keep everything inside WebGL.

---

# 48. PAGE FOCUS TRANSITION

Normal mode:

Two-page physical book.

Click page.

Then:

- selected page moves/zooms closer
- other page becomes secondary
- editing area becomes easier to use

Return to spread mode with a clear action.

Keep the transition visually smooth.

---

# 49. PROJECT STRUCTURE

Use a modular folder structure similar to:

src/
    main/
        main.ts
        ipc/
        database/
        security/
        storage/
        backup/

    preload/
        preload.ts

    renderer/
        components/
            Diary3D/
            DiaryPages/
            PageControls/
            Login/
            PasswordSetup/
            RichTextEditor/
            Media/
            Search/
            Settings/
            Index/
            Welcome/
            CommandBar/

        hooks/
        services/
        store/
        types/
        utils/
        styles/

    shared/
        types/
        constants/

Adjust the structure when necessary, but maintain modular responsibilities.

Do not create one huge file.

---

# 50. STATE MANAGEMENT

Keep these states conceptually separate:

- authentication
- diary data
- current spread
- current page
- selected/focused page
- editor state
- media state
- application settings
- UI modal state
- save state

Do not unnecessarily mix Three.js internal state with React state.

Create clear interfaces between systems.

---

# 51. DEVELOPMENT PHASES

Do not try to create the entire application blindly in one pass.

Work through the following phases.

---

## PHASE 1 — ARCHITECTURE AND PLANNING

Before writing the major implementation:

1. Inspect the workspace.
2. Inspect the reference image.
3. Understand the visual direction.
4. Produce:
   - technical architecture
   - folder structure
   - database schema
   - data flow
   - Electron security architecture
   - Three.js scene architecture
   - page-turn implementation strategy
   - local media architecture
   - backup architecture
5. Identify technical risks.

Do not start implementing everything immediately.

---

## PHASE 2 — DESKTOP FOUNDATION

Implement:

- Electron
- React
- TypeScript
- Vite
- secure preload
- IPC
- local database
- application shell
- basic routing/state structure

First confirm:

- project starts
- Electron window opens
- renderer loads
- secure IPC works
- database can be initialized

---

## PHASE 3 — 3D DIARY

Implement the centerpiece first.

Build:

- closed diary
- front cover
- back cover
- spine
- page block
- paper
- cover materials
- gold ornament
- lighting
- camera
- subtle environment
- opening animation
- open-book state

Use the provided reference image as visual guidance.

This phase should be visually inspected before moving forward.

---

## PHASE 4 — AUTHENTICATION

Implement:

- first-launch password creation
- secure password hashing
- authentication
- incorrect-password handling
- protected diary state
- unlock/opening flow

Test:

- first run
- wrong password
- correct password
- restart

---

## PHASE 5 — PAGE ENGINE

Implement:

- page data model
- two-page spread
- welcome page
- dynamic index
- page numbers
- page navigation controls
- forward page turn
- backward page turn
- page state persistence

Test page transitions repeatedly.

---

## PHASE 6 — EDITOR

Implement:

- new entry
- title
- date
- body
- rich text editor
- formatting toolbar
- headings
- colors
- typography
- alignment
- lists
- underline
- etc.
- autosave
- focused page editing

---

## PHASE 7 — MEDIA

Implement:

- image import
- video import
- local file picker
- image preview
- video preview
- resize
- move
- optional crop
- optional rotation
- delete
- database metadata
- persistent local storage

Test:

- small images
- large images
- common video formats
- multiple media objects
- restart persistence

---

## PHASE 8 — SEARCH / SETTINGS / BACKUP

Implement:

- local search
- entry management
- password change
- animation settings
- theme framework
- backup
- restore
- validation
- error states

---

## PHASE 9 — TEXT COMMAND CONTROLLER

Implement text commands only.

No voice.

Commands:

- next page
- previous page
- open page
- open index
- new entry
- search

Keep this system independent.

---

## PHASE 10 — POLISH

Polish:

- lighting
- page curvature
- material realism
- page shadows
- typography
- UI icons
- spacing
- animations
- hover/focus states
- dialogs
- empty states
- loading states
- error messages

Do not redesign working architecture without a reason.

---

## PHASE 11 — TESTING

Test every major feature.

At minimum:

1. First launch.
2. Password creation.
3. Login.
4. Wrong password.
5. Restart.
6. Closed diary.
7. Opening animation.
8. Welcome page.
9. Index.
10. Previous page.
11. Next page.
12. Page-turn animation.
13. Page focus.
14. New entry.
15. Editing.
16. Rich text formatting.
17. Autosave.
18. Image import.
19. Image resizing.
20. Image positioning.
21. Video import.
22. Video playback.
23. Search.
24. Delete confirmation.
25. Settings.
26. Backup.
27. Restore.
28. Missing media.
29. Window resize.
30. Offline operation.
31. Packaged `.exe`.

Fix bugs before moving to the next phase where possible.

---

## PHASE 12 — PRODUCTION BUILD

Generate:

- Windows installer
- portable build if practical

The user should not need:

- Node.js
- npm
- Python
- development dependencies

The packaged application must contain everything needed at runtime.

Test the actual packaged application rather than only developer mode.

---

# 52. TEST OFFLINE OPERATION

Before declaring completion:

1. Build the application.
2. Disable internet access.
3. Launch it.
4. Set/login with password.
5. Open diary.
6. Turn pages.
7. Create an entry.
8. Edit text.
9. Add an image.
10. Add a video.
11. Save.
12. Restart.
13. Search.
14. Navigate.
15. Backup.
16. Restore.

Everything must continue to work without internet.

---

# 53. DOCUMENTATION

Create:

`README.md`

Include:

- project overview
- prerequisites
- setup
- development commands
- build commands
- architecture overview
- storage behavior
- backup behavior
- known limitations

Create:

`ARCHITECTURE.md`

Explain:

- Electron process model
- preload
- IPC
- React structure
- Three.js structure
- database
- media storage
- password/security
- backup/restore
- page engine
- editor integration

---

# 54. CODING QUALITY

Act like a senior desktop application engineer, Three.js developer and UI/UX designer.

Requirements:

- modular code
- strong typing
- readable architecture
- sensible naming
- reusable components
- error handling
- no giant monolithic components
- avoid unnecessary duplication

Do not leave fake placeholder buttons.

Do not leave major features as TODOs.

When a feature is implemented:

1. Run it.
2. Test it.
3. Inspect it.
4. Fix errors.
5. Continue.

Do not declare success simply because the project compiles.

---

# 55. IMPORTANT RULES

## Rule 1

The application must be offline-first.

## Rule 2

The diary must genuinely use Three.js.

## Rule 3

The diary must look like a physical magical/antique journal.

## Rule 4

Use the provided reference image as visual direction.

## Rule 5

The inside pages should be primarily plain warm off-white/ivory.

## Rule 6

Do not use exact copyrighted Hogwarts/Harry Potter artwork or logos.

## Rule 7

Do not use voice commands.

## Rule 8

Do not add microphone/speech recognition.

## Rule 9

Do not store plaintext passwords.

## Rule 10

Do not use cloud storage.

## Rule 11

Do not depend on internet assets at runtime.

## Rule 12

Images and videos must persist after application restart.

## Rule 13

Page navigation should use realistic page-turn animation.

## Rule 14

Rich text editing should use HTML/React rather than trying to recreate a complete word processor in WebGL.

## Rule 15

Do not sacrifice usability for visual effects.

## Rule 16

Do not break existing functionality when introducing new features.

## Rule 17

Do not stop at a mockup.

## Rule 18

Final output must be buildable as a Windows executable.

---

# 56. ACCEPTANCE CRITERIA

The project is complete only when the following sequence works:

1. Install the application.
2. Launch without internet.
3. See the realistic closed 3D diary.
4. Click the diary.
5. On first run, create a password.
6. Close the app.
7. Reopen the app.
8. Click the diary.
9. Enter password.
10. Diary unlocks.
11. Cover physically opens.
12. Two pages are visible.
13. Welcome note appears on the left.
14. Dynamic index appears on the right.
15. Click next-page control.
16. Realistic page-turn animation plays.
17. Click previous-page control.
18. Reverse page-turn animation plays.
19. Click a page.
20. Page enlarges/focuses.
21. Create a new entry.
22. Type text.
23. Add headings.
24. Change font.
25. Change size.
26. Change text color.
27. Bold text.
28. Italic text.
29. Underline text.
30. Strikethrough text.
31. Align text.
32. Create lists.
33. Add an image.
34. Resize image.
35. Move image.
36. Add a video.
37. Resize video.
38. Play video.
39. Autosave.
40. Restart the app.
41. Confirm content and media remain.
42. Search for an entry.
43. Open entry from search.
44. Back up diary.
45. Restore backup.
46. Verify restored content.
47. Disable internet.
48. Verify normal diary operation still works.
49. Build packaged Windows `.exe`.
50. Test the packaged build.

---

# 57. FINAL PRODUCT VISION

The final application should feel like:

A private magical antique diary sitting on the user's desktop.

The experience should be:

Open app
    ↓
See beautiful closed 3D journal
    ↓
Click journal
    ↓
Password
    ↓
Journal physically opens
    ↓
Two pages visible
    ↓
Welcome + Index
    ↓
Turn pages naturally
    ↓
Focus a page
    ↓
Write and format content
    ↓
Insert photos/videos
    ↓
Autosave locally
    ↓
Close app
    ↓
Everything remains exactly where it was

The visual centerpiece should feel premium, realistic and immersive.

The editing experience should remain simple and practical.

The application should feel like a real digital physical diary rather than a normal CRUD/dashboard application.

---

# FIRST TASK FOR ANTIGRAVITY

Before implementing the full application:

1. Inspect the entire workspace.
2. Locate and inspect the provided diary reference image.
3. Summarize the visual characteristics you will reproduce.
4. Propose the full architecture.
5. Propose the database schema.
6. Propose the Three.js page-turn implementation.
7. Propose the Electron security model.
8. Propose the local media-storage architecture.
9. Propose the implementation phases.
10. Identify any technical risks.

Then begin Phase 2.

Do not skip planning.

Do not implement voice commands.
