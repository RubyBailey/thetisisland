# Thetis Island Website — Editor Guide

> **Reading this file:** This guide lives in the project's GitHub repository, where it's rendered as a formatted page. View it at: https://github.com/RubyBailey/thetisisland/blob/staging/docs/editor_guide.md — or open the raw `.md` file in any Markdown viewer (macOS Finder Quick Look works; so does any text editor).

A quick-start guide for editing content on thetisisland.net using the CMS admin panel.

## Logging In

1. Open the **Decap CMS** editor at `https://thetisisland.net/admin/` after the production domain is deployed. For staging, use the corresponding Cloudflare Pages preview or staging domain with `/admin/` appended.
2. Click **Login with GitHub**.
3. Authorize the GitHub application when prompted (first login only).
4. The content dashboard will open once authentication succeeds.

You need a GitHub account with write access to the `RubyBailey/thetisisland` repository. Ask a repository administrator to grant access if required.

**Branch:** The current Decap configuration edits the `staging` branch. Changes become visible on whichever Cloudflare Pages environment deploys that branch. Do not assume CMS edits publish directly to the production website unless the production deployment is configured to use `staging`.

## The Dashboard

The left sidebar shows these collections:

| CMS Collection | What it controls | Website page/section |
|---------------|-----------------|---------------------|
| **Community & Groups** | Organization, club and volunteer group cards | /community |
| **Special Pages** | Pages with custom templates — edit only, cannot be created or deleted | Home, Ferry, Calendar, Membership, plus the nav entry for Community |
| **Pages** | Standard pages — you can create new ones and delete old ones | /about, /visitors, /services, /emergency, /contact, and any new pages you create |
| **Home Cards** | The six navigation cards on the home page | / (home page) |
| **Ferry Schedule** | Ferry departure times for the snake schedule diagram | /ferry |

Click any collection to see its entries. Click an entry to edit it.

## Special Pages vs. Standard Pages

The site has two kinds of pages:

**Special Pages** have custom templates with built-in features (webcam images on Ferry, the calendar embed, the membership form, the home page hero). These cannot be created or deleted — only their text content can be edited. The "Community & Groups" entry in Special Pages controls its navigation label and position; its content comes from the Community & Groups collection. Edit TIRRA Services and Emergency as entries under Pages, including their headings, introductions, content and navigation settings. Emergency retains its automatic fire danger banner; the rating service is managed separately. Upload the current guide under Visitors' Guide; its download link updates automatically.

**Standard Pages** (listed under "Pages") use a simple title + content template. You can freely create new pages, edit them, and delete them. When you create a new page, it automatically gets a URL based on its filename (e.g., a page called "Board Minutes" gets the URL `/board-minutes`).

### Reserved page names

When creating a new page, **do not use these names** — they're taken by special pages or structural routes and the new page would be inaccessible:

> ferry, emergency, calendar, membership, services, community, admin, thank-you, images

The CMS title hint reminds you of this, but there's no hard block — just avoid those names.

## Creating a New Page

1. Click **Pages** in the sidebar
2. Click **New Page** at the top
3. Fill in the **Title** — this becomes the page heading and determines the URL slug
4. Optionally set a **Subtitle** (shown below the heading) and **Meta Description** (for search engines)
5. Set **Show in Navigation** to on if you want the page to appear in the nav bar
6. Set **Nav Order** to control where it appears (lower numbers = further left). Look at existing pages' Nav Order values to choose a number that places yours correctly.
7. Optionally set a **Nav Label** if you want a shorter name in the nav bar than the full title
8. Write your content in the **Content** field using Markdown
9. Click **Publish**

The site rebuilds automatically in a couple of minutes. Your new page will appear at its URL and, if you enabled it, in the navigation bar.

## Deleting a Page

1. Open the page you want to delete from the **Pages** collection
2. Click the delete option in the editor
3. The page and its nav link are removed after the site rebuilds

**You cannot delete Special Pages.** If a Special Page needs to be hidden from the navigation, toggle its **Show in Navigation** field off instead.

## Navigation and Page Ordering

The website navigation bar is driven entirely by the page collections. Every page (both Special and Standard) has these navigation fields:

| Field | What it does |
|-------|-------------|
| **Nav Order** | Position in the nav bar. Lower numbers appear further left. |
| **Show in Navigation** | Toggle on/off to show or hide the page in the nav bar. |
| **Nav Label** | Optional short name for the nav bar. If blank, the page title is used. |

To **reorder navigation items**, change their Nav Order numbers. You don't need consecutive numbers — only the relative order matters (e.g., 1, 3, 5 works the same as 1, 2, 3).

