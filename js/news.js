document.querySelectorAll('.news-sidebar-image').forEach((image) => {
  const setOrientation = () => {
    image.classList.toggle(
      'news-sidebar-image--landscape',
      image.naturalWidth > image.naturalHeight
    );
  };

  if (image.complete) {
    setOrientation();
  } else {
    image.addEventListener('load', setOrientation, { once: true });
  }
});
