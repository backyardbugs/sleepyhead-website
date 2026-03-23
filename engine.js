/* --- engine.js --- */

var postFolder = "./posts/";
var COMMENTS_API_URL = window.COMMENTS_API_URL || "https://script.google.com/macros/s/AKfycbxWvLNwivMBlKL9ODO72RbqKemf-qAAFSIjVK9lNvllPHpZDGnSyEeECQ4r7sADquXr8Q/exec";
var COMMENTS_FALLBACK_INJECTED = false;

function loadBlogFeed() {
    var container = document.getElementById("blog-feed");
    var html = "";

    // 1. CHECK THE URL: Are we looking for a specific post?
    const urlParams = new URLSearchParams(window.location.search);
    const specificPost = urlParams.get('post');

    if (specificPost) {
        // --- SINGLE POST MODE ---
        var targetPost = posts.find(p => p[0] === specificPost);
        
        if (targetPost) {
            // Render just that one post
            html += buildPostHTML(targetPost, true); // true = full view
            container.innerHTML = html;
            
            // Fetch content (FALSE means "Do not cut off the text")
            fetchPostContent(targetPost[0], false); 

            // Add a "Back to Home" button
            var backBtn = document.createElement("a");
            backBtn.innerHTML = "← Back to Home";
            backBtn.href = "index.html";
            backBtn.style.display = "block";
            backBtn.style.marginTop = "40px";
            backBtn.style.marginBottom = "60px"; // Extra space for comments
            container.appendChild(backBtn);

            // --- INJECT COMMENTS ---
            injectComments(targetPost[0]); 

        } else {
            container.innerHTML = "<h2>404: Post not found.</h2><p><a href='index.html'>Go Home</a></p>";
        }

    } else {
        // --- HOME FEED MODE ---
        // Loop through the first 10 posts
        for (var i = 0; i < Math.min(posts.length, 10); i++) {
            html += buildPostHTML(posts[i], false); // false = feed view
        }
        container.innerHTML = html;
        
        // Fetch content for all 10
        for (var i = 0; i < Math.min(posts.length, 10); i++) {
            // TRUE means "Yes, please cut off the text if there is a break"
            fetchPostContent(posts[i][0], true); 
        }
    }
}

// HELPER: Creates the HTML box for a post
function buildPostHTML(postData, isSinglePage) {
    var filename = postData[0];
    var title = postData[1];
    var date = postData[2];
    var tags = postData[3] || [];

    // Create Tag HTML
    var tagHTML = "";
    tags.forEach(tag => {
        tagHTML += `<span class="tag">#${tag}</span> `;
    });

    // If it's the Home Feed, make the Title a link to the permanent page
    var titleHTML = isSinglePage 
        ? title 
        : `<a href="?post=${filename}" class="permalink">${title}</a>`;

    return `
    <article>
        <h2 class="post-title">${titleHTML}</h2>
        <div class="post-meta">
            ${date} &nbsp;
            ${tagHTML}
        </div>
        <div id="content-${filename}">Loading...</div>
    </article>
    `;
}

