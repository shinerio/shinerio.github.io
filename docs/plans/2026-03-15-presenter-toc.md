# Presenter TOC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hover-revealed right-side table of contents to presenter mode that reuses the normal article TOC and supports presenter-local scrolling plus active-section highlighting.

**Architecture:** Reuse the existing article-page TOC DOM rendered by `templates/article.html`. Presenter mode clones that TOC into a right-side drawer, adds hover open/close behavior, intercepts TOC link clicks to scroll `state.shellInner`, and updates `.active` state using the cloned presenter headings.

**Tech Stack:** TypeScript/Jest for generator tests, vanilla JavaScript for presenter behavior, CSS for presenter drawer layout and transitions

---

### Task 1: Add a stable TOC hook to the article template

**Files:**
- Modify: `templates/article.html`
- Test: `test/unit/ArticleToc.test.ts`

**Step 1: Write the failing test**

Add a test to `test/unit/ArticleToc.test.ts` that generates an article with headings and asserts the rendered article HTML contains a presenter-reusable TOC hook such as `data-presenter-toc-source`.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/unit/ArticleToc.test.ts`

Expected: FAIL because the rendered article template does not yet contain the new TOC source attribute.

**Step 3: Write minimal implementation**

Update `templates/article.html` so the existing TOC sidebar includes a stable attribute for presenter lookup without changing the visible article-page structure.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/unit/ArticleToc.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add test/unit/ArticleToc.test.ts templates/article.html
git commit -m "test: add stable article toc hook for presenter mode"
```

---

### Task 2: Add presenter TOC drawer styling

**Files:**
- Modify: `templates/assets/css/style-addition.css`

**Step 1: Write the failing test**

No practical CSS-only automated test exists in the current suite. Treat the failing condition as the missing DOM class hooks required by the next JavaScript test.

**Step 2: Run test to verify current behavior is missing**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: FAIL because the presenter TOC drawer hooks and behavior do not exist yet.

**Step 3: Write minimal implementation**

Add presenter-only styles for:
- `.article-presenter-toc-trigger`
- `.article-presenter-toc`
- `.article-presenter-toc.is-visible`
- TOC card sizing and scroll containment inside the drawer

Keep the drawer hidden by default and slide it in from the right on reveal.

**Step 4: Run test to verify it still fails for JavaScript behavior only**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: FAIL, but now only because presenter JavaScript has not created or controlled the drawer yet.

**Step 5: Commit**

```bash
git add templates/assets/css/style-addition.css
git commit -m "style: add presenter toc drawer shell styles"
```

---

### Task 3: Add a focused presenter TOC behavior test

**Files:**
- Create: `test/unit/PresenterToc.test.ts`
- Modify: `templates/assets/js/article-presenter.js`

**Step 1: Write the failing test**

Create `test/unit/PresenterToc.test.ts` with a minimal DOM stub that:
- loads `templates/assets/js/article-presenter.js`
- provides a source article and presenter toggle
- includes a TOC source element in one test and omits it in another
- asserts presenter mode creates TOC drawer + trigger only when a TOC source exists

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: FAIL because presenter mode does not currently build any TOC drawer.

**Step 3: Write minimal implementation**

In `templates/assets/js/article-presenter.js`:
- add state fields for TOC source, drawer, trigger, and tracked heading links
- clone the source TOC when building the presenter shell
- create the right-edge trigger and drawer only when a source TOC exists

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add test/unit/PresenterToc.test.ts templates/assets/js/article-presenter.js
git commit -m "feat: add presenter toc drawer scaffolding"
```

---

### Task 4: Implement presenter TOC reveal and link scrolling

**Files:**
- Modify: `templates/assets/js/article-presenter.js`
- Test: `test/unit/PresenterToc.test.ts`

**Step 1: Write the failing test**

Extend `test/unit/PresenterToc.test.ts` to verify:
- hovering or entering the trigger makes the drawer visible
- leaving the trigger and drawer hides it
- clicking a TOC link calls presenter scrolling logic instead of relying on default page navigation

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: FAIL because the drawer has no reveal state transitions and TOC links still behave like plain anchors.

**Step 3: Write minimal implementation**

Implement:
- trigger/drawer enter and leave handlers
- a small close delay to avoid flicker between trigger and drawer
- smooth `state.shellInner.scrollTo()` behavior for TOC link clicks

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add test/unit/PresenterToc.test.ts templates/assets/js/article-presenter.js
git commit -m "feat: add presenter toc hover reveal and scrolling"
```

---

### Task 5: Implement presenter active-section highlighting

**Files:**
- Modify: `templates/assets/js/article-presenter.js`
- Test: `test/unit/PresenterToc.test.ts`

**Step 1: Write the failing test**

Extend the presenter TOC test to verify that when presenter headings report different `getBoundingClientRect().top` values, the matching `.toc-link` receives `.active`.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: FAIL because presenter TOC items are not yet synchronized with presenter heading positions.

**Step 3: Write minimal implementation**

Add presenter-local TOC syncing that:
- maps cloned TOC links to presenter headings by ID
- recalculates the current heading during presenter scroll/resize
- updates `.active` on the presenter drawer links

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand test/unit/PresenterToc.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add test/unit/PresenterToc.test.ts templates/assets/js/article-presenter.js
git commit -m "feat: sync presenter toc active state"
```

---

### Task 6: Run focused verification and full regression checks

**Files:**
- Modify: `templates/article.html`
- Modify: `templates/assets/css/style-addition.css`
- Modify: `templates/assets/js/article-presenter.js`
- Modify: `test/unit/ArticleToc.test.ts`
- Create/Modify: `test/unit/PresenterToc.test.ts`

**Step 1: Run focused TOC tests**

Run: `npm test -- --runInBand test/unit/ArticleToc.test.ts test/unit/PresenterToc.test.ts`

Expected: PASS.

**Step 2: Run broader generator regression**

Run: `npm test -- --runInBand test/unit/SiteGenerator.test.ts`

Expected: PASS.

**Step 3: Run build**

Run: `npm run build`

Expected: PASS with no TypeScript errors.

**Step 4: Manual presenter verification**

Check an article page in the browser and verify:
- presenter opens normally
- TOC trigger is hidden until hovering the right edge
- TOC drawer opens and closes as expected
- TOC links scroll within presenter mode
- active link highlighting tracks presenter scroll

**Step 5: Commit**

```bash
git add templates/article.html templates/assets/css/style-addition.css templates/assets/js/article-presenter.js test/unit/ArticleToc.test.ts test/unit/PresenterToc.test.ts
git commit -m "feat: add hover toc drawer to presenter mode"
```
