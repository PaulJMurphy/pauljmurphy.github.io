const header = document.querySelector('.top-nav');

if (header) {
  const toggleScrolledState = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 16);
  };

  toggleScrolledState();
  window.addEventListener('scroll', toggleScrolledState, { passive: true });
}
