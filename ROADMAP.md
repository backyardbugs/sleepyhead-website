# Sleepyhead Website Roadmap

## 🧠 The Philosophy
> "An archive for my life... a fun place... early internet aesthetics."
> Punk, DIY, Anti-Algorithmic, Clean but Personal.

## 🚀 Phase 1: Interaction & Polish
- [x] **1. Status Box / Microblog**
    - *Goal*: Clarify the distinction between the sidebar "Now" section and the "Status" box.
    - *Implemented*: Unified into `status.json` and `loader.js`.
- [x] **5. Smart "Read More"**
    - *Goal*: Fallback truncation for the home feed.
    - *Implemented*: `engine.js` auto-truncates at 1000 chars.
- [ ] **2. RSS Feed Generator**
    - *Goal*: Allow subscriptions (Open Web standard).
    - *Plan*: Script to generate `feed.xml` on deploy.
- [ ] **Captain's Log Rollover (2026)**
    - *Goal*: Archive 2025 data and start fresh for the new year.
    - *Plan*: Create `data/2026.js`, update `year.html` to toggle between years.

## 🎨 Phase 2: The Collections (Visual & Audio)
- [ ] **The Demo Tape (Music Player)**
    - *Goal*: A home for scraps and demos.
    - *Aesthetic*: A crate of Vinyls or a stack of CDs.
    - *Tech*: Custom audio player with a playlist JSON.
- [ ] **The Shelf (Library Upgrade)**
    - *Goal*: Organize reviews of books, movies, games, manga, music.
    - *Aesthetic*: Visual shelves / grid layout rather than just text lists.
- [ ] **The Binder (Card Collection)**
    - *Goal*: Display Yugioh and Pokemon collections.
    - *Plan*: Image gallery with zoom capabilities (Lightbox).
- [ ] **The Lookbook (Fashion)**
    - *Goal*: Inspirations and fits.
    - *Plan*: Pinterest-style masonry grid or a "closet" interface.

## 🧭 Phase 3: Identity & Projects
- [ ] **Gatebound Hub**
    - *Goal*: Dedicated home for the novel.
    - *Features*: World building docs, status updates, and a filtered feed of "gatebound" tagged posts.
- [ ] **About Me / CV**
    - *Goal*: Professional yet personal overview.
    - *Content*: Projects, music produced, awards, publications.
- [ ] **The Mailbox**
    - *Goal*: Guestbook / Messages.
    - *Tech*: Simple form (maybe `formspree`) or a public guestbook script.

## 🕸️ Phase 4: The Digital Garden (Navigation)
- [ ] **8. Tag Cloud / Category Page**
    - *Goal*: Better content exploration.
- [ ] **7. Search Bar**
    - *Goal*: Find content instantly.
- [ ] **12. Backlinks / "What Links Here"**
    - *Goal*: Interconnected thought.

## 🧊 Icebox (Future Ideas)
- Series Navigation (Part 1, Part 2 links)
- Dark/Light Mode Toggle
- Random Post Button
