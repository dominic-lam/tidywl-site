# What an uninstall page should show to get more ratings and useful feedback

Research for TidyWL's uninstall page. Read on 2026-11-05. Every page in the Examples table was opened that day. Each uninstall URL was taken from the extension's own package (`chrome.runtime.setUninstallURL`) or from its source on GitHub, not from memory.

**Bottom line:** the evidence is thin. No source measures whether a rating ask on an exit page works, or whether it lowers the average. The strongest evidence comes from next door: prompted reviews in retail, a 2008 browser uninstall survey, and survey research in general. The policy picture is clear: incentives are banned, and none of the three browser stores bans an ask shown to everyone.

## 1. Findings

**F1. None of the 22 real extension uninstall pages read asks for a store rating.**
- Source: the Examples table, read 2026-11-05.
- Sample: 14 large consumer extensions (Grammarly, Honey, AdBlock and others) and 8 small or open-source ones.
- Assumes: what is common is not proof of what works. The sample is a convenience sample.
- Strength: observed. TidyWL's first-screen rating ask is unusual among peers.

**F2. Large companies use the same pattern: a reinstall button, checkbox reasons, a free-text box, and sometimes a letter signed by a named person.**
- Source: Grammarly (an engineer, "Mike"), Toby (a product designer, "Summer"), Speechify (the founder, "Cliff"), QuillBot (signed "Team Quillbot"). Read 2026-11-05.
- Sample: 4 pages.
- Assumes: large products; no outcome data is published.
- Strength: observed. TidyWL's own byline matches this pattern.

**F3. AdBlock shows the person's own usage next to Reinstall, and pairs reasons with a fix plus a Re-install button.**
- Source: getadblock.com/en/uninstall/, read 2026-11-05.
- What it shows: "We have blocked 23,358 ads for you!" The page was loaded without user parameters, so the figure is presumably a default. Reasons like "I don't want to pay" get a reply ("No payment is needed…") and a Re-install button.
- Sample: 1 page.
- Assumes: it works for AdBlock; no results are published.
- Strength: observed. This is the closest peer to TidyWL's receipt and per-reason replies.

**F4. Firefox's own uninstall survey got about 7% of visitors to click an answer and 0.7% to write a comment.**
- Source: Mozilla Blog of Metrics, "Changes Between Firefox 2 and 3", 2008-09-04.
- Sample: 113,000 visitors in one month; fewer than 8,000 multiple-choice answers; 826 comments.
- Assumes: a browser, not an extension, in 2008. The survey was not localized, and about 90% of visitors were outside English-speaking countries.
- Strength: measured. It is the only published base rate found. It suggests one-click answers come in roughly 10 times as often as typed text.

**F5. Customers asked by email to review gave higher ratings than those who reviewed on their own, and starting the asks raised the overall average.**
- Source: Askalidis & Malthouse, arXiv 1604.00417 (2016); the journal version, with Kim, is in Decision Support Systems (2017).
- Numbers: prompted reviews averaged 4.3 against 3.88 for self-motivated ones. After a retailer started sending asks, the overall average went from 3.8 to 4.1. Self-motivated reviewers' volume and ratings did not change. Prompted reviews were shorter (about 160 characters against 300).
- Sample: 238,809 reviews of 27,574 products at 4 US retailers. Consumer goods; verified buyers asked soon after purchase.
- Assumes: the people asked were all buyers, not people who had just quit. Whether this holds for leavers is untested.
- Strength: measured, with a natural experiment.

**F6. No evidence was found on whether asking people who just left lowers the average rating.** Two developers on r/chrome_extensions argue that it does:
- Thread 1wprbns (2026-09-25): sending frustrated users to the review form "will hurt perception".
- Thread 1xcrl8i (2026-10-22): asking uninstallers for a review "isn't a good idea".
- Strength: opinion only, with no data.

**F7. In randomized trials of emailed questionnaires, shorter, personalized questionnaires got more replies.**
- Source: Edwards et al., Cochrane review MR000008, 2009 (PubMed 19588449). A 2023 update exists and was not read.
- Effects for online questionnaires (odds ratios):
  - Shorter questionnaire: 1.73.
  - Personalized: 1.24.
  - A statement that others had responded: 1.52.
  - An offer of the results: 1.36.
  - A male signature: 0.55, from few trials.
