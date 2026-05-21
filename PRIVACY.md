# Privacy and Disclaimer

AO3 Last Read is designed to run in browsers controlled by the user.

## Data Handling

- `ao3-last-read.user.js` runs locally in the user's browser through Tampermonkey.
- The script stores reading progress in the browser's `localStorage`.
- The script stores one-time resume approval state in `sessionStorage` to avoid a duplicate prompt after redirect.
- Saved progress may include AO3 work IDs, chapter mode, scroll offset, progress percentage, chapter number, chapter title, and whether the work is chaptered.
- The project does not send saved progress or AO3 reading history to any server controlled by the author.
- The script does not contact external services.

## User Responsibility

Users should review the source code before installing it. Users are responsible for the browser, Tampermonkey setup, AO3 account state, browser sync settings, and any modifications they make.

## Disclaimer

This project is provided as-is, without warranty of any kind. The author is not responsible for lost data, incorrect saved progress, changed AO3 behavior, browser storage issues, account issues, security problems caused by user modifications, or any other damages arising from use of this project.

This project is unofficial and is not affiliated with Archive of Our Own, the Organization for Transformative Works, or Tampermonkey.