To **hide a page from navigation** without deleting it (e.g., for a thank-you page, a draft, or a seasonal page), toggle Show in Navigation off.

## Editing an Organization

Each organization has these fields:

| Field | What it does |
|-------|-------------|
| **Name** | The organization's full name (shown as the card heading) |
| **Tagline** | One-line description shown on the card |
| **Description** | Optional longer description (reserved for future use) |
| **Website URL** | Full URL (https://example.com) or internal path (/about). Leave blank if none. |
| **Category** | Determines which section the card appears in: Organization, Club, Social Service, or Social & Exercise |
| **Tags** | Optional labels like "Official", "Emergency-Related", "Recreation" |
| **Featured** | Toggle on to pin this entry to the top of its category |

### Ordering

Organizations are sorted **featured first, then alphabetically** within each category. To move an organization to the top of its category, toggle Featured on. You cannot set arbitrary order within a category — it's always alphabetical after the featured entries.

## Editing a Service

| Field | What it does |
|-------|-------------|
| **Name** | Service name (e.g., "Solid Waste Management") |
| **Short Description** | Brief summary shown in listings |
| **Featured** | Toggle on to show this service first |
| **Full Description** | Detailed content with hours, location, etc. Written in Markdown. |

### Ordering

Same as organizations: **featured first, then alphabetical**.

## Editing Home Cards

The six navigation cards on the home page are editable under the **Home Cards** collection. Each card has:

| Field | What it does |
|-------|-------------|
| **Title** | Card heading (e.g., "Ferry Info") |
| **Link** | URL path the card links to (e.g., `/ferry`) |
| **Description** | Brief text shown below the title |

You can reorder, add, or remove cards. Changes take effect after the site rebuilds.

## Editing the Ferry Schedule

The ferry schedule is under **Ferry Schedule** in the sidebar. It has two sailing lists (Sunday-Thursday and Friday) plus legend text and notes.

Each sailing is one trip. The ferry zigzags — sailings alternate direction automatically. For each sailing, enter the time at each terminal the ferry visits, or leave a terminal blank if the ferry skips it on that trip.

The **Flag** dropdown lets you mark special sailings:
- **Probable DC** — Dangerous cargo sailing (no passengers)
- **Possible DC** — May or may not accept passengers
- **Arrival Only** — Last run of the day

**Important:** After editing, check the deployed site to make sure the snake diagram looks correct. The visual layout depends on sailing order and which terminals are filled in.

When BC Ferries publishes a new schedule, update the **Effective Date** field and edit each sailing to match the new times. The official schedule is always at the [BC Ferries website](https://www.bcferries.com/routes-fares/schedules/seasonal/THT-CHM).

## Editor Notes

Many entries have a field labelled **"Editor Notes (not published)"**. These contain verification flags — things that need to be checked before launch. They look like:

> VERIFY: Is "interdenominational" correct? What is the actual name of the church?

These notes are **never shown on the public website**. They're only visible here in the editor. Once you've verified or corrected the information:

1. Update the relevant content field with the correct information
2. Clear the editor note (or update it to say "Verified" / "Confirmed by Karl")
3. Save

## Writing in Markdown

The Content and Full Description fields use Markdown. The editor provides a toolbar with buttons for common formatting, but here are the basics:

```
## Section Heading

Regular paragraph text. **Bold text** and *italic text*.

- Bullet point one
- Bullet point two

[Link text](https://example.com)

**Bold label** — followed by a description.
```

The toolbar's rich text mode handles most of this for you — you can switch between rich text and raw Markdown using the toggle in the editor toolbar.

## Saving and Publishing

When you click **Publish** or **Save**, Decap CMS commits the change to the configured GitHub branch (currently `staging`). Cloudflare Pages may then build a preview or production deployment, depending on its branch settings.

To confirm where your changes appear, check the Cloudflare Pages production branch and preview branch configuration. If production uses `main`, edits made through the current CMS on `staging` will not automatically become live until changes are merged or the deployment workflow is changed.

If you make a mistake, edit the entry again and publish the correction. You can also revert the relevant commit in GitHub if necessary.

## Tips

- **Preview before publishing:** Use the preview pane on the right side of the editor to see how your content will look.
- **Don't worry about HTML:** Write in Markdown or use the rich text toolbar. The site handles all styling automatically.
- **Links:** For external sites, always include the full URL starting with `https://`. For other pages on our site, use the path (e.g., `/contact`).
- **Questions?** Contact the TIRRA website administrator or a maintainer of the `RubyBailey/thetisisland` GitHub repository.
