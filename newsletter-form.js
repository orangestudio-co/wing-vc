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
