---
title: "How to Add a Whole YouTube Playlist, Watch Later or Liked Videos to NotebookLM"
description: "NotebookLM (now Gemini Notebook) takes YouTube links one at a time and cannot open a playlist, Watch Later or your Liked videos. Here is how to send a whole list, or just the part you need, in one go."
date: 2026-09-26
faq:
  - q: "Can NotebookLM import a YouTube playlist link?"
    a: "No. NotebookLM, which Google now calls Gemini Notebook, adds a YouTube source one video link at a time. Pasting a playlist link does not import the videos in it. To add a playlist you need every video's own link, which is what TidyWL collects and sends for you."
  - q: "Can I add my Watch Later or Liked videos to NotebookLM?"
    a: "Not directly. Watch Later and Liked videos are private lists, and tools that work from a pasted link cannot open them. TidyWL runs on youtube.com with your own signed-in session, so it can read both lists and send their videos to a notebook."
  - q: "How many YouTube videos can one notebook hold?"
    a: "A free Gemini Notebook account allows 50 sources per notebook, and each video is one source. Paid Google AI plans raise that limit. If your list is longer, filter it down first, or split it across several notebooks."
  - q: "Why does NotebookLM say a YouTube video has no transcript?"
    a: "NotebookLM builds a YouTube source from the video's transcript, so a video with no captions can come back as \"transcript not available\" or an empty source. Newly uploaded videos sometimes gain automatic captions later. TidyWL's transcript download checks which videos have captions, which tells you in advance which ones will work."
  - q: "Does sending videos to NotebookLM share my data?"
    a: "It shares the video links you selected, with Google's Gemini Notebook, using your own Google session, and only when you press the button. It is the one TidyWL feature that sends any of your YouTube data out of your browser. The first time, your browser asks you to allow TidyWL on the Gemini Notebook site."
---

NotebookLM, which Google renamed Gemini Notebook, can study a YouTube video, but it only takes one video link at a time. It cannot open a playlist link, and it cannot see your Watch Later or Liked videos at all, because those lists are private. The quickest way to get a whole list into a notebook is a browser extension that reads the list on youtube.com and sends every link for you. TidyWL does this for Watch Later, Liked videos and any playlist you made, and lets you filter the list first so only the videos you want become sources.

## Why can't NotebookLM add a YouTube playlist?

NotebookLM treats each YouTube video as its own source, built from that video's transcript. There is no "import playlist" option, so a playlist link on its own brings nothing in. Adding 40 lectures by hand means opening each video, copying its link and pasting it into the source box 40 times.

Watch Later and Liked videos are harder still. They only exist inside your signed-in YouTube account. Web tools that ask you to paste a link cannot read them, and Google's own help for the Gemini assistant says it cannot list your liked videos or saved playlists either.

## How to send a whole list to Gemini Notebook with TidyWL

1. Install TidyWL for [Chrome](https://chromewebstore.google.com/detail/fkelmapobieliokjcmnilmjllacmbfjo), [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/doflfclcoebklpifkhcahbhlgbpamjcf) or [Firefox](https://addons.mozilla.org/firefox/addon/watch-later-tidy/). It is free and needs no account.
2. Open YouTube and open the TidyWL dashboard. Switch to **Watch Later**, **Liked videos**, or pick a playlist from the **Playlists** menu, then press **Sync** so the list is current.
3. Choose the videos. Tick them one by one, or narrow the list first (next section) and select everything that is left. If nothing is ticked, TidyWL sends the whole list you are looking at.
4. In the toolbar, open **Export & open** and click **Gemini Notebook**. Choose **Create New Notebook** or **Choose Notebook**.
5. The first time, your browser asks whether TidyWL may work on the Gemini Notebook site. Allow it. Gemini Notebook opens in a new tab, and once the notebook is open, TidyWL adds every selected video as a source in one request.

TidyWL also copies the video links to your clipboard before it starts. If Gemini Notebook is slow or a step fails, you can paste the links into the source box yourself.

Step-by-step screens are in the [Gemini Notebook tutorial](/tutorials/#gemini-notebook).

## Send only the videos you need

A notebook works best when every source is on topic, and a free notebook holds 50 sources. So it pays to filter before you send:

- **Search** by title, channel or the uploader's hidden tags, for example every video tagged "calculus".
- **Filter by channel or topic** from the sidebar breakdown, to keep one lecturer or one subject.
- **Filter by length** to drop Shorts and keep long talks, or set your own minimum and maximum in minutes.
- **Filter by watched progress** to send only the videos you have not finished.
- **Check the Unavailable filter**, which shows the deleted and private videos in your list. They cannot become sources anyway.

You can also open several playlists at once as one merged view, and send a course that you saved across more than one playlist into a single notebook.

## When NotebookLM rejects a video

NotebookLM reads a YouTube video through its transcript. If a video has no captions, NotebookLM may report that the transcript is not available or add an empty source. Very new uploads sometimes gain automatic captions after a while, so trying again later can work.

If you would rather have the text yourself, TidyWL's [bulk transcript download](/tutorials/#transcripts) saves one timestamped text file per video, after checking which videos have captions. Text files can be added to a notebook as sources too.

## What leaves your browser

Sending videos to Gemini Notebook is the one TidyWL feature that sends your YouTube data anywhere: the links of the videos you selected go to Google's Gemini Notebook, through your own Google session, only when you press the button. The rest of your playlist stays on your device. The full list of what the extension sends is in the [privacy policy](/privacy/).
