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

/* --- MICRO-BLOG LOGIC (Powered by Captain's Log & Cloud Uplink) --- */
const UPLINK_URL = 'https://script.google.com/macros/s/AKfycbxWvLNwivMBlKL9ODO72RbqKemf-qAAFSIjVK9lNvllPHpZDGnSyEeECQ4r7sADquXr8Q/exec';

function loadStatus() {
    // 1. Determine the file to load (Current Year)
    var year = new Date().getFullYear();
    var scriptPath = "data/" + year + ".js";

    // 2. Check if it's already loaded (e.g., we are on year.html)
    // The data file defines a variable like 'history2026'
    var dataVar = "history" + year;

    if (window[dataVar]) {
        fetchUplink(year, dataVar); // Fetch fresh data to merge
        renderStatusBox(window[dataVar]);
    } else {
        // 3. If not loaded, fetch it dynamically
        var script = document.createElement('script');
        script.src = scriptPath + "?v=" + Date.now();
        script.onload = function() {
            if (window[dataVar]) {
                fetchUplink(year, dataVar); // Fetch fresh data to merge
                renderStatusBox(window[dataVar]);
            }
        };
        // Handle 404s or errors silently
        script.onerror = function() { console.log("No log data found for " + year); };
        document.body.appendChild(script);
    }
}

function fetchUplink(year, dataVar) {
    // DEBUG: Visual indicator
    const dbg = document.createElement('div');
    dbg.style.padding = "5px"; dbg.style.fontSize = "10px"; dbg.style.color = "red";
    dbg.id = "uplink-debug";
    dbg.innerText = "Connecting to Uplink...";
    const sb = document.getElementById('sidebar-container');
    if (sb) sb.appendChild(dbg);

    fetch(UPLINK_URL)
        .then(res => res.json())
        .then(rows => {
            if (dbg) dbg.innerText = "Uplink: " + (rows ? rows.length : 0) + " items.";
            if (!rows || rows.length === 0) return;

            // Map Sheet Data (Objects) to Site Data (Arrays)
            // Sheet: { date: "...", type: "...", val: "...", note: "..." }
            // Site:  [ "YYYY-MM-DD", Words(int), Gym(bool), "Note" ]
            const newEntries = rows.map(r => {
                // 1. Date
                let d = new Date(r.date);
                let dateStr = !isNaN(d) ? d.toISOString().split('T')[0] : r.date;

                // 2. Map Types
                let type = (r.type || "").toLowerCase();
                let content = r.val || ""; 
                let tag = r.note || "";

                let words = 0;
                let gym = false;
                let finalNote = "";

                if (type === 'writing') {
                    words = parseInt(content) || 0;
                    finalNote = tag; // For writing, the note/tag describes the project
                } else if (type === 'gym') {
                    gym = true;
                    // For gym, the content (e.g. "Chest Day") is the note
                    finalNote = content; 
                } else {
                    // Log, Movie, Music, Reading
                    // The main content is the log. We can append tag if it exists.
                    // If simple log, content is the note.
                    finalNote = content;
                    if (tag) finalNote += " #" + tag; 
                }

                return [dateStr, words, gym, finalNote];
            });

            // Merge & Update
            if (window[dataVar]) {
                window[dataVar] = window[dataVar].concat(newEntries);
                
                // Re-sort by date
                window[dataVar].sort((a, b) => new Date(a[0]) - new Date(b[0]));
                
                // Re-render sidebar
                renderStatusBox(window[dataVar]);

                // Update Grid if present (year.html)
                if (typeof generateGrid === 'function') {
                    generateGrid();
                }
            }
        })
        .catch(err => {
            console.log("Uplink silent fail", err);
            const dbg = document.getElementById('uplink-debug');
            if (dbg) dbg.innerText = "Uplink Error: " + err.message;
        });
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