// Tabs Component
{
  const components = document.querySelectorAll("[data-tabs='component']");

  components.forEach((c) => {
    const tab = Array.from(c.querySelectorAll("[data-tabs='item']"));
    const visual = Array.from(c.querySelectorAll("[data-tabs='visual'] > *"));

    let currentIndex = 0;
    let autoplayTimer = null;

    const activate = (index) => {
      const targetVisual = visual[index]?.children.length
        ? visual[index]
        : visual[0];
      tab.forEach((el) => el.classList.remove("is-active"));
      visual.forEach((el) => el.classList.remove("is-active"));
      tab[index].classList.add("is-active");
      targetVisual.classList.add("is-active");
      currentIndex = index;
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      autoplayTimer = setInterval(() => {
        activate((currentIndex + 1) % tab.length);
      }, 5000);
    };

    tab.forEach((t, index) => {
      t.addEventListener("click", () => {
        stopAutoplay();
        activate(index);
      });
    });

    // Init
    activate(0);
    if (tab.length > 1) startAutoplay();
  });
}
