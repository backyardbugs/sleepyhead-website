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

/* --- SHOWS LOADER --- */
/* Used by music.html sub-pages to render show lists from data/shows.json */
function loadShows(containerId, filterBand, showPast = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p>Loading shows...</p>';

    // FORCE CACHE BUST: Use a random number in addition to timestamp to be absolutely sure
    const cacheBuster = Math.random().toString(36).substring(7);
    fetch('data/shows.json?v=' + Date.now() + '&cb=' + cacheBuster)
        .then(response => {
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             return response.json();
        })
        .then(data => {
            let shows = data;

            
            // Filter by Band
            if (filterBand && filterBand !== 'ALL') {
                shows = shows.filter(show => show.band === filterBand);
            }

            // Split into Upcoming and Past
            // We calculate based on today
            const today = new Date().toISOString().split('T')[0];
            
            const upcoming = [];
            const past = [];

            shows.forEach(s => {
                if (s.date >= today) {
                    upcoming.push(s);
                } else {
                    past.push(s);
                }
            });

            // Sort: Upcoming (nearest first), Past (newest first)
            upcoming.sort((a,b) => a.date.localeCompare(b.date));
            past.sort((a,b) => b.date.localeCompare(a.date));

            let html = '';

            // Upcoming Section
            html += '<h3 style="font-family: var(--font-head); border-bottom:1px solid #444; padding-bottom:5px;">Upcoming</h3>';
            if (upcoming.length > 0) {
                html += '<ul class="show-list">';
                upcoming.forEach(show => {
                    html += createShowItem(show);
                });
                html += '</ul>';
            } else {
                 html += '<p style="color:#666; font-style:italic;">No upcoming shows.</p>';
            }

            // Past Section
            if (showPast) {
                 html += '<h3 style="font-family: var(--font-head); border-bottom:1px solid #444; padding-bottom:5px; margin-top:40px; color:#888;">History</h3>';
                 if (past.length > 0) {
                    html += '<ul class="show-list" style="opacity:0.7;">';
                    past.forEach(show => {
                        html += createShowItem(show);
                    });
                    html += '</ul>';
                 } else {
                     html += '<p style="color:#666; font-style:italic;">No past shows found.</p>';
                 }
            }

            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<p>Error loading shows.</p>';
        });
}

function createShowItem(show) {
    // Format Date: YYYY-MM-DD -> MMM DD
    // "2026-02-15"
    const parts = show.date.split('-');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const m = months[parseInt(parts[1]) - 1];
    const d = parts[2];
    const dateStr = `${m} ${d}`;
    // Year helpful? maybe if it's not current year.
    const currentYear = new Date().getFullYear().toString();
    const yearStr = (parts[0] !== currentYear) ? ` ${parts[0]}` : '';

    return `
        <li>
            <span class="show-band" style="width:100px; display:inline-block;">${show.band}</span>
            <span class="show-date" style="width:100px; display:inline-block;">${dateStr}${yearStr}</span>
            <span class="show-venue">${show.venue} <span class="show-location">/ ${show.location}</span></span>
        </li>
    `;
}