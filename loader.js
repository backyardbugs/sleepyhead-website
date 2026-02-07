/* LOADER.JS - Injects the shared sidebar & Micro-blog */

fetch('sidebar.html?v=' + Date.now())
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

/* --- MICRO-BLOG LOGIC (Powered by Captain's Log) --- */
function loadStatus() {
    // 1. Determine the file to load (Current Year)
    var year = new Date().getFullYear();
    var scriptPath = "data/" + year + ".js";

    // 2. Check if it's already loaded (e.g., we are on year.html)
    // The data file defines a variable like 'history2026'
    var dataVar = "history" + year;

    if (window[dataVar]) {
        renderStatusBox(window[dataVar]);
    } else {
        // 3. If not loaded, fetch it dynamically
        var script = document.createElement('script');
        script.src = scriptPath + "?v=" + Date.now();
        script.onload = function() {
            if (window[dataVar]) {
                renderStatusBox(window[dataVar]);
            }
        };
        // Handle 404s or errors silently
        script.onerror = function() { console.log("No log data found for " + year); };
        document.body.appendChild(script);
    }
}

function renderStatusBox(historyData) {
    if (!historyData || historyData.length === 0) return;

    // Filter for entries that have a "Note" (index 3)
    // AND filter out boring generic logs like just "Gym" (length <= 3)
    var updates = historyData.filter(entry => {
        var note = entry[3];
        return note && note.length > 3; 
    });

    // Get the last 3 interesting updates
    var recent = updates.slice(-3).reverse();

    if (recent.length > 0) {
        var html = "";
        
        recent.forEach(item => {
            var dateStr = item[0]; // "2026-02-06"
            var note = item[3];

            // Fix Date Parsing (handle timezones safely by splitting string)
            // "2026-02-06" -> Parts [2026, 02, 06]
            var parts = dateStr.split("-");
            var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            var monthIndex = parseInt(parts[1]) - 1;
            var day = parts[2];
            var niceDate = `${day} ${monthNames[monthIndex]}`;

            html += `
                <div style="margin-bottom: 12px; font-family: var(--font-head);">
                    
                    <div style="margin-bottom: 2px;">
                        <span style="color: var(--accent-color); font-size: 0.7rem; opacity: 0.6;">></span>
                        <span style="
                            color: #444; /* Very dark grey - recedes into background */
                            font-size: 0.65rem; 
                            text-transform: uppercase; 
                            letter-spacing: 1px;
                        ">${niceDate}</span>
                    </div>

                    <div style="
                        color: #777; /* The Hierarchy Fix: Dark Grey Text */
                        font-size: 0.75rem; 
                        line-height: 1.3;
                        padding-left: 12px; 
                        border-left: 1px solid #222; /* Almost invisible guide line */
                    ">
                        ${note}
                    </div>
                </div>
            `;
        });
        
        var box = document.getElementById('status-box');
        if (box) {
            box.innerHTML = `<div style="margin-top: 30px; margin-bottom: 40px;">${html}</div>`;
            box.style.display = "block";
        }
    }
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
            html += '<h3 class="shows-header">Upcoming</h3>';
            if (upcoming.length > 0) {
                html += '<ul class="show-list">';
                upcoming.forEach(show => {
                    html += createShowItem(show);
                });
                html += '</ul>';
            } else {
                 html += '<p class="no-shows">No upcoming shows.</p>';
            }

            // Past Section
            if (showPast) {
                 html += '<h3 class="shows-header history">History</h3>';
                 if (past.length > 0) {
                    html += '<ul class="show-list history-list">';
                    past.forEach(show => {
                        html += createShowItem(show);
                    });
                    html += '</ul>';
                 } else {
                     html += '<p class="no-shows">No past shows found.</p>';
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
            <span class="show-band">${show.band}</span>
            <span class="show-date">${dateStr}${yearStr}</span>
            <span class="show-venue">${show.venue} <span class="show-location">/ ${show.location}</span></span>
        </li>
    `;
}