- Sample: 32 trials of online questionnaires, from health research.
- Assumes: emailed research surveys, not exit pages.
- Strength: measured, but the setting is different.

**F8. Subscription cancellation tools claim large "save" rates, but they act before the cancel goes through, so they do not transfer to a page shown after removal.**
- Source: Churnkey's homepage claims "Save ~54% of customers" (read 2026-11-05). Definitions of a save differ between vendors.
- Strength: vendor marketing.

**F9. Reason-based fix tips and reinstall links are common, but nobody publishes win-back numbers.** Examples:
- Rakuten: "Uninstalled by accident? Reinstall here."
- Mailsuite: offers "I'm reinstalling Mailsuite" as a reason.
- Link Extractor: shows a warning when the removed copy was an old version.
- A developer on Reddit (1wprbns, 2026-09-25) rebuilt his page to answer each reason and to show where "missing" features already are. He has no numbers yet.
- Strength: observed, plus anecdote.

**F10. Speechify's button says "Submit and Uninstall" after the extension is already gone.**
- Source: Speechify's page, read 2026-11-05. A developer called this pattern misleading in Reddit thread 1x2e5nt (2026-10-10).
- Strength: observed. It is an honesty risk to avoid.

**F11. Adblock Plus shows its uninstall reasons in random order.**
- Source: ABP issue tracker, ticket 5465 (2017).
- This guards against people simply picking the first reason. Strength: observed.

**F12. Optional follow-up email boxes are common.**
- Unhook, QuillBot and Toby have one. Grammarly and Speechify don't.
- No evidence was found on how they affect replies. Strength: observed.

**F13. One developer suggests putting the version and the days since install in the uninstall link, to separate quick quitters from long-time users.**
- Source: a comment in Reddit thread 1xcrl8i (2026-10-22).
- Strength: opinion. The technique itself is sound, since the URL is set by the extension.

## 2. Examples

All pages were seen on 2026-11-05. The source of each URL is the extension's package, unless marked GitHub.

| Product | What the page shows, in order | URL |
|---|---|---|
| Grammarly | Reinstall; "Help Us Improve"; nested checkbox reasons with follow-ups; text box; Submit; letter from engineer "Mike" | grammarly.com/extension-uninstall |
| Honey | Reinstall; checkbox reasons (work computer, privacy, no savings…) with a feature pitch; "Other" text; Submit | joinhoney.com/uninstall |
| QuillBot | Reinstall; 8 checkbox reasons; text; optional email "so we can follow up"; Submit; team letter | quillbot.com/exit-survey |
| AdBlock | "Successfully uninstalled"; "Didn't want to uninstall?"; blocked-ads count; Reinstall Now; reasons with a fix and a Re-install button on each; Submit | getadblock.com/uninstall/ |
| Toby | 9 chip reasons, select all; optional email; Send; letter from designer "Summer" | gettoby.com/goodbye |
| Speechify | 9 chip reasons; text; "Submit and Uninstall"; letter from founder "Cliff" | speechify.com/onboarding/uninstall/ |
| Momentum | Typeform: "sorry to see you go", Start, "Takes 3 minutes" | momentumdash.com/uninstall |
| Mailsuite (Mailtrack) | Redirects to SurveyMonkey; 12 reasons including "I'm reinstalling" | mailtrack.io/en/goodbye |
| Capital One Shopping | "sad to see you go"; 7 radio reasons; Submit | capitaloneshopping.com/uninstall-survey |
| Rakuten | Sprig survey: help offer, contact link, "Uninstalled by accident? Reinstall here", Start | rakuten.com/button/uninstall |
| Tampermonkey | 5 radio reasons; optional details; Send; link to a FAQ entry | tampermonkey.net/uninstall.php |
| Dark Reader | "Thank you! Hope to see you again!"; feedback by mailto; partner ad | darkreader.org/goodluck/ |
| ImprovedTube | Plea to stay; Discord; GitHub issues; "remember the first time you used this?" | improvedtube.com/uninstalled |
| Unhook | Free-text "why"; optional email; statistic pitch; reinstall link | unhook.app/uninstall |
| Mue | Feedback request; "Changed your mind?"; Reinstall | muetab.com/uninstall (GitHub) |
| Hackertab | 5 checkbox reasons; text; Send | hackertab.dev/uninstall.html (GitHub) |
| Link Extractor | Why; bug and feature links; Discord; Ko-fi; old-version warning; 3 reasons; text | link-extractor.cssnr.com/uninstall/ (GitHub) |
| add0n.com extensions | "Extension is Removed!"; long checklist of performance, UX and trust issues; comments | add0n.com/feedback.html (GitHub) |
| YouTube Tracker | Optional email; feedback type; text; reinstall link. The developer's Reddit reply implied a review option earlier; none on 2026-11-05 | youtube-tracker-soimtheboss.vercel.app |
| Banana Prompt Quicker | Chinese-language form; GitHub issues | glidea.github.io/…/uninstall.html (GitHub) |

