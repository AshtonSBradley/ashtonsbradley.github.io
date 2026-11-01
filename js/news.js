function classifyNewsImages(imageSelector, itemSelector, landscapeClass) {
  document.querySelectorAll(imageSelector).forEach((image) => {
    const setOrientation = () => {
      image.closest(itemSelector).classList.toggle(
        landscapeClass,
        image.naturalWidth > image.naturalHeight
      );
    };

    if (image.complete) {
      setOrientation();
    } else {
      image.addEventListener('load', setOrientation, { once: true });
    }
  });
}

classifyNewsImages('.news-sidebar-image', '.news-sidebar-item', 'news-sidebar-item--landscape');
classifyNewsImages('.news-archive-image', '.news-archive-item', 'news-archive-item--landscape');
