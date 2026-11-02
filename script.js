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

  // Light/dark toggle. A saved choice (cookie) overrides the device setting.
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
    // Keep the mobile browser bar in step with a manual choice
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
    var onSystemChange = function () { syncThemeUI(); };
    if (systemLight.addEventListener) systemLight.addEventListener("change", onSystemChange);
    else if (systemLight.addListener) systemLight.addListener(onSystemChange);
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

  // Contact form
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var button = document.getElementById("submit-btn");
  if (!form) return;

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = "form-status" + (type ? " " + type : "");
  }

  function mailtoFallback(data) {
    var subject = "Website inquiry: " + data.service;
    var body =
      "Name: " + data.name + "\n" +
      "Email: " + data.email + "\n" +
      (data.company ? "Business: " + data.company + "\n" : "") +
      "Service: " + data.service + "\n\n" +
      data.message;
    window.location.href =
      "mailto:" + EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      var firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      setStatus("Please fill in your name, a valid email, and a message.", "error");
      return;
    }

    // Spam bot filled the hidden field: pretend success, send nothing
    if (form.elements["_honey"].value) {
      form.reset();
      setStatus("Thanks! Your message has been sent.", "success");
      return;
    }

    var data = {
      name: form.elements["name"].value.trim(),
      email: form.elements["email"].value.trim(),
      company: form.elements["company"].value.trim(),
      service: form.elements["service"].value,
      message: form.elements["message"].value.trim(),
    };

    button.disabled = true;
    button.textContent = "Sending...";
    setStatus("");

    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(EMAIL), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        business: data.company || "N/A",
        service: data.service,
        message: data.message,
        _subject: "New Dillon Makes inquiry from " + data.name,
        _replyto: data.email,
        _template: "table",
        _captcha: "false",
      }),
    })
      .then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok || String(json.success) === "false") throw new Error(json.message || "Send failed");
        });
      })
      .then(function () {
        form.reset();
        setStatus("Thanks, " + data.name.split(" ")[0] + "! Your message has been sent. I'll be in touch soon.", "success");
      })
      .catch(function () {
        setStatus("Couldn't send automatically, so I've opened your email app instead.", "error");
        mailtoFallback(data);
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Send message";
      });
  });
})();
