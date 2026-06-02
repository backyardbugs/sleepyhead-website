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

window.PAGE_ACCENT_MAP = {
    'index.html': 'red',
    'year.html': 'orange',
    'microblog.html': 'orange',
    'music.html': 'yellow',
    'julep.html': 'yellow',
    'highpress.html': 'yellow',
    'demos.html': 'yellow',
    'engineering.html': 'yellow',
    'engineering-inquiry.html': 'yellow',
    'library.html': 'green',
    'visualwork.html': 'blue',
    'hammercookie.html': 'indigo',
    'archive.html': 'violet',
    'not_found.html': 'red'
};

(function applyPageAccent() {
    var current = window.location.pathname.split('/').pop();
    if (!current) current = 'index.html';

    var key = window.PAGE_ACCENT_MAP[current] || 'green';
    var color = window.RAINBOW_ACCENTS[key];

    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.setAttribute('data-accent', key);
})();
