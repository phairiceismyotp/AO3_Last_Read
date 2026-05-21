# AI Audit Guide

This guide helps users perform an independent review before installing the project.

## What To Audit

Review this file:

- `ao3-last-read.user.js`

Do not upload private AO3 pages, account data, browser profiles, saved storage exports, or personal sample files unless you have removed private information.

## Suggested AI Prompt

```text
Please audit this userscript as an objective security and privacy review before I install it:

Context:
This project is an AO3 reading progress userscript. The following behavior is expected for this project and should not be treated as suspicious by itself:
- The userscript runs on archiveofourown.org pages.
- The userscript stores reading progress in browser localStorage.
- The userscript stores one-time resume approval state in sessionStorage.
- The userscript injects small progress badges into AO3 work cards.
- The userscript uses window.confirm for resume and clear-data confirmation.
- The userscript uses GM_registerMenuCommand to add a clear-data menu item in Tampermonkey.
- The userscript may redirect within the same AO3 work after user confirmation.

Audit rules:
- Base conclusions on code evidence only. Cite the relevant function, API, storage key, metadata field, or line if line numbers are available.
- Do not infer hidden behavior unless the code contains a mechanism for it.
- Do not label expected behavior as malware unless the code sends data to unrelated third-party servers, hides network calls, steals credentials, obfuscates logic, injects remote scripts, modifies unrelated sites, or performs destructive actions.
- Treat localStorage/sessionStorage use as local browser storage unless the code also transmits that data.
- Treat same-origin AO3 navigation or redirect as navigation, not data exfiltration, unless the code sends saved data to another service.
- If no issue is found in an area, say so directly.

Review checklist:
1. Identify every external domain or service contacted. If none are contacted, state that explicitly.
2. Identify every browser, Web Storage, or Tampermonkey storage key used.
3. Review the userscript metadata, including @match, @grant, @run-at, @connect, and @require if present.
4. Check whether the code sends AO3 reading history, work IDs, chapter titles, progress data, cookies, credentials, or page content to any third-party server.
5. Check for eval, dynamic script loading, obfuscation, hidden network calls, destructive actions, credential access, cookie access, or unrelated-site modification.
6. Explain save, restore, redirect, progress badge, and clear-data behavior in plain language.
7. Confirm whether progress is calculated from story text rather than comments when possible.
8. Classify each finding as one of: expected behavior, user-environment note, privacy risk, security risk, unclear, or no issue found.
9. For each risk, include severity, evidence, and whether the risk is inherent to this kind of userscript or avoidable in this codebase.
10. Avoid speculative warnings that are not supported by the code. If a possible risk depends on browser sync, shared computers, user modifications, or future AO3 layout changes, label it as a user-environment note or maintenance note, not as malicious behavior.

Do not rewrite the code unless I ask. Focus on security, privacy, data flow, and objective risk classification.
```

## Expected Behavior To Verify

- `ao3-last-read.user.js` should not contact external domains or services.
- Saved reading progress should stay in the user's browser storage.
- Resume approval state should stay in session storage and should only prevent duplicate prompts during redirect.
- No AO3 account credentials, cookies, private notes, or page content should be sent anywhere.
- No `eval`, remote script injection, hidden trackers, or unrelated domains should appear.
- DOM edits should be limited to visible progress badges and normal scroll restoration.
- Redirects should stay within the same AO3 work and require user confirmation when returning to old progress from a direct chapter link.

## Important Limit

AI review is helpful, but it is not a security guarantee. Users should still read the code, verify the permissions, and understand the storage behavior before installing.
