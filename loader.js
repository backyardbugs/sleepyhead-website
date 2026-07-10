/* LOADER.JS - Injects the shared sidebar & Micro-blog */

function toLocalISODate(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var day = String(d.getDate());
    if (day.length < 2) day = '0' + day;
    return y + '-' + m + '-' + day;
}

var SIDEBAR_BIO = 'Fiction MFA. Musician. Dweeb. Based in FL.';
var SIDEBAR_VERSION = 'theme-default-light-2026-07';

fetch('sidebar.html?v=' + SIDEBAR_VERSION)
.then(response => response.text())
.then(data => {
    document.getElementById('sidebar-container').innerHTML = data;
    var bioEl = document.querySelector('#sidebar-container .bio');
    if (bioEl) bioEl.textContent = SIDEBAR_BIO;
    highlightCurrentPage();
    if (typeof window.applyPageAccent === 'function') window.applyPageAccent();
    if (typeof window.paintSidebarNav === 'function') window.paintSidebarNav();
    wireThemeToggle();
    loadStatus(); 
    loadNowPlaying(); // New function for the Status Box
});

function wireThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (typeof window.syncThemeToggle === 'function') window.syncThemeToggle();
    btn.addEventListener('click', function () {
        if (typeof window.toggleTheme === 'function') window.toggleTheme();
        highlightCurrentPage();
    });
}

function highlightCurrentPage() {
    var current = typeof window.getCurrentPage === 'function'
        ? window.getCurrentPage()
        : (window.location.pathname.split('/').pop() || 'index.html');

    var root = document.getElementById('sidebar-container') || document.querySelector('aside');
    if (!root) return;

    root.querySelectorAll('nav a').forEach(function (link) {
        link.classList.remove('nav-active');
        var href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
        if (href === current) {
            link.classList.add('nav-active');
            var key = link.getAttribute('data-accent');
            if (key && window.RAINBOW_ACCENTS && window.RAINBOW_ACCENTS[key]) {
                link.style.setProperty('border-bottom-color', window.RAINBOW_ACCENTS[key], 'important');
            }
        } else {
            link.style.borderBottomColor = 'transparent';
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
    const sb = document.getElementById('sidebar-container');
    let dbg = document.getElementById('uplink-debug');
    if (!dbg && sb) {
        dbg = document.createElement('div');
        dbg.id = "uplink-debug";
        dbg.style.padding = "5px"; dbg.style.fontSize = "10px"; dbg.style.color = "orange";
        sb.appendChild(dbg);
    }
    if (dbg) dbg.innerText = "Connecting (JSONP)...";

    // 1. Define the Global Callback (Must be on 'window' to be reachable)
    window.processUplinkData = function(rows) {
        if (dbg) { dbg.innerText = "Uplink: " + (rows ? rows.length : 0) + " items."; dbg.style.color = "green"; }
        
        if (!rows || rows.length === 0) return;

        // Map Sheet Data (Objects) to Site Data (Arrays)
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
                finalNote = tag; 
            } else if (type === 'gym') {
                gym = true;
                finalNote = content; 
            } else {
                finalNote = content;
                if (tag) finalNote += " #" + tag; 
            }

            return [dateStr, words, gym, finalNote];
        }).filter(entry => !isExcludedLogNote(entry[3]));

        // Merge & Update
        if (window[dataVar]) {
            window[dataVar] = window[dataVar].concat(newEntries);
            window[dataVar].sort((a, b) => new Date(a[0]) - new Date(b[0]));
            renderStatusBox(window[dataVar]); // Re-render sidebar
            if (typeof generateGrid === 'function') generateGrid(); // Re-render grid
            const uplinkYear = parseInt(String(dataVar).replace('history', ''), 10);
            if (typeof renderMicroblogArchive === 'function' && !isNaN(uplinkYear)) {
                renderMicroblogArchive(uplinkYear);
            }
        }
    };

    // 2. Inject Script Tag (JSONP method bypasses CORS)
    const script = document.createElement('script');
    const url = UPLINK_URL + (UPLINK_URL.includes('?') ? '&' : '?') + 'callback=processUplinkData&t=' + Date.now();
    script.src = url;
    script.onerror = function() {
        if (dbg) { dbg.innerText = "Uplink: Script Error."; dbg.style.color = "red"; }
    };
    document.body.appendChild(script);
}

/* --- MICROBLOG HELPERS (sidebar + archive; matches Captain's Log dog-ear rules) --- */

// Notes removed from microblog but may still exist in Cloud Uplink until cleared in the Sheet.
const EXCLUDED_LOG_NOTES = [
    /^start of 2026\.?$/i,
    /^i spent way too much time working on the website today\.?$/i
];

function isExcludedLogNote(text) {
    const n = (text || "").trim();
    if (!n) return false;
    return EXCLUDED_LOG_NOTES.some((rx) => rx.test(n));
}

function isGymOnlyNote(text) {
    const t = (text || "").trim();
    if (!t) return false;
    return /^Gym(\s*\([^)]+\))?\.?$/i.test(t);
}

function isMicroblogEntry(entry) {
    const note = (entry[3] || "").trim();
    if (!note || note.length <= 3) return false;
    if (isExcludedLogNote(note)) return false;
    if (entry[2] && isGymOnlyNote(note)) return false;
    return true;
}

function getMicroblogUpdates(historyData) {
    if (!historyData) return [];
    return historyData.filter(isMicroblogEntry);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatMicroblogDate(isoDate, includeYear) {
    const parts = isoDate.split("-");
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const label = `${day} ${monthNames[monthIndex]}`;
    return includeYear ? `${label} ${parts[0]}` : label;
}

function buildMicroblogItemHTML(item, options) {
    const opts = options || {};
    const dateStr = item[0];
    const note = item[3];
    const niceDate = formatMicroblogDate(dateStr, !!opts.includeYear);
    const bodyClass = opts.large ? "microblog-body microblog-body--large" : "microblog-body";

    return `
        <article class="microblog-item">
            <div class="microblog-meta">
                <span class="microblog-chevron">&gt;</span>
                <span class="microblog-date">${niceDate}</span>
            </div>
            <div class="${bodyClass}">${escapeHtml(note)}</div>
        </article>
    `;
}

function renderStatusBox(historyData) {
    // Microblog hidden for now (re-enable by restoring the previous body)
    var box = document.getElementById('status-box');
    if (box) box.style.display = 'none';
}

function renderMicroblogArchive(year) {
    const archive = document.getElementById("microblog-archive");
    if (!archive) return;
    archive.style.display = "none";
    return;

    const dataVar = "history" + year;
    const historyData = window[dataVar];
    if (!historyData) {
        archive.innerHTML = "<p class=\"microblog-empty\">No log data for this year.</p>";
        return;
    }

    const updates = getMicroblogUpdates(historyData)
        .slice()
        .sort((a, b) => b[0].localeCompare(a[0]));

    if (updates.length === 0) {
        archive.innerHTML = "<p class=\"microblog-empty\">No microblog entries for this year yet.</p>";
        return;
    }

    let html = "";
    updates.forEach(item => {
        html += buildMicroblogItemHTML(item, { includeYear: true, large: true });
    });
    archive.innerHTML = html;
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
            const today = toLocalISODate();
            
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