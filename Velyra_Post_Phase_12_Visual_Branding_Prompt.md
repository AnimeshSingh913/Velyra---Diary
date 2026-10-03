# Velyra — Post-Phase-12 Visual Redesign, Cinematic Background & Branding Specification

## Purpose

This is the **final visual-polish and branding phase** for the Velyra desktop diary application.

All previously defined development phases (Phases 1–12) are assumed to be complete before this specification is executed.

**IMPORTANT:** Do NOT rebuild the application from scratch. Treat the existing application as a working product. Upgrade its visual quality and branding while preserving all existing functionality.

---

## 1. Provided Assets

I will place these files in the same project folder:

- `diary_background.png` — cinematic antique magical study/library background
- `diary_icon.png` — Velyra application icon reference
- `diary_reference.png` — original 3D diary visual reference, if present

Before changing anything:

1. Inspect all supplied images.
2. Inspect the complete current project.
3. Run the current application and establish a baseline.
4. Inspect the existing Three.js diary geometry, materials, lighting, camera, animation and page systems.
5. Inspect the Electron build/package configuration.
6. Do not replace working architecture unnecessarily.

---

# 2. Final Product Goal

The final application must be branded:

# Velyra

The visual identity should communicate:

- premium antique diary
- private personal journal
- mysterious fantasy atmosphere
- realistic burgundy/dark-brown leather
- ornate gold/brass details
- aged parchment pages
- warm candlelight
- cool blue environmental light
- cinematic depth
- smooth physical book animation
- modern but restrained desktop UI

The diary must be the main visual focus.

---

# 3. CRITICAL: PRESERVE EXISTING FUNCTIONALITY

Do NOT remove, disable or regress any functionality already implemented in Phases 1–12.

Preserve:

- password setup
- password authentication
- secure password storage/hashing
- diary opening interaction
- two-page spread
- welcome page
- dynamic index
- page navigation
- page focus/enlargement
- rich-text editor
- headings
- font family
- font size
- bold/italic/underline/strikethrough
- text colors
- alignment
- lists
- indentation
- undo/redo
- image import
- video import
- media resizing/repositioning
- autosave
- restart restoration
- local search
- settings
- password change
- themes
- animation settings
- backup/restore
- local database
- offline operation
- existing text-command functionality, if implemented
- Electron IPC security
- preload bridge
- context isolation
- nodeIntegration configuration
- keyboard shortcuts
- window behavior
- error handling

Do not unnecessarily modify the database schema.

Do not replace Electron, React, TypeScript, Three.js or the existing architecture.

Do not introduce cloud services, runtime CDNs, telemetry, online AI, voice commands, microphone functionality or speech recognition.

---

# 4. 3D DIARY — MAJOR VISUAL UPGRADE

The existing diary should be upgraded from a basic rectangular book into a **premium realistic antique leather-bound diary**.

This must be more than a color/texture change.

Improve:

- geometry
- proportions
- bevels
- depth
- materials
- lighting
- shadows
- page construction
- ornamentation
- camera presentation

---

## 4.1 Cover Geometry

Improve the existing cover geometry with:

- slightly rounded/beveled edges
- believable thickness
- layered construction
- subtle curvature
- rounded corners
- realistic spine thickness
- raised/depressed decorative areas

Avoid a perfectly flat rectangular slab.

The diary should look physically manufactured.

---

## 4.2 Leather Material

Use a deep:

- burgundy
- dark wine
- brown-burgundy

leather appearance.

It must NOT look like flat red plastic.

Add subtle:

- leather grain
- roughness variation
- surface imperfections
- soft highlights
- realistic physically-based response

All assets/materials must work offline.

---

## 4.3 Gold / Brass Ornamentation

Significantly improve the existing gold decoration.

It should look:

- metallic
- slightly raised
- embossed
- physically integrated with the cover
- warm gold/brass

Improve:

- outer border
- corners
- central emblem
- spine decorations
- clasp

Do not use flat yellow textures.

---

## 4.4 Central Emblem

Keep the magical/fantasy character but make the emblem more refined.

It should be:

- original
- elegant
- mysterious
- symmetrical where appropriate
- embossed/raised
- metallic or metallic-and-embossed

Do NOT use Harry Potter/Hogwarts logos, movie props, copyrighted artwork or recognizable copyrighted symbols.

Use an original antique-fantasy aesthetic.

---

## 4.5 Spine

Improve the spine with:

- raised leather bands
- decorative details
- subtle leather folds/creases
- layered geometry
- metallic accents where appropriate

