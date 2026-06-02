/** Per-page muted rainbow accents — maps sidebar pages to ROYGBIV */
window.RAINBOW_ACCENTS = {
    red: '#BF8484',
    orange: '#BF9684',
    yellow: '#BFAF84',
    green: '#7DB87D',
    blue: '#849ABF',
    indigo: '#9084BF',
    violet: '#A884BF'
};

/** Primary sidebar pages → accent key */
window.PAGE_ACCENT_MAP = {
    'index.html': 'red',
    'year.html': 'orange',
    'microblog.html': 'orange',
    'music.html': 'yellow',
    'library.html': 'green',
    'visualwork.html': 'blue',
    'hammercookie.html': 'indigo',
    'archive.html': 'violet',
    'not_found.html': 'red'
};

/** Subpages inherit their section’s accent */
window.PAGE_ACCENT_INHERIT = {
    'julep.html': 'music.html',
    'highpress.html': 'music.html',
    'demos.html': 'music.html',
    'engineering.html': 'music.html',
    'engineering-inquiry.html': 'music.html'
};

window.applyPageAccent = function applyPageAccent() {
    var current = window.location.pathname.split('/').pop();
    if (!current) current = 'index.html';

    var inheritFrom = window.PAGE_ACCENT_INHERIT[current];
    var key = inheritFrom
        ? window.PAGE_ACCENT_MAP[inheritFrom]
        : window.PAGE_ACCENT_MAP[current];
    if (!key) key = 'green';

    var color = window.RAINBOW_ACCENTS[key];
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.setAttribute('data-accent', key);
};

window.applyPageAccent();
