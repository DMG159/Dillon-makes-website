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

  // Light/dark toggle. The site is dark by default; a saved choice (cookie) switches it.
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var THEME_COLORS = { dark: "#000000", light: "#fafaf8" };

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function syncThemeUI() {
    var theme = currentTheme();
    if (themeBtn) {
      themeBtn.setAttribute("data-current", theme);
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
    if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[theme]);
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

  // Send a form to FormSubmit, which forwards it to CONTACT_EMAIL.
  function sendToFormSubmit(payload) {
    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(EMAIL), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok || String(json.success) === "false") throw new Error(json.message || "Send failed");
      });
    });
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
        if (r.role) {
          var role = document.createElement("span");
          role.className = "review-role";
          role.textContent = r.role;
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
    var rStatus = document.getElementById("review-status");
    var rButton = document.getElementById("review-submit");

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
    if (location.hash === "#review") openForm();
    window.addEventListener("hashchange", function () {
      if (location.hash === "#review") openForm();
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#review"]');
      if (a) openForm();
    });

    function setReviewStatus(msg, type) {
      rStatus.textContent = msg;
      rStatus.className = "form-status" + (type ? " " + type : "");
    }

    rForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!rForm.checkValidity()) {
        var firstInvalid = rForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        setReviewStatus("Please add your name, a valid email, your review, and tick the box.", "error");
        return;
      }

      if (rForm.elements["_honey"].value) {
        rForm.reset();
        setReviewStatus("Thanks! Your review has been sent.", "success");
        return;
      }

      var name = rForm.elements["name"].value.trim();
      rButton.disabled = true;
      rButton.textContent = "Sending...";
      setReviewStatus("");

      sendToFormSubmit({
        name: name,
        email: rForm.elements["email"].value.trim(),
        role_and_business: rForm.elements["role"].value.trim() || "N/A",
        review: rForm.elements["review"].value.trim(),
        ok_to_publish: "Yes",
        _subject: "New review for Dillon Makes from " + name,
        _replyto: rForm.elements["email"].value.trim(),
        _template: "table",
        _captcha: "false",
      })
        .then(function () {
          rForm.reset();
          setReviewStatus("Thanks, " + name.split(" ")[0] + "! Your review has been sent. It will appear here once it's approved.", "success");
        })
        .catch(function () {
          setReviewStatus("Sorry, that didn't send. Please try again, or email your review to " + EMAIL + ".", "error");
        })
        .finally(function () {
          rButton.disabled = false;
          rButton.textContent = "Send review";
        });
    });
  })();

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

    sendToFormSubmit({
      name: data.name,
      email: data.email,
      business: data.company || "N/A",
      service: data.service,
      message: data.message,
      _subject: "New Dillon Makes inquiry from " + data.name,
      _replyto: data.email,
      _template: "table",
      _captcha: "false",
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