---

## 4.6 Clasp

Improve the clasp with:

- physical thickness
- brass/gold material
- realistic highlights
- believable attachment
- proper depth

Do not break existing opening behavior just to improve the clasp.

---

# 5. PAGE BLOCK

The page block must no longer look like one solid cream rectangle.

Create the appearance of:

- many individual sheets
- subtle page thickness
- layered edges
- slightly irregular page edges
- aged/off-white parchment
- subtle tonal variation
- believable curvature near the spine

Interior pages should remain primarily **plain/off-white**.

Do not overdecorate user writing pages.

---

# 6. PAGE CURVATURE AND PAGE TURNING

Pages should have subtle physical curvature.

When the diary is open:

- center binding should have believable depth
- pages should curve gently
- page edges should follow the book shape

Preserve the existing page-turning system.

Refine it if necessary rather than replacing it unnecessarily.

Page turns should be:

- smooth
- physical
- responsive
- believable

Respect the existing animation-speed setting.

---

# 7. CINEMATIC BACKGROUND

Use:

`diary_background.png`

as the visual reference/background for the main diary scene.

The environment should feel like:

- antique study
- old magical library
- candlelit room
- wooden desk
- old books
- maps
- brass instruments
- warm candles
- cool blue stained-glass illumination

The diary should sit naturally on the central desk area.

Do not make the diary float or visibly intersect with the desk.

---

# 8. BACKGROUND BLUR WHEN THE BOOK OPENS

This is a required feature.

### Closed state

When the application starts:

- show the closed diary
- show the cinematic environment
- background can remain reasonably visible

### Opening state

When the user clicks the diary:

1. Camera smoothly moves toward the diary.
2. Diary begins physically opening.
3. Background gradually becomes softer.
4. Diary becomes the sharp focal point.
5. Warm lighting becomes more noticeable.
6. Open pages remain sharp and readable.

The transition should resemble:

**camera focuses on diary → diary sharp → background defocus**

Do NOT instantly blur the entire screen.

If true Three.js depth-of-field is appropriate and performant, use it.

If it is too expensive or unstable, use a lightweight local alternative.

Do not sacrifice usability/performance for the effect.

---

# 9. OPENING CAMERA ANIMATION

The opening sequence should feel cinematic and premium.

During opening:

- camera moves smoothly
- diary opens physically
- background gradually blurs
- diary remains the focal point
- two-page spread becomes dominant

Avoid:

- camera snapping
- sudden jumps
- excessive zoom
- motion sickness
- unnecessarily long transitions

---

# 10. LIGHTING

Improve the Three.js lighting.

Use a combination of:

### Warm light
From candles/lanterns/desk lighting.

### Cool light
From the window/stained-glass/environment.

The result should create warm-vs-cool cinematic contrast.

Leather should receive subtle warm highlights.

Gold/brass should catch realistic highlights.

Pages must remain readable.

---

# 11. SHADOWS

Improve shadows for:

- diary → desk
- cover → pages
- pages → pages
- clasp → cover

Use soft, believable shadows.

Avoid extremely hard black shadows.

Keep performance reasonable.

---

# 12. CAMERA

Review the current camera.

It should provide:

- natural perspective
- believable diary scale
- attractive closed-book framing
- attractive open-book framing
- readable pages
- smooth transitions
- no clipping

Avoid extreme FOV.

---

# 13. MATERIAL QUALITY

Review all major materials:

- leather
- gold/brass
- parchment
- page edges
- ribbon/bookmark
- clasp
- desk interaction

Materials should respond differently to light.

Use physically-based materials where appropriate.

---

# 14. RIBBON / BOOKMARK

If the existing diary has a ribbon/bookmark, refine it.

It should have:

- believable thickness
- dark burgundy/red color
- subtle fabric response
- natural placement

It should not look like a flat polygon.

---

# 15. INTERIOR PAGES

Keep the interior clean.

Pages should mainly be:

- off-white
- warm cream
- subtle parchment

The welcome page may remain special.

The index must remain readable.

User-created pages should prioritize writing.

---

# 16. UI INTEGRATION

Do not redesign the whole application unnecessarily.

Where appropriate, refine the existing UI with:

- dark antique palette
- restrained gold accents
- subtle borders
- readable typography
- consistent spacing
- elegant hover states

The application should remain modern and usable.

Do not make it look like a game.

---

# 17. BRANDING — VELYRA

The product name must become:

# Velyra

Use exact capitalization:

**Velyra**

Update the name where appropriate:

