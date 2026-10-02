(function () {
  "use strict";

  const DATA = window.TAHOOR_DATA || {};
  const SITE = DATA.site || {};
  const HOMEP = SITE.home || "/home/tahoor";
  const USER = SITE.name || "TaHooR";
  const USERNAME = SITE.username || USER.toLowerCase();
  const SHELL = SITE.shell || "zsh";
  const CPU = SITE.cpu || "13th Gen Intel(R) Core(TM) i5";
  const FS = {};

  function addDir(path, extra) {
    FS[path] = Object.assign({ d: 1 }, extra || {});
  }

  function addFile(path, content, extra) {
    FS[path] = Object.assign({ c: content == null ? "" : content }, extra || {});
    let dir = path.slice(0, path.lastIndexOf("/")) || "/";
    while (dir && !FS[dir]) {
      addDir(dir);
      dir = dir.slice(0, dir.lastIndexOf("/")) || "/";
      if (dir === "") break;
    }
  }

  const BINARIES = [
    "bash", "zsh", "sh", "pacman", "sudo", "fastfetch", "hyfetch",
    "alacritty", "nvim", "git", "python", "node", "java", "go",
    "docker", "adb", "fastboot", "htop", "curl", "ssh", "gcc",
    "g++", "make", "cmake", "gdb", "psql", "redis-cli"
  ];

  const projects = DATA.projects || [];
  const skills = DATA.skills || [];
  const socials = DATA.socials || [];
  const poetry = DATA.poetry || [];
  const stats = DATA.stats || {};
  const blogs = DATA.blogs || {};
  const music = DATA.music || [];

  [
    "/", "/bin", "/boot", "/dev", "/etc", "/home", HOMEP,
    "/opt", "/proc", "/run", "/srv", "/sys", "/tmp", "/usr",
    "/usr/bin", "/var", "/var/log", HOMEP + "/.config",
    HOMEP + "/.config/hypr", HOMEP + "/.config/waybar"
  ].forEach((p) => addDir(p));

  addDir("/root", { deny: 1 });
  FS["/bin/sh"] = { ln: "/usr/bin/bash" };
  FS["/usr/bin/env"] = { bin: 1 };

  addFile("/etc/hostname", (SITE.hostname || "arch") + "\n");
  addFile(
    "/etc/os-release",
    'NAME="Arch Linux"\nID=arch\nPRETTY_NAME="Arch Linux"\nHOME_URL="https://archlinux.org/"\nBUG_REPORT_URL="https://gitlab.archlinux.org/archlinux"\n'
  );
  addFile(
    "/etc/passwd",
    "root:x:0:0:root:/root:/bin/bash\n" +
    `${USERNAME}:x:1000:1000:${USER}:${HOMEP}:${SHELL.startsWith("/") ? SHELL : "/bin/" + SHELL}\n`
  );
  addFile("/etc/fstab", "# /etc/fstab\n# imaginary, because this is a website\n");
  addFile(
    "/etc/pacman.conf",
    "[options]\nArchitecture = auto\nCheckSpace\n\n" +
    "[core]\nInclude = /etc/pacman.d/mirrorlist\n\n" +
    "[extra]\nInclude = /etc/pacman.d/mirrorlist\n"
  );
  addFile("/etc/pacman.d/mirrorlist", "Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch\n");
  addFile("/etc/motd", "welcome to " + USER + "'s imaginary " + (SITE.os || "Arch Linux") + " box.\n");
  addFile("/etc/issue", "Arch Linux \\r \\m\n");
  addFile("/proc/version", "Linux version 6.x-arch1-1 (Arch Linux)\n");
  addFile(
    "/proc/cpuinfo",
    "processor\t: 0\n" +
    "model name\t: " + CPU + "\n" +
    "cpu MHz\t\t: 4500.000\n" +
    "cache size\t: 12288 KB\n" +
    "... (11 more processors)\n"
  );
  addFile("/proc/uptime", "11487.21 61233.90\n");
  addFile("/var/log/README", "journalctl has entered the chat.\n");

  addFile(
    HOMEP + "/.zshrc",
    "# " + USER + "'s " + SHELL + " config\n" +
    "export EDITOR=nvim\n" +
    "export BROWSER=firefox\n" +
    "alias ll='ls -lah'\n" +
    "alias gs='git status'\n"
  );
  addFile(HOMEP + "/.gitconfig", "[user]\n\tname = " + USER + "\n[init]\n\tdefaultBranch = main\n");
  addFile(HOMEP + "/.xinitrc", "exec Hyprland\n");
  addFile(HOMEP + "/.config/README.md", "Arch + Hyprland + way too many configs.\n");
  addFile(
    HOMEP + "/.config/waybar/config",
    '{\n  "layer": "top",\n  "position": "top"\n}\n'
  );
  addFile(
    HOMEP + "/.config/hypr/hyprland.conf",
    "monitor=,preferred,auto,1\n" +
    "$terminal = alacritty\n" +
    "$browser = firefox\n"
  );
  addFile(HOMEP + "/.config/hypr/keybinds.conf", "$mainMod = SUPER\nbind = $mainMod, RETURN, exec, alacritty\n");

  BINARIES.forEach((name) => { FS["/usr/bin/" + name] = { bin: 1 }; });

  // Home documents are generated from the data files, so there is one source of truth.
  addDir(HOMEP + "/projects", { run: "projects" });
  addFile(HOMEP + "/projects/README.md", "# things i've worked on\n\n" + projects.map((p) => p.name).join("\n") + "\n");
  projects.forEach((p) => {
    const slug = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const tech = Array.isArray(p.tech) && p.tech.length ? p.tech.join(", ") : "";
    const link = p.url ? "\n\nRepository: " + p.url : "";
    addFile(
      HOMEP + "/projects/" + slug + ".md",
      "# " + p.name + "\n\n" + p.description + (tech ? "\n\ntech: " + tech : "") + link + "\n"
    );
  });

  addDir(HOMEP + "/skills", { run: "skills" });
  addFile(HOMEP + "/skills/README.md", "# a collection of my skills\n\n" + skills.map((s) => s.name).join("\n") + "\n");

  addDir(HOMEP + "/poetry", { run: "poetry" });
  if (poetry.length) {
    poetry.forEach((poem) => {
      addFile(
        HOMEP + "/poetry/" + (poem.file || "untitled.md"),
        "# " + (poem.title || "untitled") + "\n\n" + (poem.content || "") + "\n"
      );
    });
  } else {
    addFile(HOMEP + "/poetry/README.md", "# poetry\n\nno poems added yet.\n");
  }

  addDir(HOMEP + "/stats", { run: "stats" });
  const statFiles = ["steam", "spotify", "github"];
  statFiles.forEach((name) => {
    const s = stats[name] || {};
    let content = "# " + name + " stats\n\n";
    if (!s.enabled) {
      content += "not configured yet. edit assets/data/stats.js.\n";
    } else {
      Object.keys(s).forEach((k) => {
        if (k === "enabled" || s[k] === null || s[k] === "") return;
        content += k + ": " + s[k] + "\n";
      });
    }
    addFile(HOMEP + "/stats/" + name + ".md", content);
  });

  addDir(HOMEP + "/music", { music: 1 });
  if (music.length) {
    addFile(HOMEP + "/music/README.md", "# music\n\n" + music.map((t) => t.file).join("\n") + "\n");
  }

  addFile(
    HOMEP + "/socials",
    socials.map((s) => s.name + "  " + s.url).join("\n") + (socials.length ? "\n" : ""),
    { run: "socials" }
  );
  addFile(HOMEP + "/about.md", "", { special: "about" });
  addFile(HOMEP + "/README.md", "", { special: "readme" });
  FS[HOMEP].go = "~";

  addDir(HOMEP + "/blog", { go: "~/blog" });
  Object.keys(blogs).forEach((slug) => {
    addDir(HOMEP + "/blog/" + slug, { go: "~/blog/" + slug });
    addFile(HOMEP + "/blog/" + slug + "/README.md", "", { special: "readme" });
  });

  window.TAHOOR_FS = FS;
})();