// HELPER: Fetches the Markdown file
function fetchPostContent(filename, isFeedView) {
    var targetId = "content-" + filename;
    
    // '?t=' + Date.now() bypasses the cache to ensure fresh content
    fetch(postFolder + filename + ".md?t=" + Date.now())
        .then(response => {
            if (!response.ok) throw new Error("File not found");
            return response.text();
        })
        .then(text => {
            var finalHTML = "";
            
            // WE DEFINING THE SEPARATOR HERE
            // If this looks empty again, type: "<" + "!--more--" + ">"
            var separator = "<!--more-->"; 

            // --- THE CUT-OFF LOGIC ---
            
            // SCENARIO A: We are on the Feed AND (it has a manual cut-off OR it's too long)
            var MAX_CHARS = 1000; // Auto-truncate after this many characters
            
            if (isFeedView && (text.includes(separator) || text.length > MAX_CHARS)) {
                
                var previewText = "";

                if (text.includes(separator)) {
                    // Method 1: Manual cut-off (takes priority)
                    previewText = text.split(separator)[0];
                } else {
                    // Method 2: Auto-cut-off
                    // Cut at MAX_CHARS, then back up to the last space so we don't cut a word in half
                    previewText = text.substring(0, MAX_CHARS);
                    if (previewText.lastIndexOf(" ") > 0) {
                        previewText = previewText.substring(0, previewText.lastIndexOf(" "));
                    }
                    previewText += " ...";
                }
                
                // Render the preview
                if (typeof marked !== 'undefined') {
                    finalHTML = marked.parse(previewText);
                } else {
                    finalHTML = previewText;
                }

                // Add the button
                finalHTML += `<p><a href="?post=${filename}" class="read-more-btn">Read More →</a></p>`;

            } else {
                // SCENARIO B: We are on the Single Post page OR it's a short post
                
                // 1. Remove the separator so it doesn't clutter the raw text
                var cleanText = text.replace(separator, ""); 

                // 2. Render the clean text
                if (typeof marked !== 'undefined') {
                    finalHTML = marked.parse(cleanText);
                } else {
                    finalHTML = cleanText;
                }
            }

            document.getElementById(targetId).innerHTML = finalHTML;
        })
        .catch(error => {
            document.getElementById(targetId).innerHTML = "<p style='color:red'>Error loading " + filename + ".md</p>";
        });
}

// HELPER: Injects anonymous comments dynamically
function injectComments(term) {
    var container = document.getElementById("blog-feed");
    if (!container) return;

    var commentsRoot = document.createElement("section");
    commentsRoot.className = "comments-root";
    commentsRoot.innerHTML = `
        <h3 class="comments-title">Comments</h3>
        <p class="comments-note"><em>Anonymous comments are welcome. Comments may be moderated for spam.</em></p>

        <form id="comment-form" class="comment-form">
            <div class="comment-row">
                <label for="comment-name">Name</label>
                <input id="comment-name" name="name" type="text" maxlength="60" required />
            </div>
            <div class="comment-row">
                <label for="comment-website">Website (optional)</label>
                <input id="comment-website" name="website" type="url" maxlength="120" />
            </div>
            <div style="display:none;">
                <label for="comment-hp">Leave this empty</label>
                <input id="comment-hp" name="hp" type="text" autocomplete="off" />
            </div>
            <div class="comment-row">
                <label for="comment-text">Comment</label>
                <textarea id="comment-text" name="comment" rows="5" maxlength="3000" required></textarea>
            </div>
            <button id="comment-submit" type="submit">Post Comment</button>
            <p id="comment-form-status" class="comment-status" aria-live="polite"></p>
        </form>

        <div id="comment-list" class="comment-list">
            <p class="comment-status">Loading comments...</p>
        </div>
    `;
    container.appendChild(commentsRoot);

    var form = document.getElementById("comment-form");
    var statusEl = document.getElementById("comment-form-status");
    var submitBtn = document.getElementById("comment-submit");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var payload = {
            action: "addComment",
            post: term,
            name: document.getElementById("comment-name").value.trim(),
            website: document.getElementById("comment-website").value.trim(),
            comment: document.getElementById("comment-text").value.trim(),
            hp: document.getElementById("comment-hp").value.trim()
        };

        if (!payload.name || !payload.comment) {
            statusEl.textContent = "Please add a name and comment.";
            return;
        }

        submitBtn.disabled = true;
        statusEl.textContent = "Sending...";

        submitComment(payload)
            .then(function() {
                statusEl.textContent = "Thanks. Your comment was submitted.";
                form.reset();
                return loadComments(term);
            })
            .catch(function() {
                statusEl.textContent = "Could not submit comment right now. Please try again.";
            })
            .finally(function() {
                submitBtn.disabled = false;
            });
    });

    loadComments(term).catch(function() {
        injectGiscusFallback(term);
    });
}