- Electron application metadata
- package/build metadata where appropriate
- window title
- startup/title screen
- settings/about page
- installer name
- Windows application metadata
- shortcut
- executable display name
- README/project branding
- icon metadata

Do NOT unnecessarily rename internal variables, database tables or technical identifiers.

---

# 18. WINDOWS APP ICON

Use:

`diary_icon.png`

as the reference for the application icon.

Create/use a proper Windows `.ico` asset with multiple resolutions where appropriate, such as:

- 16×16
- 24×24
- 32×32
- 48×48
- 64×64
- 128×128
- 256×256

Apply it correctly to:

- Electron BrowserWindow where required
- executable
- installer
- Windows shortcut
- package/build configuration

Do not merely copy the PNG into the project and consider the icon finished.

Build the application and verify that Windows actually displays the Velyra icon.

The icon must remain recognizable at small sizes.

If necessary, crop/remove photographic background details from the reference when generating the actual `.ico`.

---

# 19. OFFLINE REQUIREMENT

The application must remain fully offline.

Do NOT introduce:

- remote image URLs
- CDN textures
- runtime web fonts
- online APIs
- cloud storage
- telemetry
- analytics
- online AI
- runtime external shaders/assets

Everything required must be packaged locally.

---

# 20. PERFORMANCE

After visual changes, test:

- startup
- closed diary scene
- opening animation
- page navigation
- page turning
- rich-text editing
- media
- search
- settings
- backup/restore
- restart/recovery
- packaged Windows build

Watch for:

- GPU spikes
- memory leaks
- excessive draw calls
- huge textures
- expensive post-processing
- animation stutter
- long startup

Optimize the scene without noticeably reducing visual quality.

---

# 21. WINDOW TESTING

Test at:

- 1280×720
- 1366×768
- 1920×1080

The diary must remain correctly framed.

The background should crop/scale naturally.

The open diary must not be clipped.

Pages must remain readable.

---

# 22. VISUAL STATE REQUIREMENTS

### Startup
Closed diary in cinematic antique study.

### Authentication
Password prompt remains clear and unobtrusive.

### Opening
Camera moves + diary opens + background gradually blurs.

### Open diary
Two-page spread is sharp and readable.

### Page navigation
Smooth physical transitions.

### Closing/logout
Return gracefully to the closed state if existing functionality supports it.

---

# 23. IMPLEMENTATION ORDER

Follow this order:

### Step 1
Inspect the completed Phase 1–12 project.

### Step 2
Run the current application.

### Step 3
Inspect the existing Three.js diary.

### Step 4
Improve diary geometry and materials.

### Step 5
Implement/refine cinematic background.

### Step 6
Implement/refine background blur during opening.

### Step 7
Improve lighting, shadows and camera.

### Step 8
Integrate the Velyra application icon.

### Step 9
Rename product branding to Velyra.

### Step 10
Perform complete regression testing.

### Step 11
Build the Windows application.

### Step 12
Test the actual packaged application.

---

# 24. DO NOT REBUILD FROM SCRATCH

Never:

- delete the existing project
- create a replacement project
- replace the architecture unnecessarily
- remove working features
- replace the database unnecessarily
- replace authentication unnecessarily
- replace the editor unnecessarily
- rewrite the entire Three.js system if incremental improvement is possible

Use:

**Inspect → modify → test → verify → polish.**

---

# 25. CODE QUALITY

Maintain the existing architecture.

Use:

- reusable Three.js components/classes
- clean React components
- typed TypeScript
- proper separation of rendering and application state
- existing state management
- correct resource cleanup

Dispose of Three.js:

- geometries
- materials
- textures
- render targets
- post-processing resources

when appropriate.

Avoid memory leaks.

---

# 26. ERROR HANDLING

If `diary_background.png` is missing:

- do not crash
- gracefully use a local/default background

If `diary_icon.png` is missing:

- do not crash
- clearly report the missing asset

If icon conversion fails:

- fix the build pipeline

If depth-of-field fails:

- fall back to normal rendering

The application must remain usable.

---

# 27. FINAL VALIDATION CHECKLIST

## Branding

- [ ] Product name is Velyra
- [ ] Window title updated
- [ ] Application metadata updated
- [ ] Installer/build metadata updated
- [ ] README branding updated where appropriate
- [ ] Velyra icon applied

## 3D Diary

