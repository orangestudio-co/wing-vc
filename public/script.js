// page-specific
const exact = {
  "/": homepage,
  "/about": aboutPage,
  "/companies": portfolioPage,
  "/content": insightsPage,
};

const prefixes = [["/people/", peopleCollectionPage]];

const path = window.location.pathname.replace(/\/$/, "") || "/";

// exact match first, then prefix match, then nothing
const prefixHit = prefixes.find(([p]) => path.startsWith(p));
(exact[path] || (prefixHit && prefixHit[1]) || (() => {}))();

function filterAdd() {
  const selectItem = document.querySelectorAll("[data-select='item']");
  selectItem.forEach((i) => {
    const select = i.querySelector("[data-select='field']");
    const option = i.querySelectorAll("[data-select='option']");

    option.forEach((o) => {
      select.appendChild(o);
    });
  });
}

// global — runs everywhere
{
  (() => {
    const nav = document.querySelector(".nav_wrap");
    if (!nav) return;

    let ticking = false;
    let filled = false;

    const update = () => {
      const shouldFill = window.scrollY > 20;
      if (shouldFill !== filled) {
        nav.classList.toggle("is-filled", shouldFill);
        filled = shouldFill;
      }
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );

    update();
  })();

  (() => {
    const navButton = document.querySelector("[data-nav-button]");
    const navLinks = document.querySelector(".nav_links");
    if (!navButton || !navLinks) return;

    const setNav = (open) => {
      navButton.dataset.navButton = open ? "open" : "closed";
      navLinks.classList.toggle("is-open", open);
    };

    setNav(false);
    navButton.addEventListener("click", () => {
      setNav(navButton.dataset.navButton !== "open");
    });
  })();

  (function () {
    const WORKER_URL = "https://wing-vc-newsletter-signup.wing-vc.workers.dev";

    function handleSuccess(form) {
      // 2. Reveal an existing element (by selector) instead of replacing
      const revealSel = form.dataset.osSuccessReveal;
      if (revealSel) {
        const el = document.querySelector(revealSel);
        if (el) el.style.display = "";
        if (form.dataset.osSuccessHideForm !== "false")
          form.style.display = "none";
        return;
      }
    }

    function handleError(form) {
      const revealSel = form.dataset.osErrorReveal;
      if (revealSel) {
        const el = document.querySelector(revealSel);
        if (el) el.style.display = "";
        return;
      }
      console.error("Newsletter signup failed");
    }

    document.querySelectorAll("[data-os-mailchimp-form]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) return form.reportValidity();

        try {
          const res = await fetch(WORKER_URL, {
            method: "POST",
            // Native FormData: picks up name="email" and the name="company_website"
            // honeypot input automatically, no per-field mapping needed.
            body: new FormData(form),
          });
          const data = await res.json();

          if (res.ok && data.success) {
            handleSuccess(form);
          } else {
            console.error("Mailchimp error:", data.error);
            handleError(form);
          }
        } catch (err) {
          console.error("Submission error:", err);
          handleError(form);
        }
      });
    });
  })();

  const quoteComponent = document.querySelectorAll("[data-slider='component']");

  quoteComponent.forEach((component) => {
    const perView = component.dataset.perView
      ? Number(component.dataset.perView)
      : undefined;
    const perViewMobile = component.dataset.perViewMobile
      ? Number(component.dataset.perViewMobile)
      : undefined;
    const gap = component.dataset.gap
      ? Number(component.dataset.gap)
      : undefined;

    const autoplay =
      component.dataset.autoplay === "true" ? { delay: 5000 } : false;

    const navContainer = component.closest("section");
    const nextEl = navContainer
      ? navContainer.querySelector('[data-slider="forwards"]')
      : null;
    const prevEl = navContainer
      ? navContainer.querySelector('[data-slider="backwards"]')
      : null;
    const progressEl = navContainer
      ? navContainer.querySelector('[data-slider="progress"]')
      : null;

    const totalSlides = component.querySelectorAll(".swiper-slide").length;

    const updateNavVisibility = (swiper) => {
      if (!navContainer) return;
      const currentPerView = swiper.params.slidesPerView;
      navContainer.style.display =
        typeof currentPerView === "number" && currentPerView >= totalSlides
          ? "none"
          : "";
    };

    const minProgress = 15;

    const updateProgress = (swiper, progress) => {
      if (!progressEl) return;
      progressEl.style.width = `${minProgress + progress * (100 - minProgress)}%`;
    };

    const swiper = new Swiper(component, {
      direction: "horizontal",
      loop: false,
      grabHand: true,
      slidesPerView: perViewMobile ?? 1.25,
      spaceBetween: gap ?? 16,
      navigation: {
        nextEl,
        prevEl,
        disabledClass: "is-disabled",
      },
      autoplay,
      breakpoints: {
        768: {
          slidesPerView: perView ?? 3.5,
        },
      },
      on: {
        init: updateNavVisibility,
        breakpoint: updateNavVisibility,
        progress: updateProgress,
      },
    });
  });
}

function homepage() {
  // Tabs Component
  {
    const components = document.querySelectorAll("[data-tabs='component']");

    components.forEach((c) => {
      const tab = Array.from(c.querySelectorAll("[data-tabs='item']"));
      const visual = Array.from(c.querySelectorAll("[data-tabs='visual'] > *"));

      const activate = (index) => {
        const targetVisual = visual[index]?.children.length
          ? visual[index]
          : visual[0];
        tab.forEach((el) => el.classList.remove("is-active"));
        visual.forEach((el) => el.classList.remove("is-active"));
        tab[index].classList.add("is-active");
        targetVisual.classList.add("is-active");
      };

      tab.forEach((t, index) => {
        t.addEventListener("mouseenter", () => activate(index));
        t.addEventListener("click", () => activate(index));
      });

      // Init
      activate(0);
    });
  }
}

function aboutPage() {
  const component = document.querySelector("[data-people='container']");
  if (!component) return;
  const items = component.querySelectorAll("[data-people='item']");
  const group = component.querySelector("[data-people='group']");
  if (!group) return;

  const marginCycle = [0, 2.5, 5, 2.5];
  items.forEach((i, idx) => {
    i.style.setProperty(
      "--margin-top",
      `${marginCycle[idx % marginCycle.length]}rem`,
    );
  });

  for (let n = 0; n < 2; n++) {
    component.appendChild(group.cloneNode(true));
  }

  component.querySelectorAll("[data-people='group']").forEach((g) => {
    g.style.animationPlayState = "running";
  });
}

function peopleCollectionPage() {
  const readMore = document.querySelector(".g-read-more_section");

  if (readMore?.querySelector(".w-dyn-empty")) {
    readMore.remove();
  }
}

function portfolioPage() {
  filterAdd();

  const filterButton = document.querySelector("[data-filters='show']");
  const filters = document.querySelector(".c-filters_form_wrap");
  if (filterButton && filters) {
    filterButton.addEventListener("click", () => {
      filterButton.style.display = "none";
      filters.style.display = "block";
    });
  }
}

function insightsPage() {
  filterAdd();
}
