document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const darkModeIconContainer = document.getElementById('darkModeIconContainer');

    // Check if dark mode is stored in localStorage, or use system preference
    const isDarkModeStored = localStorage.getItem('darkMode');
    const isLightModePreferred = window.matchMedia('(prefers-color-scheme: light)').matches;


    // Default to dark mode unless the user explicitly prefers light mode
    if (isLightModePreferred) {
        updateDarkModeIcon('sun');
    } else {
        body.classList.add('dark-mode');
        updateDarkModeIcon('moon');   
    }

    darkModeToggle.addEventListener('click', function () {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        updateDarkModeIcon(isDarkMode ? 'moon' : 'sun');
        localStorage.setItem('darkMode', isDarkMode.toString());
    });

    function updateDarkModeIcon(icon) {
        darkModeIconContainer.innerHTML = getIconSvgContent(icon);
    }

    function getIconSvgContent(icon) {
        return icon === 'moon'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="currentColor" fill-rule="evenodd" d="M10 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m4 8a4 4 0 1 1-8 0a4 4 0 0 1 8 0m-.464 4.95l.707.707a1 1 0 0 0 1.414-1.414l-.707-.707a1 1 0 0 0-1.414 1.414m2.12-10.607a1 1 0 0 1 0 1.414l-.706.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0M17 11a1 1 0 1 0 0-2h-1a1 1 0 1 0 0 2zm-7 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1M5.05 6.464A1 1 0 1 0 6.465 5.05l-.708-.707a1 1 0 0 0-1.414 1.414zm1.414 8.486l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 1.414M4 11a1 1 0 1 0 0-2H3a1 1 0 0 0 0 2z" clip-rule="evenodd"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="currentColor" d="M17.293 13.293A8 8 0 0 1 6.707 2.707a8.001 8.001 0 1 0 10.586 10.586"/></svg>';
    }
});