- [ ] Leather looks realistic
- [ ] Cover has depth
- [ ] Cover edges are beveled/rounded
- [ ] Spine is detailed
- [ ] Gold/brass is metallic
- [ ] Central emblem is improved
- [ ] Clasp has physical depth
- [ ] Pages look layered
- [ ] Page block is not a single flat rectangle
- [ ] Page curvature is believable
- [ ] Bookmark/ribbon is realistic if present

## Environment

- [ ] New background is used
- [ ] Diary sits naturally on desk
- [ ] Warm candlelight is present
- [ ] Cool environmental light is present
- [ ] Shadows are believable
- [ ] Background does not overpower diary

## Opening Effect

- [ ] Diary opens smoothly
- [ ] Camera moves smoothly
- [ ] Background gradually blurs
- [ ] Diary remains sharp
- [ ] Pages remain readable
- [ ] No sudden camera jumps
- [ ] No excessive delay

## Functionality

- [ ] Authentication works
- [ ] Diary opening works
- [ ] Welcome page works
- [ ] Index works
- [ ] Page navigation works
- [ ] Rich-text editing works
- [ ] Images work
- [ ] Videos work
- [ ] Autosave works
- [ ] Restart restoration works
- [ ] Search works
- [ ] Settings work
- [ ] Backup works
- [ ] Restore works
- [ ] Existing text-command functionality works if implemented
- [ ] Offline operation works

## Security

- [ ] contextIsolation remains enabled
- [ ] nodeIntegration remains disabled
- [ ] Existing preload security remains intact
- [ ] Password is not stored plaintext
- [ ] No external network dependency introduced

## Performance

- [ ] No obvious memory leak
- [ ] No major animation stutter
- [ ] Reasonable GPU usage
- [ ] Reasonable startup time
- [ ] Background blur is performant

## Windows Build

- [ ] Production build succeeds
- [ ] Windows executable launches
- [ ] Correct Velyra icon appears
- [ ] Window title is Velyra
- [ ] Application works without internet
- [ ] Assets are correctly packaged
- [ ] Database persistence works
- [ ] Media persistence works
- [ ] Backup/restore works

---

# 28. MANUAL END-TO-END TEST

Actually run the application and test:

1. Launch Velyra.
2. Verify the closed diary and cinematic background.
3. Click the diary.
4. Verify authentication.
5. Enter the diary.
6. Observe the opening animation.
7. Verify the background blur.
8. Verify the diary remains sharp.
9. Verify the welcome/index spread.
10. Turn pages.
11. Focus/open a page.
12. Create/edit text.
13. Import an image.
14. Import a video if supported.
15. Save.
16. Close the application.
17. Restart.
18. Verify data remains.
19. Test search.
20. Test settings.
21. Test backup/restore.
22. Test password functionality.
23. Test window resizing.
24. Test the packaged Windows build.

---

# 29. QUALITY STANDARD

Do not stop at:

> "The background was added."

The goal is:

> "The application now looks like a polished premium 3D digital diary."

Likewise, do not stop at simply changing the cover color.

The redesign must visibly improve:

- geometry
- materials
- lighting
- depth
- ornamentation
- page construction
- shadows
- animation
- environmental integration

The difference should be obvious compared with the current implementation.

---

# 30. DESIGN PRIORITY

The visual hierarchy should be:

**Diary > Writing/Content > Usability > Background decoration**

The background creates atmosphere.

The diary is the hero element.

The writing is the user's content.

Do not let decorative effects interfere with reading or writing.

---

# 31. FINAL INSTRUCTION TO ANTIGRAVITY

After reading this specification:

1. Inspect the complete existing Velyra project.
2. Inspect all supplied image assets.
3. Inspect the current Three.js implementation.
4. Run the application before making changes.
5. Create a short implementation plan for this post-Phase-12 redesign.
6. Do not automatically execute every planned change without review.
7. Work incrementally.
8. Test after every major subsystem.
9. Preserve all existing functionality.
10. Do not rebuild the project.
11. Do not introduce online dependencies.
12. Do not add voice functionality.
13. Do not add an online AI assistant.
14. Do not use copyrighted Hogwarts/Harry Potter artwork or logos.
15. Use original fantasy/antique visual design.
16. Optimize for Windows desktop.
17. Complete Velyra branding and icon integration.
18. Perform full regression testing.
19. Build and test the production Windows application.
20. At the end, report:
   - files changed
   - major visual changes
   - branding changes
   - icon implementation
   - performance considerations
   - tests performed
   - remaining issues
   - exact Windows build command

**Do not proceed to unrelated features after this phase.**

The final product should be a polished offline desktop application named:

# Velyra

with the identity of a beautiful, private, cinematic antique digital diary.
