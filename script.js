(function () {
  "use strict";

  var config = window.SITE_CONFIG || {};
  var EMAIL = config.CONTACT_EMAIL || "";

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Direct email link
  var emailLink = document.getElementById("email-link");
  if (emailLink && EMAIL) {
    emailLink.href = "mailto:" + EMAIL;
    emailLink.textContent = EMAIL;
  }

  // Light/dark toggle. Follows the device setting until the visitor picks one;
  // their choice is saved in a cookie and wins from then on.
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var systemLight = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  var THEME_COLORS = { dark: "#000000", light: "#fafaf8" };

  function currentTheme() {
    var chosen = root.getAttribute("data-theme");
    if (chosen === "light" || chosen === "dark") return chosen;
    return systemLight && systemLight.matches ? "light" : "dark";
  }

  function syncThemeUI() {
    var theme = currentTheme();
    if (themeBtn) {
      themeBtn.setAttribute("data-current", theme);
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
    // With a saved choice, keep the mobile browser bar in step with it
    if (root.hasAttribute("data-theme")) {
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
        m.setAttribute("content", THEME_COLORS[theme]);
      });
    }
  }

  function saveTheme(theme) {
    var cookie = "theme=" + theme + "; path=/; max-age=31536000; SameSite=Lax";
    if (location.protocol === "https:") cookie += "; Secure";
    document.cookie = cookie;
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      saveTheme(next);
      syncThemeUI();
    });
  }
  if (systemLight) {
    if (systemLight.addEventListener) systemLight.addEventListener("change", syncThemeUI);
    else if (systemLight.addListener) systemLight.addListener(syncThemeUI);
  }
  syncThemeUI();

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
  }

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal-on-scroll animations
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  // Reviews: show published reviews from reviews.js, and the "Leave a review" form
  (function () {
    var section = document.getElementById("reviews");
    if (!section) return;
    var list = document.getElementById("review-list");
    var head = document.getElementById("reviews-head");
    var reviews = (window.SITE_REVIEWS || []).filter(function (r) { return r && r.quote && r.name; });

    if (reviews.length) {
      reviews.forEach(function (r) {
        var li = document.createElement("li");
        var fig = document.createElement("figure");
        fig.className = "review";
        var quote = document.createElement("blockquote");
        quote.textContent = r.quote;
        var cap = document.createElement("figcaption");
        cap.textContent = r.name;
        var byline = [r.role, r.business].filter(Boolean).join(", ");
        if (byline) {
          var role = document.createElement("span");
          role.className = "review-role";
          role.textContent = byline;
          cap.appendChild(role);
        }
        fig.appendChild(quote);
        fig.appendChild(cap);
        li.appendChild(fig);
        list.appendChild(li);
      });
      head.hidden = false;
      list.hidden = false;
    } else {
      section.classList.add("is-empty");
    }

    var rForm = document.getElementById("review-form");
    var rToggle = document.getElementById("review-toggle");

    function openForm() {
      rForm.hidden = false;
      rToggle.setAttribute("aria-expanded", "true");
      document.getElementById("r-name").focus({ preventScroll: true });
    }

    rToggle.addEventListener("click", function () {
      if (rForm.hidden) openForm();
      else { rForm.hidden = true; rToggle.setAttribute("aria-expanded", "false"); }
    });

    // dillonmakes.tech/#review scrolls to the review block (id="review") and opens the form.
    // The browser does the scrolling; this just opens the form, including when a
    // #review link is clicked while the address already ends in #review.
    // (Not when coming back from FormSubmit after sending: show the thank-you instead.)
    if (location.hash === "#review" && !/[?&]sent=/.test(location.search)) openForm();
    window.addEventListener("hashchange", function () {
      if (location.hash === "#review") openForm();
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#review"]');
      if (a) openForm();
    });
  })();

  // ===== Forms =====
  // Both forms post straight to FormSubmit, which shows its reCAPTCHA
  // ("I'm not a robot") and then sends the visitor back here with ?sent=...
  // FormSubmit also drops anything that fills in the hidden _honey field.
  var FORM_ACTION = "https://formsubmit.co/" + encodeURIComponent(EMAIL);
  var SITE_URL = location.protocol === "https:" || location.protocol === "http:"
    ? location.origin + location.pathname
    : "https://dillonmakes.tech/";

  // Spam filter words from config.js, sent with each form to FormSubmit
  var BLOCKED = (config.BLOCKED_WORDS || []).join(", ");

  // Bots tend to submit within moments of the page loading; people can't.
  var PAGE_OPENED = Date.now();
  var MIN_SECONDS = 3;

  function setStatus(el, msg, type) {
    el.textContent = msg;
    el.className = "form-status" + (type ? " " + type : "");
  }

  function setUpForm(form, opts) {
    if (!form) return;
    form.action = FORM_ACTION;
    form.method = "POST";
    form.elements["_next"].value = SITE_URL + "?sent=" + opts.sent + "#" + opts.anchor;
    form.elements["_blacklist"].value = BLOCKED;

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        setStatus(opts.status, opts.invalidMsg, "error");
        return;
      }
      if (form.elements["_honey"].value) {
        e.preventDefault(); // bot filled the hidden field: send nothing
        return;
      }
      if (Date.now() - PAGE_OPENED < MIN_SECONDS * 1000) {
        e.preventDefault(); // too fast for a person: likely a bot
        setStatus(opts.status, "Please take a moment, then send again.", "error");
        return;
      }
      var subject = form.elements["_subject"];
      subject.value = opts.subject + " from " + form.elements["name"].value.trim();
      opts.button.disabled = true;
      opts.button.textContent = "Sending...";
    });

    // The browser's back button can restore the page with the button still disabled
    window.addEventListener("pageshow", function () {
      opts.button.disabled = false;
      opts.button.textContent = opts.buttonText;
    });
  }

  var reviewStatus = document.getElementById("review-status");
  setUpForm(document.getElementById("review-form"), {
    sent: "review", anchor: "review", subject: "New review for Dillon Makes",
    status: reviewStatus,
    button: document.getElementById("review-submit"), buttonText: "Send review",
    invalidMsg: "Please add your name, a valid email, your review, and tick the box.",
  });

  var contactStatus = document.getElementById("form-status");
  setUpForm(document.getElementById("contact-form"), {
    sent: "contact", anchor: "contact", subject: "New Dillon Makes inquiry",
    status: contactStatus,
    button: document.getElementById("submit-btn"), buttonText: "Send message",
    invalidMsg: "Please fill in your name, a valid email, and a message.",
  });

  // Back from FormSubmit: show a thank-you, then tidy the address bar
  var sent = new URLSearchParams(location.search).get("sent");
  if (sent === "review") {
    var cta = document.querySelector(".review-cta p");
    if (cta) {
      cta.textContent = "Thanks! Your review has been sent. It will appear here once it's approved.";
      cta.className = "form-status success";
    }
  } else if (sent === "contact" && contactStatus) {
    setStatus(contactStatus, "Thanks! Your message has been sent. I'll be in touch soon.", "success");
  }
  if (sent && history.replaceState) {
    history.replaceState(null, "", location.pathname + location.hash);
  }
})();