function injectGiscusFallback(term) {
    if (COMMENTS_FALLBACK_INJECTED) return;
    COMMENTS_FALLBACK_INJECTED = true;

    var list = document.getElementById("comment-list");
    if (list) {
        list.innerHTML = `<p class="comment-status">Comments API unavailable right now. Falling back to GitHub comments.</p>`;
    }

    var container = document.getElementById("blog-feed");
    if (!container) return;

    var fallbackBox = document.createElement("div");
    fallbackBox.className = "giscus";
    container.appendChild(fallbackBox);

    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "backyardbugs/sleepyhead-comments");
    script.setAttribute("data-repo-id", "R_kgDOQq0_1w");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQq0_184ClU_l");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", term);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "dark");
    script.setAttribute("data-lang", "en");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    container.appendChild(script);
}

function jsonpRequest(url, timeoutMs) {
    timeoutMs = timeoutMs || 8000;
    return new Promise(function(resolve, reject) {
        var callbackName = "__comments_cb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        var fullUrl = url + (url.includes("?") ? "&" : "?") + "callback=" + callbackName;
        var script = document.createElement("script");
        var done = false;
        var timer = setTimeout(cleanupAndReject, timeoutMs);

        function cleanup() {
            if (script && script.parentNode) script.parentNode.removeChild(script);
            try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
            clearTimeout(timer);
        }

        function cleanupAndReject() {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error("JSONP timeout"));
        }

        window[callbackName] = function(data) {
            if (done) return;
            done = true;
            cleanup();
            resolve(data);
        };

        script.src = fullUrl;
        script.async = true;
        script.onerror = cleanupAndReject;
        document.body.appendChild(script);
    });
}

function submitComment(payload) {
    var query = new URLSearchParams(payload).toString();
    return jsonpRequest(COMMENTS_API_URL + "?" + query).then(function(data) {
        if (data && data.ok === false) {
            throw new Error(data.error || "Submission failed");
        }
        return data;
    });
}

function normalizeComments(data, slug) {
    if (data && Array.isArray(data.comments)) {
        return data.comments;
    }

    if (!Array.isArray(data)) return [];

    // Backward-compatible parser: if endpoint returns uplink rows,
    // we interpret rows with type=comment and note beginning with `${slug}|name`.
    return data
        .filter(function(row) {
            return row && String(row.type || "").toLowerCase() === "comment";
        })
        .map(function(row) {
            var parts = String(row.note || "").split("|");
            var rowSlug = parts[0] || "";
            var rowName = parts[1] || "Anonymous";
            if (rowSlug !== slug) return null;
            return {
                id: row.date || Math.random().toString(36).slice(2),
                name: rowName,
                website: "",
                comment: row.val || "",
                comment_html: "",
                created_at: row.date || ""
            };
        })
        .filter(Boolean);
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDate(dateInput) {
    var d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function loadComments(slug) {
    var list = document.getElementById("comment-list");
    if (!list) return Promise.resolve();

    list.innerHTML = `<p class="comment-status">Loading comments...</p>`;

    var query = new URLSearchParams({ action: "getComments", post: slug, t: Date.now().toString() }).toString();
    return jsonpRequest(COMMENTS_API_URL + "?" + query)
        .then(function(data) {
            var comments = normalizeComments(data, slug);
            if (!comments.length) {
                list.innerHTML = `<p class="comment-status">No comments yet. Be the first.</p>`;
                return;
            }

            var html = comments.map(function(c) {
                var safeName = escapeHtml(c.name || "Anonymous");
                var safeWebsite = escapeHtml(c.website || "");
                var safeDate = escapeHtml(formatDate(c.created_at || c.date || ""));
                var body = c.comment_html
                    ? c.comment_html
                    : escapeHtml(c.comment || "").replace(/\n/g, "<br>");
                var linkedName = safeWebsite
                    ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer">${safeName}</a>`
                    : safeName;

                return `
                    <article class="comment-item">
                        <div class="comment-meta">${linkedName}${safeDate ? ` <span>· ${safeDate}</span>` : ""}</div>
                        <div class="comment-body">${body}</div>
                    </article>
                `;
            }).join("");

            list.innerHTML = html;
        })
        .catch(function(error) {
            list.innerHTML = `<p class="comment-status">Comments are temporarily unavailable.</p>`;
            return Promise.reject(error);
        });
}

// Check if the page is already loaded. If yes, run immediately.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadBlogFeed();
} else {
    // Otherwise, wait for the event
    window.onload = loadBlogFeed;
}