Some extensions set no uninstall page at all: Loom, LastPass, OneTab, Todoist, SponsorBlock, Return YouTube Dislike, Video Speed Controller, Wappalyzer, Session Buddy and ColorZilla.

Four only send a tracking ping: vidIQ, Enhancer for YouTube, Keepa and Ghostery. Those were not visited, to avoid logging fake uninstalls.

## 3. Policy

All read on 2026-11-05.

**Chrome Web Store.** [Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies), page dated 2025-05-22.
- Spam and abuse bans "inflating product ratings, reviews, or install counts by illegitimate means", "such as fraudulent or incentivized downloads, reviews and ratings".
- "No cheating" names "manipulating your extension's reviews or ratings."
- The [spam FAQ](https://developer.chrome.com/docs/webstore/program-policies/spam-faq) (2020-05-01) adds that ratings from yourself or from users "affiliated with the publisher" count as manipulation.
- Nothing addresses asking only happy users (review gating), or wording that steers toward a star count.
- A 2026 thread on the Chromium extensions developer forum asks about "click-to-unlock" review tactics (YUs9SLVqxAY). No official answer was visible.

**Mozilla.** The [Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/) (last update 2026-10-20) say nothing about ratings. A revised version takes effect 2026-12-01; its preview was not read. Mozilla's advice page, "[Gently ask for a review](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/)", says:
- "Do not repeatedly request the user to provide a review".
- Do not make a review a requirement for using features.
- Give the user time to learn the add-on before asking.
- Do not influence the review by pre-filling comments or "selecting a five-star rating".

**Microsoft Edge.** The [developer policies](https://learn.microsoft.com/en-us/legal/microsoft-edge/extensions/developer-policies) (ms.date 2026-07-24) say there is no place for fraud, "be it ratings and review manipulation". Nothing is said on asking or gating.

**Adjacent rules, not binding on extensions:**
- **US FTC**, [guide for marketers](https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers) (Jan 2022): "Don't ask for reviews only from customers you think will leave positive ones." It also says an incentive must not be conditional on a positive review.
- **Google Play**, [In-App Review API](https://developer.android.com/guide/playcore/in-app-review) (2026-01-30): the app "shouldn't ask the user any questions before or while presenting the rating button". The examples given are "Do you like the app?" and predictive questions about stars.
- **Google Play**, [ratings policy](https://support.google.com/googleplay/android-developer/answer/9898684): no incentives. "Prompt users to leave a rating in a clear, non-deceptive way."
- **Apple**, App Review Guidelines 5.6.1 (2026-10-16): "we will disallow custom review prompts"; apps must use Apple's own API.

**What this means for TidyWL's page:**
- An unconditional ask with no reward is within the text of all three stores.
- The closest lines are two adjacent norms: no opinion question placed right before the rate button (Google Play's rule), and no asking only the likely-happy (FTC).
- The current heading "Did I save you some time?" for counts of 100 or more is an opinion question placed right before the Rate button.
- The "finished my cleanup" reply adds a second rating ask that only satisfied-sounding leavers see. I did not check in the markup whether that reply also carries a Rate button.
- Everyone still sees the first-screen ask, so this is not exclusive gating.

## 4. Candidate changes, ranked

These are for the owner to approve, not decisions.

1. **Measure before changing more.**
   - Basis: F5, F6. Nothing published answers whether the ask lowers the average.
   - Change: count Rate-button clicks by store, by count bucket, and by whether a reason was picked, with no install ID. Then sweep the store reviews posted since 2026-11-03 for leaver-type text.
   - Risk: a new field means changing the privacy copy in the same push (standing invariant 39). Low otherwise.
2. **Use one neutral heading for everyone, and keep the receipt number above it as context.**
   - Basis: Mozilla's advice and the adjacent Play rule (both in § 3), F5.
   - Change: drop the "Did I save you some time?" variant and keep "How would you rate it?".
   - Risk: possibly fewer ratings from heavy users; untested. The policy risk drops.
3. **Make the second rating nudge equal across reasons, or remove it from the "finished my cleanup" reply.**
   - Basis: the FTC norm (adjacent), F6.
   - Change: either every reply ends with the same quiet Rate link, or none does.
   - Risk: low. It removes the only selective ask.
4. **Shuffle the order of the reasons, keeping "Something else" last.**
   - Basis: F11.
   - Change: fairer counts per reason.
   - Risk: none for policy; a small cost to scanning the list.
5. **Add the version and the days since install to the uninstall link.**
   - Basis: F13.
   - Change: answers can be split into "left after a day" and "left after months", and old-version breakage can get an "update first" reply, as Link Extractor does (F9).
   - Risk: the page says its figures are "counted in this browser"; if the days are sent with the reason, the privacy copy must change in the same push.
6. **Put a reinstall link inside the replies that have a fix.**
   - Basis: F3, F9.
   - Change: the replies to "wouldn't open", "something stopped working" and "videos became unavailable" end with Reinstall, as AdBlock's do.
   - Risk: none for policy. No win-back data exists, so expect little.
7. **Keep as is:** the one-click reason (F4, F7), the optional email with its deletion promise (F12), and the personal byline (F2).
   - Do not act on F7's "male signature" result: it comes from few trials of emailed surveys.

**Do not do:**
- Any reward for a rating (CWS ban).
- Pre-selected or pictured star counts, or "5 stars" wording (Mozilla's advice).
- A "Submit and Uninstall"-style button (F10).
- Showing the store's average or other people's reviews next to the ask. F5's authors tie the downward drift of self-motivated reviews to the social signals those reviewers saw while reviewing.

## 5. What could not be found

- **Response rates for any extension uninstall page.** One developer reported "about 70 responses" with no denominator (Reddit 1wprbns).
- **Any test of rating-ask placement on an exit page**: before or after the reason, or one click against a form.
- **Any measurement of a leaver rating ask's effect on the average.**
- **Win-back or reinstall rates** from any exit page.
- **A store review complaining about a "rude" uninstall message** (item lklendgldejcnkkaldoggoapclkepgfb). Unverified: the store item is unavailable.
- **AMO's user review guidelines.** The page sits behind a JavaScript challenge.
- **Mozilla's 2026-12-01 policy preview** and the **2023 Cochrane update**: not read.
- **ProsperStack's figures.** Its homepage is rendered by script and was not read.
- **Pages found in source but not opened before the stop:**
  - Turn Off the Lights: turnoffthelights.com/browser/extension/uninstall/chrome/
  - StayFocusd: stayfocusd.com/goodbye/
  - Checker Plus: jasonsavard.com/uninstalled
  - Adblock for YouTube: get.adblock-for-youtube.com/uninstall
  - Malwarebytes Browser Guard: an Alchemer survey
- **A press claim that Chrome may prompt users to review their extensions** (Windows Report): unverified.

## Working files

The downloaded extension packages were deleted on 2026-11-05 once the uninstall addresses had been read from them; the saved pages and scripts lived in a session scratchpad and were not kept.

## What the owner decided (2026-11-05)

- Keep "Did I save you some time?" for 100 or more videos cleaned up (candidate 2 declined).
- Keep the rating line in the "I finished my cleanup" reply (candidate 3 declined).
- Count Rate clicks: queued as its own tidywl-api session, since the visit counter only accepts `uninstall` and `feedback` (candidate 1 approved).
- Keep the reasons in a fixed order (candidate 4 declined).
- Reinstall links added to the "Wouldn't open" and "Videos became unavailable" replies (candidate 6 approved).
- Candidate 5 (version and days in the link) dropped: the link already carries `v` and `a`.
