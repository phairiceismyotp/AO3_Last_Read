# AO3 Last Read

AO3 Last Read is a Tampermonkey userscript that saves and resumes reading progress on Archive of Our Own works.

The project is unofficial and is not affiliated with Archive of Our Own, the Organization for Transformative Works, or Tampermonkey.

## Features

- Saves reading progress on AO3 works, chapters, and Entire Work view.
- Resumes the last saved position after user confirmation.
- Redirects from the main work page to the last saved chapter or Entire Work view.
- Keeps direct chapter links under user control and asks before returning to unfinished older progress.
- Shows compact progress badges on AO3 work cards, bookmarks, history, and reading pages.
- Calculates progress from the story text area, not the comments section.
- Clear all saved data from the Tampermonkey menu.
- Badge colors follow the current AO3 skin, including dark skins.

## Files

- `ao3-last-read.user.js` - Tampermonkey userscript.
- `NOTICE.md` - copyright, attribution, and unofficial-project notice.
- `PRIVACY.md` - privacy notes and disclaimer.
- `AI_AUDIT_GUIDE.md` - guide for reviewing the code with AI before installation.

## How it works

`ao3-last-read.user.js` runs on AO3 pages through Tampermonkey.

On work pages, it tracks the reader's current story-text position and stores progress locally in the browser. Each work keeps a summary entry for the most recent reading position, while individual chapter or Entire Work entries keep their own saved positions.

On AO3 pages with work cards, it reads the saved summary data and adds a small `Last read` badge beside the work date.

The script does not contact any external service.

## Video demo

<p align="center">
  <video src="assets/ao3_last_read_demo.mp4" controls width="720">
    Your browser does not support the video tag.
  </video>
</p>

[Watch the demo video](assets/ao3_last_read_demo.mp4)

The demo uses real AO3 data for an objective demonstration:

- Work: [From You, A Whisper of Hope](https://archiveofourown.org/works/68383601/chapters/176976881)
- Author: [VanToRia](https://archiveofourown.org/users/VanToRia/pseuds/VanToRia)
- Series: [The Death and the Pale Dawn](https://archiveofourown.org/series/4966846)

The referenced work, author profile, and series belong to their respective AO3 creator.

## Installation

1. Install Tampermonkey in your browser.
2. Create a new userscript.
3. Use the contents of `ao3-last-read.user.js`.
4. Save the userscript (Ctrl + S).
5. Open AO3 and read normally.

## Configuration

The main configuration values are near the top of `ao3-last-read.user.js`:

- `SAVE_THROTTLE_MS`: Minimum delay between automatic saves while scrolling.
- `RESTORE_DELAY_MS`: Delay before restoring scroll position after page load.
- `RESTORE_LOCK_MS`: Short lock that prevents the restore scroll from being saved as user progress.
- `READING_MARKER_RATIO`: Viewport marker used to determine the active reading position.
- `UNFINISHED_PROGRESS_LIMIT`: Progress threshold used before asking whether to return to unfinished older progress.

## Privacy

This project is designed to run locally in the user's browser.

The author does not receive AO3 reading history, work IDs, chapter titles, browser data, or saved progress. See `PRIVACY.md` for details.

Before installing, users are encouraged to review the source code. `AI_AUDIT_GUIDE.md` includes a prompt for independent AI-assisted review.

## Acknowledgements

This project was inspired by PhaiRice, the Phainon x Castorice pairing from Honkai: Star Rail (miHoYo). They are the reason behind the name phairiceismyotp.

My deepest thanks go to the friends and beta testers from the PhaiRice shipper community. Your support, testing, and suggestions helped shape this project from a small personal tool into something worth sharing.

Thank you, sincerely.

## License

AO3 Last Read is licensed under AGPL-3.0-only.

Copyright (c) 2026 phairiceismyotp (or3zz - Nguyen Tin)
