/** Per-page muted rainbow accents */
window.RAINBOW_ACCENTS = {
    red: '#BF8484',
    orange: '#BF9684',
    yellow: '#BFAF84',
    green: '#7DB87D',
    blue: '#849ABF',
    indigo: '#9084BF',
    violet: '#A884BF'
};

/** Sidebar href → accent key (each link keeps its own color) */
window.NAV_ACCENT_BY_HREF = {
    'home.html': 'red',
    'year.html': 'orange',
    'music.html': 'yellow',
    'library.html': 'green',
    'visualwork.html': 'blue',
    'hammercookie.html': 'indigo',
    'archive.html': 'violet'
};

window.PAGE_ACCENT_MAP = {
    'home.html': 'red',
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

window.PAGE_ACCENT_INHERIT = {
    'julep.html': 'music.html',
    'highpress.html': 'music.html',
    'demos.html': 'music.html',
    'engineering.html': 'music.html',
    'engineering-inquiry.html': 'music.html'
};

window.ACCENT_CLASS_PREFIX = 'accent-';

window.getCurrentPage = function getCurrentPage() {
    var path = window.location.pathname || '';
    var page = path.split('/').filter(Boolean).pop() || '';

    if (!page) return 'index.html';

    page = decodeURIComponent(page).toLowerCase();
    if (page === 'home' || page === 'home.html') return 'home.html';
    if (page === 'index' || page === 'index.html') return 'index.html';
    if (page.indexOf('.') === -1) page += '.html';

    return page;
};

window.resolvePageAccentKey = function resolvePageAccentKey(page) {
    if (window.PAGE_ACCENT_MAP[page]) return window.PAGE_ACCENT_MAP[page];

    var inheritFrom = window.PAGE_ACCENT_INHERIT[page];
    if (inheritFrom && window.PAGE_ACCENT_MAP[inheritFrom]) {
        return window.PAGE_ACCENT_MAP[inheritFrom];
    }

    var base = page.replace(/\.html$/i, '');
    var map = window.PAGE_ACCENT_MAP;
    for (var file in map) {
        if (file.replace(/\.html$/i, '') === base) return map[file];
    }

    return null;
};

window.paintSidebarNav = function paintSidebarNav() {
    var root = document.getElementById('sidebar-container') || document.querySelector('aside');
    if (!root) return;

    root.querySelectorAll('nav a').forEach(function (link) {
        var href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
        var key = window.NAV_ACCENT_BY_HREF[href];
        if (!key) return;

        var color = window.RAINBOW_ACCENTS[key];
        link.setAttribute('data-accent', key);
        link.style.setProperty('color', color, 'important');
        link.style.borderBottomColor = 'transparent';
    });
};

window.applyPageAccent = function applyPageAccent() {
    var page = window.getCurrentPage();
    var key = window.resolvePageAccentKey(page) || 'green';
    var color = window.RAINBOW_ACCENTS[key];

    var html = document.documentElement;
    var prefix = window.ACCENT_CLASS_PREFIX;

    Object.keys(window.RAINBOW_ACCENTS).forEach(function (name) {
        html.classList.remove(prefix + name);
    });

    html.classList.add(prefix + key);
    html.setAttribute('data-accent', key);
    html.style.setProperty('--accent-color', color);
};

window.applyPageAccent();
window.paintSidebarNav();
