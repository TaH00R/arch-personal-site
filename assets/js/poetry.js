(function () {
  "use strict";

  const DATA = window.TAHOOR_DATA || {};
  const poems = DATA.poetry || [];

  const container = document.getElementById("poetry-list");

  if (!container) return;

  if (!poems.length) {
    const empty = document.createElement("div");
    empty.className = "ls-total";
    empty.textContent = "total 0";
    container.appendChild(empty);

    const message = document.createElement("div");
    message.className = "ls-row";
    message.innerHTML = `
      <span class="ls-perms">-rw-r--r--</span>
      <span class="ls-size">--</span>
      <span class="ls-date">----</span>
      <span class="ls-name">
        <span class="ls-title">No poems yet</span>
        <span class="ls-desc">
          add one in assets/data/poetry.js
        </span>
      </span>
      <span class="ls-meta">empty</span>
    `;

    container.appendChild(message);
    return;
  }

  const total = document.createElement("div");
  total.className = "ls-total";
  total.textContent = "total " + poems.length;
  container.appendChild(total);

  poems.forEach((poem) => {
    const row = document.createElement("div");
    row.className = "ls-row";

    const file = poem.file || "untitled.md";
    const title = poem.title || "Untitled";
    const date = poem.date || "----";

    const perms = document.createElement("span");
    perms.className = "ls-perms";
    perms.textContent = "-rw-r--r--";

    const size = document.createElement("span");
    size.className = "ls-size";
    size.textContent = "--";

    const dateEl = document.createElement("span");
    dateEl.className = "ls-date";
    dateEl.textContent = date;

    const name = document.createElement("span");
    name.className = "ls-name";

    const link = document.createElement("a");
    link.className = "ls-dir";
    link.href = "#";
    link.textContent = file;

    const poemTitle = document.createElement("span");
    poemTitle.className = "ls-title";
    poemTitle.textContent = title;

    const description = document.createElement("span");
    description.className = "ls-desc";
    description.textContent = "cat " + file;

    const meta = document.createElement("span");
    meta.className = "ls-meta";
    meta.textContent = "poem";

    link.addEventListener("click", (e) => {
      e.preventDefault();

      const targetId = "poem-" + file
        .replace(/\.md$/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });

    name.appendChild(link);
    name.appendChild(poemTitle);
    name.appendChild(description);

    row.appendChild(perms);
    row.appendChild(size);
    row.appendChild(dateEl);
    row.appendChild(name);
    row.appendChild(meta);

    container.appendChild(row);
  });

  poems.forEach((poem) => {
    const article = document.createElement("article");

    const file = poem.file || "untitled.md";

    article.id =
      "poem-" +
      file
        .replace(/\.md$/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-");

    article.style.marginTop = "36px";
    article.style.paddingTop = "24px";
    article.style.borderTop = "1px solid var(--surface1)";

    const meta = document.createElement("div");
    meta.className = "ls-meta";
    meta.textContent = poem.date || "";

    const title = document.createElement("h2");
    title.className = "ls-title";
    title.textContent = poem.title || "Untitled";

    const content = document.createElement("pre");
    content.className = "poem-content";
    content.textContent = poem.content || "";

    article.appendChild(meta);
    article.appendChild(title);
    article.appendChild(content);

    container.appendChild(article);
  });
})();