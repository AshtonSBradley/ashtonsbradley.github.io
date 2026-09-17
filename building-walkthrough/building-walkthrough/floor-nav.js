// Request current room HTML when switching floors, including from a restored tab.
(() => {
  const links = [...document.querySelectorAll('.floor-selector a')];
  function refreshLink(link) {
    const url = new URL(link.href, window.location.href);
    url.searchParams.set('v', String(Date.now()));
    link.href = url.href;
  }
  const refreshMenu = () => links.forEach(refreshLink);
  refreshMenu();
  window.addEventListener('pageshow', refreshMenu);
  for (const link of links) link.addEventListener('click', () => refreshLink(link));
})();
