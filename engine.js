/* --- engine.js --- */

var postFolder = "./posts/";

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
            
            // SCENARIO A: We are on the Feed AND the text has the cut-off
            if (isFeedView && text.includes(separator)) {
                
                // 1. Split correctly by the separator
                var parts = text.split(separator); 
                
                // 2. Render only the first half
                if (typeof marked !== 'undefined') {
                    finalHTML = marked.parse(parts[0]);
                } else {
                    finalHTML = parts[0];
                }

                // 3. Add the button
                finalHTML += `<p><a href="?post=${filename}" class="read-more-btn">Read More →</a></p>`;

            } else {
                // SCENARIO B: We are on the Single Post page (OR there is no cut-off)
                
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

// HELPER: Injects Giscus comments dynamically
function injectComments(term) {
    var container = document.getElementById("blog-feed");
    
    // 1. THE DISCLAIMER (The Friendly Nudge)
    var disclaimer = document.createElement("p");
    disclaimer.innerHTML = "<em>(Note: To leave a comment, you must log in with GitHub. I promise it takes like two seconds to make an account. I'm sorry, mom, but I know you can do it!)</em>";
    disclaimer.style.textAlign = "center";
    disclaimer.style.color = "#666";
    disclaimer.style.fontSize = "0.85rem";
    disclaimer.style.marginTop = "60px";
    disclaimer.style.marginBottom = "20px";
    disclaimer.style.fontFamily = "var(--font-head)"; // Courier Prime
    container.appendChild(disclaimer);

    // 2. THE COMMENT BOX CONTAINER
    var commentBox = document.createElement("div");
    commentBox.className = "giscus";
    container.appendChild(commentBox);

    // 3. THE SCRIPT
    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    
    // --- YOUR SETTINGS ---
    script.setAttribute("data-repo", "backyardbugs/sleepyhead-comments"); 
    script.setAttribute("data-repo-id", "R_kgDOQq0_1w");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQq0_184ClU_l"); 
    
    // --- STANDARD SETTINGS ---
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

// Check if the page is already loaded. If yes, run immediately.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadBlogFeed();
} else {
    // Otherwise, wait for the event
    window.onload = loadBlogFeed;
}