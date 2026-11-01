document.querySelectorAll('.news-sidebar-image').forEach((image) => {
  const setOrientation = () => {
    image.closest('.news-sidebar-item').classList.toggle(
      'news-sidebar-item--landscape',
      image.naturalWidth > image.naturalHeight
    );
  };

  if (image.complete) {
    setOrientation();
  } else {
    image.addEventListener('load', setOrientation, { once: true });
  }
});
