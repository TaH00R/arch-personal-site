(function () {
  "use strict";

  const DATA = window.TAHOOR_DATA || {};

  function renderRows(container, items) {
    if (!container) return;
    container.innerHTML = "";

    (items || []).forEach((item) => {
      const li = document.createElement("li");
      li.className = "row";
      li.innerHTML =
        '<span class="dot" aria-hidden="true"></span>' +
        '<div><div class="row-title"></div><div class="row-sub"></div></div>';

      li.querySelector(".row-title").textContent = item.name || "";
      li.querySelector(".row-sub").textContent = item.description || "";
      container.appendChild(li);
    });
  }

  function renderSocials(container) {
    if (!container) return;
    container.innerHTML = "";

    (DATA.socials || []).forEach((social) => {
      const a = document.createElement("a");
      a.className = "icon";
      a.href = social.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", social.name);

      const icon = document.createElement("i");
      icon.className = "fa-brands " + social.icon;
      a.appendChild(icon);
      container.appendChild(a);
    });
  }

  function renderAbout(container, paragraphs) {
    if (!container) return;
    container.innerHTML = "";

    (paragraphs || []).forEach((text) => {
      const p = document.createElement("p");
      p.className = "out";
      p.textContent = text;
      container.appendChild(p);
    });
  }

  function renderSiteValues() {
    const site = DATA.site || {};

    document.querySelectorAll("[data-site]").forEach((element) => {
      const value = site[element.dataset.site];
      element.textContent = Array.isArray(value)
        ? value.join(" · ")
        : value ?? "";
    });
  }

  function init() {
    renderRows(
      document.querySelector('[data-content="projects"]'),
      DATA.projects
    );

    renderRows(
      document.querySelector('[data-content="skills"]'),
      DATA.skills
    );

    renderSocials(
      document.querySelector('[data-content="socials"]')
    );

    renderAbout(
      document.querySelector('[data-content="about-short"]'),
      DATA.about?.short
    );

    renderAbout(
      document.querySelector('[data-content="about-long"]'),
      DATA.about?.long
    );

    renderSiteValues();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
