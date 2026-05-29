/** MUJI grid preview — set to false to revert instantly */
window.MUJI_GRID_ENABLED = true;

(function () {
    if (!window.MUJI_GRID_ENABLED) return;
    try {
        if (localStorage.getItem('muji-grid') === 'off') return;
        if (new URLSearchParams(window.location.search).get('grid') === 'off') return;
    } catch (e) {}
    document.documentElement.classList.add('muji-grid');
})();
