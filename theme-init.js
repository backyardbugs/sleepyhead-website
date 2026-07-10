/** Early theme apply — load in <head> before paint when possible */
(function () {
    var KEY = 'theme';

    function current() {
        try {
            return localStorage.getItem(KEY) || 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function apply(theme) {
        var html = document.documentElement;
        var light = theme === 'light';
        html.classList.toggle('theme-light', light);
        html.setAttribute('data-theme', light ? 'light' : 'dark');
    }

    function syncToggle() {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        var light = document.documentElement.classList.contains('theme-light');
        btn.setAttribute('aria-pressed', light ? 'true' : 'false');
        btn.textContent = light ? 'Dark mode' : 'Light mode';
    }

    function setTheme(theme) {
        theme = theme === 'light' ? 'light' : 'dark';
        try {
            localStorage.setItem(KEY, theme);
        } catch (e) {}
        apply(theme);
        if (typeof window.applyPageAccent === 'function') window.applyPageAccent();
        if (typeof window.paintSidebarNav === 'function') window.paintSidebarNav();
        syncToggle();
    }

    window.getTheme = current;
    window.setTheme = setTheme;
    window.toggleTheme = function () {
        setTheme(current() === 'light' ? 'dark' : 'light');
    };
    window.syncThemeToggle = syncToggle;

    apply(current());
})();
