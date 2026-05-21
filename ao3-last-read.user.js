// ==UserScript==
// @name         AO3 Last Read
// @namespace    https://github.com/phairiceismyotp/AO3_Last_Read
// @version      1.0.0
// @description  Save and resume AO3 reading progress across works and chapters.
// @author       phairiceismyotp (or3zz - Nguyen Tin)
// @license      AGPL-3.0-only
// @match        https://archiveofourown.org/*
// @icon         https://archiveofourown.org/favicon.ico
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_PREFIX = "ao3-last-read";
  const SAVE_THROTTLE_MS = 1000;
  const RESTORE_DELAY_MS = 250;
  const RESTORE_LOCK_MS = 1000;
  const READING_MARKER_RATIO = 0.35;
  const UNFINISHED_PROGRESS_LIMIT = 0.95;

  const workPage = parseWorkPage();
  registerClearMenu();

  if (workPage) {
    runReader(workPage);
  } else {
    renderProgressBadges();
  }

  function parseWorkPage() {
    const match = location.pathname.match(/^\/works\/(\d+)(?:\/chapters\/(\d+))?\/?$/);
    if (!match) return null;

    const workId = match[1];
    const chapterId = match[2] || null;
    const isFullWork = new URLSearchParams(location.search).get("view_full_work") === "true";
    const mode = isFullWork ? "full" : chapterId ? `chapter:${chapterId}` : "single";

    return {
      workId,
      chapterId,
      mode,
      workKey: workStorageKey(workId, mode),
      summaryKey: summaryStorageKey(workId)
    };
  }

  function runReader(page) {
    let saveTimer = 0;
    let restoreLocked = true;
    let userScrolled = false;

    const redirectState = redirectToSavedEntry(page);
    if (redirectState === "redirected") return;

    restorePosition(page, redirectState === "declined");
    window.addEventListener("scroll", scheduleSave, { passive: true });
    window.addEventListener("beforeunload", saveBeforeUnload);

    function scheduleSave() {
      if (restoreLocked || saveTimer) return;

      userScrolled = true;
      saveTimer = window.setTimeout(() => {
        saveTimer = 0;
        savePosition(page);
      }, SAVE_THROTTLE_MS);
    }

    function saveBeforeUnload() {
      if (userScrolled) savePosition(page);
    }

    function restorePosition(page, skipPrompt) {
      const saved = readSaved(page.workKey);
      if (!saved || skipPrompt || !confirmResume(page)) {
        restoreLocked = false;
        return;
      }

      window.setTimeout(() => {
        window.scrollTo(0, restoredScrollTop(page, saved));
        window.setTimeout(() => {
          restoreLocked = false;
        }, RESTORE_LOCK_MS);
      }, RESTORE_DELAY_MS);
    }
  }

  function redirectToSavedEntry(page) {
    const saved = readSaved(page.summaryKey);
    const target = savedEntryUrl(page, saved);
    if (!target) return "none";

    if (!confirmResume(page, true, redirectPrompt(page, saved))) return "declined";

    location.replace(target);
    return "redirected";
  }

  function savedEntryUrl(page, saved) {
    if (!saved || !canRedirectToSavedEntry(page, saved)) return null;

    if (saved.mode === "full" && page.mode !== "full") {
      return `${location.origin}/works/${page.workId}?view_full_work=true`;
    }

    const chapterId = saved.mode.match(/^chapter:(\d+)$/)?.[1];
    if (!chapterId || chapterId === page.chapterId) return null;

    return `${location.origin}/works/${page.workId}/chapters/${chapterId}`;
  }

  function canRedirectToSavedEntry(page, saved) {
    return page.mode === "single" ||
      Boolean(page.chapterId && page.mode !== saved.mode && clamp01(saved.progress) < UNFINISHED_PROGRESS_LIMIT);
  }

  function redirectPrompt(page, saved) {
    if (page.mode === "single") return "Resume your last read position?";

    const percent = Math.round(clamp01(saved.progress) * 100);
    return `Last read: ${savedChapterLabel(saved)} - ${percent}%.\nResume from there?`;
  }

  function confirmResume(page, remember = false, message = "Resume your last read position?") {
    const key = `${STORAGE_PREFIX}:resume-approved:${page.workId}`;

    if (sessionStorage.getItem(key) === "yes") {
      sessionStorage.removeItem(key);
      return true;
    }

    const accepted = window.confirm(message);
    if (accepted && remember) sessionStorage.setItem(key, "yes");
    return accepted;
  }

  function savePosition(page) {
    const target = currentReadTarget(page);
    if (!target) return;

    const data = {
      mode: page.mode,
      offset: textOffset(target.text),
      progress: textProgress(target.text),
      chapterIndex: target.chapterIndex,
      chapterNumber: target.chapterNumber,
      chapterTitle: target.chapterTitle,
      isChaptered: target.isChaptered
    };

    localStorage.setItem(page.workKey, JSON.stringify(data));
    localStorage.setItem(page.summaryKey, JSON.stringify(data));
  }

  function currentReadTarget(page, saved = null) {
    const chapters = chapterNodes();
    const chapter = saved?.mode === "full" ? savedChapter(chapters, saved) : activeChapter(chapters);
    const text = storyText(chapter);
    if (!text) return null;

    const chapterIndex = chapters.indexOf(chapter);

    return {
      text,
      chapterIndex,
      chapterNumber: chapters.length > 1 ? chapterIndex + 1 : selectedChapterNumber(),
      chapterTitle: selectedChapterTitle(chapter),
      isChaptered: Boolean(page.mode !== "single" || chapters.length > 1 || chapterSelect()?.options.length > 1)
    };
  }

  function chapterNodes() {
    const chapters = Array.from(document.querySelectorAll("#chapters > .chapter")).filter((chapter) =>
      chapter.querySelector(".userstuff")
    );
    if (chapters.length) return chapters;

    const text = document.querySelector("#chapters.userstuff, #chapters .userstuff");
    return text ? [text] : [];
  }

  function savedChapter(chapters, saved) {
    const index = Number(saved.chapterIndex);
    return Number.isInteger(index) ? chapters[index] || null : null;
  }

  function activeChapter(chapters) {
    if (!chapters.length) return null;

    const marker = readingMarkerTop();
    let active = chapters[0];

    for (const chapter of chapters) {
      const { top, height } = pageBounds(chapter);
      if (marker >= top) active = chapter;
      if (marker <= top + height) break;
    }

    return active;
  }

  function storyText(chapter) {
    if (!chapter) return null;
    if (chapter.matches(".userstuff")) return chapter;

    return chapter.querySelector(":scope > .userstuff[role='article']") ||
      chapter.querySelector(":scope > .userstuff.module") ||
      chapter.querySelector(".userstuff[role='article']") ||
      chapter.querySelector(":scope > .userstuff");
  }

  function textOffset(text) {
    return clamp(readingMarkerTop() - pageBounds(text).top, 0, textHeight(text));
  }

  function textProgress(text) {
    return textOffset(text) / textHeight(text);
  }

  function restoredScrollTop(page, saved) {
    const target = currentReadTarget(page, saved);
    if (!target) return 0;

    return pageBounds(target.text).top +
      clamp(saved.offset, 0, textHeight(target.text)) -
      window.innerHeight * READING_MARKER_RATIO;
  }

  function textHeight(text) {
    return pageBounds(text).height;
  }

  function readingMarkerTop() {
    return window.scrollY + window.innerHeight * READING_MARKER_RATIO;
  }

  function pageBounds(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: window.scrollY + rect.top,
      height: Math.max(1, rect.height)
    };
  }

  function selectedChapterNumber() {
    const text = chapterSelect()?.selectedOptions[0]?.textContent || "";
    return Number(text.match(/\bchapter\s+(\d+)/i)?.[1] || text.match(/^\s*(\d+)\s*[.:]/)?.[1]) || null;
  }

  function selectedChapterTitle(chapter) {
    const selected = chapterSelect()?.selectedOptions[0]?.textContent || "";
    const heading = chapter?.querySelector(".title, h2, h3, h4")?.textContent || "";
    return cleanChapterTitle(selected) || cleanChapterTitle(heading);
  }

  function cleanChapterTitle(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/^\s*chapter\s+\d+\s*[:.\-\u2013\u2014]?\s*/i, "")
      .replace(/^\s*\d+\s*[:.\-\u2013\u2014]\s*/, "")
      .trim();
  }

  function chapterSelect() {
    return document.querySelector("#selected_id, select[name='selected_id']");
  }

  function renderProgressBadges() {
    addBadgeStyle();

    for (const card of document.querySelectorAll("li.work, li.bookmark, li.reading")) {
      const workId = workIdFromCard(card);
      const saved = workId ? readSaved(summaryStorageKey(workId)) : null;
      const date = card.querySelector(".datetime");
      if (!saved || !date || card.querySelector(".ao3-last-read-badge")) continue;

      const badge = document.createElement("span");
      badge.className = "ao3-last-read-badge";
      badge.textContent = badgeText(card, saved);
      badge.title = "Last read";

      date.append(" ", badge);
    }
  }

  function badgeText(card, saved) {
    const percent = Math.round(clamp01(saved.progress) * 100);
    return cardIsChaptered(card, saved)
      ? `Last read: ${savedChapterLabel(saved)} - ${percent}%`
      : `Last read: ${percent}%`;
  }

  function savedChapterLabel(saved) {
    return saved.chapterNumber ? `Chapter ${saved.chapterNumber}` : saved.chapterTitle;
  }

  function cardIsChaptered(card, saved) {
    const chapters = card.querySelector("dd.chapters")?.textContent.trim();
    return chapters ? chapters !== "1/1" : Boolean(saved.isChaptered);
  }

  function addBadgeStyle() {
    if (document.getElementById("ao3-last-read-style")) return;

    const style = document.createElement("style");
    style.id = "ao3-last-read-style";
    style.textContent = `
      .ao3-last-read-badge {
        display: inline-block;
        margin-left: .45em;
        padding: .05em .4em;
        border: 1px solid currentColor;
        border-radius: 0;
        background: transparent;
        color: inherit;
        font-size: .85em;
        line-height: 1.35;
        white-space: nowrap;
        vertical-align: baseline;
      }
    `;

    document.head.appendChild(style);
  }

  function registerClearMenu() {
    if (typeof GM_registerMenuCommand !== "function") return;

    GM_registerMenuCommand("AO3 Last Read: Clear all saved data", () => {
      if (!window.confirm("Clear all AO3 Last Read saved data?")) return;
      clearAllData();
      document.querySelectorAll(".ao3-last-read-badge").forEach((badge) => badge.remove());
      window.alert("All AO3 Last Read data was cleared.");
    });
  }

  function clearAllData() {
    removeSavedKeys(localStorage);
    removeSavedKeys(sessionStorage);
  }

  function removeSavedKeys(storage) {
    Object.keys(storage)
      .filter((key) => key.startsWith(`${STORAGE_PREFIX}:`))
      .forEach((key) => storage.removeItem(key));
  }

  function readSaved(key) {
    const saved = readJson(key);
    return saved &&
      typeof saved.mode === "string" &&
      Number.isFinite(saved.offset) &&
      Number.isFinite(saved.progress)
      ? saved
      : null;
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function workStorageKey(workId, mode) {
    return `${STORAGE_PREFIX}:work:${workId}:${mode}`;
  }

  function summaryStorageKey(workId) {
    return `${STORAGE_PREFIX}:summary:${workId}`;
  }

  function workIdFromCard(card) {
    return card.id.match(/^work_(\d+)$/)?.[1] ||
      card.querySelector('a[href*="/works/"]')?.href.match(/\/works\/(\d+)/)?.[1] ||
      null;
  }

  function clamp01(value) {
    return clamp(value, 0, 1);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }
})();
