# Sleepyhead Website Roadmap

## 🚀 Phase 1: Interaction & Polish
- [ ] **1. Status Box / Microblog**
    - *Goal*: Clarify the distinction between the sidebar "Now" section and the "Status" box.
    - *Plan*: Create a unified "Now" widget that is easier to update than editing HTML. Maybe a single JSON or Markdown file that populates the sidebar reading/playing lists locally.
- [ ] **5. Smart "Read More"**
    - *Goal*: Fallback truncation for the home feed.
    - *Plan*: Update `engine.js` to automatically cut off posts after ~100 words or 2 paragraphs if the `<!--more-->` tag is missing.
- [ ] **2. RSS Feed Generator**
    - *Goal*: allow subscriptions.
    - *Plan*: Create a Python or Node script that runs during the GitHub Action deploy process to generate `feed.xml` from `blog.js` + Markdown files.

## 🧭 Phase 2: Navigation & Discovery
- [ ] **8. Tag Cloud / Category Page**
    - *Goal*: Better content exploration.
    - *Plan*: New `tags.html` or a sidebar section that dynamically lists all unique tags found in `blog.js`.
- [ ] **7. Search Bar**
    - *Goal*: Find content instantly.
    - *Plan*: Implement a lightweight client-side search (like MiniSearch) that indexes `blog.js` titles and tags (and potentially content).
- [ ] **3. Series Navigation**
    - *Goal*: Connect multi-part essays.
    - *Plan*: Add a `series:` field to the blog metadata. `engine.js` will look for other posts with the same series name and auto-generate "Previous / Next in Series" links.

## 🕸️ Phase 3: The Digital Garden
- [ ] **12. Backlinks / "What Links Here"**
    - *Goal*: Interconnected thought.
    - *Plan*: A build script that scans all markdown files for links to other posts, builds a graph, and injects a "References" section at the bottom of the target post.
- [ ] **17. Sitemap Generator**
    - *Goal*: SEO.
    - *Plan*: Script to auto-generate `sitemap.xml` for Google using the `posts` array and static HTML files.

## 🧊 Icebox (Future Ideas)
- Dark/Light Mode Toggle
- Image Lightbox
- Reading Time Calculator
- Random Post Button
