# Get Deck indexed by Google (Search Console)

On-page SEO is already live (meta, Open Graph, Twitter card, JSON-LD, robots.txt,
sitemap.xml). These steps tell Google to actually crawl + index the site.

Site URL: **https://nodesoftwaresolutions.github.io/claude-deck/**

## 1. Add the property
1. Go to https://search.google.com/search-console
2. **Add property** → choose **URL prefix** → paste `https://nodesoftwaresolutions.github.io/claude-deck/`

## 2. Verify ownership (HTML-tag method — easiest here)
1. In the verify step, pick **HTML tag**. Google shows a line like:
   `<meta name="google-site-verification" content="XXXXXXXXXXXX" />`
2. Copy the `content` value and give it to me — I'll drop the tag into `site/index.html`,
   push, and Pages redeploys in ~1 min.
3. Back in Search Console, click **Verify**.

## 3. Submit the sitemap
1. Left sidebar → **Sitemaps**.
2. Under "Add a new sitemap" enter: `sitemap.xml`  → **Submit**.
3. Status should read *Success* within a day; pages start appearing in *Coverage*.

## 4. (optional) Request indexing now
- Paste the site URL into the top **URL inspection** bar → **Request indexing** to
  push it to the front of the crawl queue.

## What actually ranks it
Indexing ≠ ranking. Ranking follows traffic + backlinks — so the real lever is
posting the launch drafts (`show-hn.md`, `reddit-claudeai.md`, `discord.md`): each
is a backlink + a burst of visitors, which is what Google weights for a new page.
