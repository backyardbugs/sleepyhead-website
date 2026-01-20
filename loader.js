/* LOADER.JS - Injects the shared sidebar & Micro-blog */

fetch('sidebar.html')
.then(response => response.text())
.then(data => {
    document.getElementById('sidebar-container').innerHTML = data;
    highlightCurrentPage();
    loadStatus(); 
    loadNowPlaying(); // New function for the Status Box
});

function highlightCurrentPage() {
    var current = window.location.pathname.split("/").pop();
    if (current === "") current = "index.html";
    
    var links = document.querySelectorAll('nav a');
    links.forEach(link => {
        var href = link.getAttribute('href');
        if (href === current) {
            link.style.color = "white";
            link.style.borderBottom = "1px solid white";
        }
    });
}

/* --- MICRO-BLOG LOGIC (FADED SYSTEM LOG) --- */
function loadStatus() {
    fetch('posts/status.txt?v=' + Date.now())
    .then(response => {
        if (!response.ok) throw new Error("No status file found");
        return response.text();
    })
    .then(text => {
        var lines = text.split('\n');
        var contentLines = lines.filter(line => line.trim() !== "");
        
        if (contentLines.length > 0) {
            var html = "";
            var limit = 3; 
            
            for (var i = 0; i < Math.min(contentLines.length, limit); i++) {
                
                var parts = contentLines[i].split('|');
                
                if (parts.length >= 2) {
                    var date = parts[0].trim();
                    var msg = parts.slice(1).join('|').trim();
                    
                    html += `
                        <div style="margin-bottom: 12px; font-family: var(--font-head);">
                            
                            <div style="margin-bottom: 2px;">
                                <span style="color: var(--accent-color); font-size: 0.7rem; opacity: 0.6;">></span>
                                <span style="
                                    color: #444; /* Very dark grey - recedes into background */
                                    font-size: 0.65rem; 
                                    text-transform: uppercase; 
                                    letter-spacing: 1px;
                                ">${date}</span>
                            </div>

                            <div style="
                                color: #777; /* The Hierarchy Fix: Dark Grey Text */
                                font-size: 0.75rem; 
                                line-height: 1.3;
                                padding-left: 12px; 
                                border-left: 1px solid #222; /* Almost invisible guide line */
                            ">
                                ${msg}
                            </div>
                        </div>
                    `;
                }
            }
            
            var box = document.getElementById('status-box');
            if (box) {
                // Added opacity: 0.8 to the whole container to push it back further
                box.innerHTML = `<div style="margin-top: 30px; margin-bottom: 40px;">${html}</div>`;
                box.style.display = "block";
            }
        }
    })
    .catch(e => {
        console.log("No status update found."); 
    });
}

function loadNowPlaying() {
    fetch('status.json?v=' + Date.now())
    .then(response => {
        if (!response.ok) throw new Error("status.json not found");
        return response.json();
    })
    .then(data => {
        var container = document.getElementById('status-container');
        if (!container) return;

        var html = "";

        // Helper to generate section
        function buildSection(title, items) {
            if (!items || items.length === 0) return "";
            var sectionHTML = `<p><strong>${title}:</strong><br>`;
            items.forEach(item => {
                sectionHTML += `- ${item}<br>`;
            });
            sectionHTML += `</p>`;
            return sectionHTML;
        }

        html += buildSection("READING", data.reading);
        html += buildSection("PLAYING", data.playing);
        html += buildSection("WATCHING", data.watching);

        if (data.current_mood) {
            html += `<p><strong>MOOD:</strong> ${data.current_mood}</p>`;
        }

        container.innerHTML = html;
    })
    .catch(err => console.log("Error loading media status:", err));
}
}