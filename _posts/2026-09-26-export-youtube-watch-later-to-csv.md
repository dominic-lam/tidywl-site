---
title: "How to Export YouTube Watch Later, Liked Videos or a Playlist to CSV, Excel or Google Sheets"
description: "YouTube has no export button for Watch Later, Liked videos or your playlists. Here is how to save any of them as a CSV or JSON file with titles, channels and links, as a backup or for a spreadsheet."
date: 2026-09-26
faq:
  - q: "Can you export a YouTube playlist to Excel?"
    a: "Not from YouTube itself. A browser extension such as TidyWL can save Watch Later, Liked videos or any playlist you made as a CSV file, which Excel, Google Sheets and Numbers all open."
  - q: "What does the CSV file contain?"
    a: "One row per video, in the order you have the list sorted, with its position in the playlist, the title, channel name, channel ID, video ID and the video's link. The JSON export carries more: length, view count, upload date, watched progress and tags as well."
  - q: "Does Google Takeout export Watch Later?"
    a: "Google Takeout exports YouTube playlist data as files of video IDs and timestamps, without titles or channel names, and it can take hours to arrive. An extension export is immediate and readable, but only covers the list you have open."
  - q: "Will non-English titles show correctly in Excel?"
    a: "Yes. TidyWL writes the CSV with a byte-order mark so Excel reads it as UTF-8, and Chinese, Japanese, Russian and other titles open correctly."
  - q: "Can I export only some of the videos?"
    a: "Yes. The export saves the list you are looking at, so filter it first, for example by channel, length or search, and export what remains."
  - q: "Does exporting upload my playlist anywhere?"
    a: "No. The file is built in your browser and saved to your own computer. Nothing is sent to TidyWL."
---

YouTube has no export button for Watch Later, Liked videos or your own playlists. A browser extension can save them for you: TidyWL exports whichever list you have open as a CSV file, which Excel and Google Sheets open directly, or as JSON with more detail. The file has each video's title, channel and link, and it is built on your own computer in seconds.

## Why export a playlist?

- **A backup.** Watch Later and Liked videos exist only inside YouTube. If a list breaks, videos go missing, or you clear it and change your mind, an export is the only copy of what was there.
- **A spreadsheet.** Sort, annotate and share a list of videos in Excel, Google Sheets or Notion.
- **A list of links.** Feed the links to another tool, such as a note-taking app or an AI assistant.

## How to export with TidyWL

1. Install TidyWL for [Chrome](https://chromewebstore.google.com/detail/fkelmapobieliokjcmnilmjllacmbfjo), [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/doflfclcoebklpifkhcahbhlgbpamjcf) or [Firefox](https://addons.mozilla.org/firefox/addon/watch-later-tidy/). It is free and needs no account.
2. Open YouTube and open the TidyWL dashboard. Switch to **Watch Later**, **Liked videos**, or a playlist from the **Playlists** menu, and press **Sync** so the list is complete.
3. In the toolbar, open **Export & open** and choose **Export your videos as CSV** or **Export your videos as JSON**.

The file downloads straight away. To open it in Google Sheets, use **File, Import** and upload the CSV.

## What is in each file

**CSV** has one row per video, in the order you have the list sorted, with these columns: Index (the video's position in the playlist), Title, Channel, Channel ID, Video ID, Set Video ID and URL. It is written with a byte-order mark so Excel reads it as UTF-8, and titles in any language open correctly.

**JSON** has everything TidyWL knows about each video: the fields above plus its length, view count, upload date as YouTube shows it, whether you watched it and how far, and the uploader's tags. Use it when you want the full record or plan to process the list with a script.

## Export only part of a list

The export saves the list you are looking at, not the whole playlist, so you can filter first:

- search by title, channel or tag
- pick a channel or a topic from the sidebar
- keep only long videos, only Shorts, or your own length range
- keep only unwatched videos, or only the ones you have finished

Then export, and the file holds just those videos. The same works on a merged view of several playlists.

## Other ways to get your list out

Google Takeout exports YouTube data as files of video IDs and timestamps, without titles or channel names, and the export can take hours to arrive. Copying titles by hand from the playlist page works for a few dozen videos and stops being practical after that.

The export is built in your browser and saved to your own computer. Nothing is sent to TidyWL.
