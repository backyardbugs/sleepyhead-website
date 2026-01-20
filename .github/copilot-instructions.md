# Sleepyhead Website Instructions

## Workflow Overview
This is a static website hosted on Neocities.
- **Development**: Update files locally.
- **Content**: Uses a custom client-side blog engine (`engine.js`) that reads metadata from `blog.js`.
- **Deployment**: Push to `main` branch triggers GitHub Action to deploy to Neocities.

## Architecture
- **Entry Point**: `index.html` loads `blog.js` (data) then `engine.js` (logic).
- **Routing**: `index.html` handles the feed. `index.html?post=slug` handles single posts.
- **Content Storage**:
    - Blog posts are Markdown files in `posts/`.
    - Blog metadata is in the global `posts` array in `blog.js`.
    - Images: `img/`.
    - Comics: `comics/`.

## Common Tasks

### Adding a New Blog Post
1.  **Create Markdown File**: Create a new file in `posts/` (e.g., `posts/my-new-post.md`).
    - *Convention*: Use kebab-case for filenames.
2.  **Register Support**: Add a new entry to the `posts` array in `blog.js`.
    ```javascript
    // Format: ["filename-no-extension", "Title", "YYYY-MM-DD", ["tag1", "tag2"]]
    ["my-new-post", "My New Post", "2026-01-20", ["journal"]]
    ```
    *Note*: Provide the filename *without* the `.md` extension.

### Updating logic
- **`engine.js`**: Contains the rendering logic, routing, and Markdown fetching.
- **`style.css`**: Main stylesheet. Note that `index.html` uses cache busting (`?v=...`) for styles and scripts.

### Deployment
- The GitHub Action in `.github/workflows/deploy.yml` requires the `NEOCITIES_API_TOKEN` secret in the repository settings.
- Push to `main` to deploy.

## Conventions
- **Dates**: YYYY-MM-DD format.
- **Tags**: Lowercase strings in current array.
- **Cache Busting**: `index.html` contains a manual timestamp script to load the latest `blog.js` and `engine.js` versions.
