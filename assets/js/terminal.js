(function () {
  "use strict";

  const body = document.body;
  const ROOT = body.dataset.root || "";
  const USER = "TaHooR";
  const HOST = "arch";
  const HOMEP = "/home/tahoor";

  const ROUTE = {
    "~": "",
    "~/about": "about/",
    "~/blog": "blogs/",
  };

  function openMusic() {
    window.dispatchEvent(new CustomEvent("sidh-open-music"));
  }

  const BLOGS = {
    "porting-arma-cwa": "blogs/blog-28-06-26/",
    "cbse-onmark": "blogs/blog-31-05-26/",
    "aqi-service-jk": "blogs/blog-10-2-26/",
    "pixel-kernel-bazel": "blogs/blog-14-12-25/",
    "nix-helper-script": "blogs/blog-18-10-25/",
    "device-trees-cleanup": "blogs/blog-25-06-25/",
    "aosp-device-trees": "blogs/blog-22-05-25/",
    "getting-into-aosp": "blogs/blog-18-05-25/",
    "dealing-with-aidl": "blogs/blog-17-05-25/",
  };
  Object.keys(BLOGS).forEach((s) => (ROUTE["~/blog/" + s] = BLOGS[s]));

  function expand(p) {
    if (!p) return HOMEP;
    if (p === "~") return HOMEP;
    if (p.indexOf("~/") === 0) return HOMEP + p.slice(1);
    return p;
  }

  function abbr(p) {
    if (p === HOMEP) return "~";
    if (p.indexOf(HOMEP + "/") === 0) return "~" + p.slice(HOMEP.length);
    return p;
  }

  let CWD = expand(body.dataset.cwd || "~");
  const PAGE = expand(body.dataset.cwd || "~");

  /* ---------- virtual filesystem ---------- */
  const FS = {};

  function addDir(p, extra) {
    FS[p] = Object.assign({ d: 1 }, extra || {});
  }
  function addFile(p, content, extra) {
    FS[p] = Object.assign({ c: content }, extra || {});
    let dir = p.slice(0, p.lastIndexOf("/")) || "/";
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

  function buildFS() {
    [
      "/", "/bin", "/boot", "/dev", "/etc", "/home", HOMEP,
      "/opt", "/proc", "/run", "/srv", "/sys", "/tmp", "/usr",
      "/usr/bin", "/var", "/var/log", HOMEP + "/.config",
      HOMEP + "/.config/hypr", HOMEP + "/.config/waybar"
    ].forEach((p) => addDir(p));

    addDir("/root", { deny: 1 });

    FS["/bin/sh"] = { ln: "/usr/bin/bash" };
    FS["/usr/bin/env"] = { bin: 1 };

    addFile("/etc/hostname", "arch\n");
    addFile(
      "/etc/os-release",
      'NAME="Arch Linux"\nID=arch\nPRETTY_NAME="Arch Linux"\nHOME_URL="https://archlinux.org/"\nBUG_REPORT_URL="https://gitlab.archlinux.org/archlinux"\n'
    );
    addFile(
      "/etc/passwd",
      "root:x:0:0:root:/root:/bin/bash\n" +
      "tahoor:x:1000:1000:TaHooR:/home/tahoor:/bin/zsh\n"
    );
    addFile("/etc/fstab", "# /etc/fstab\n# imaginary, because this is a website\n");
    addFile(
      "/etc/pacman.conf",
      "[options]\nArchitecture = auto\nCheckSpace\n\n" +
      "[core]\nInclude = /etc/pacman.d/mirrorlist\n\n" +
      "[extra]\nInclude = /etc/pacman.d/mirrorlist\n"
    );
    addFile(
      "/etc/pacman.d/mirrorlist",
      "Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch\n"
    );
    addFile("/proc/version", "Linux version 6.x-arch1-1 (Arch Linux)\n");
    addFile(
      "/proc/cpuinfo",
      "processor\t: 0\n" +
      "model name\t: 13th Gen Intel(R) Core(TM) i5\n" +
      "cpu MHz\t\t: 4500.000\n" +
      "cache size\t: 12288 KB\n" +
      "... (11 more processors)\n"
    );
    addFile("/proc/uptime", "11487.21 61233.90\n");
    addFile("/var/log/README", "journalctl has entered the chat.\n");
    addFile(
      HOMEP + "/.zshrc",
      "# TaHooR's zsh config\n" +
      "export EDITOR=nvim\n" +
      "export BROWSER=firefox\n" +
      "alias ll='ls -lah'\n" +
      "alias gs='git status'\n"
    );
    addFile(
      HOMEP + "/.gitconfig",
      "[user]\n" +
      "\tname = TaHooR\n" +
      "[init]\n" +
      "\tdefaultBranch = main\n"
    );
    addFile(HOMEP + "/.config/README.md", "Arch + Hyprland + way too many configs.\n");
    addFile(
      HOMEP + "/.config/hypr/hyprland.conf",
      "monitor=,preferred,auto,1\n" +
      "$terminal = alacritty\n" +
      "$browser = firefox\n"
    );

    BINARIES.forEach((n) => { FS["/usr/bin/" + n] = { bin: 1 }; });

    if (window.ARCHFS) {
      Object.keys(window.ARCHFS).forEach((p) => addFile(p, window.ARCHFS[p]));
    }

    addDir(HOMEP + "/blog", { go: "~/blog" });
    Object.keys(BLOGS).forEach((s) => {
      addDir(HOMEP + "/blog/" + s, { go: "~/blog/" + s });
      addFile(HOMEP + "/blog/" + s + "/README.md", null, { special: "readme" });
    });
    addDir(HOMEP + "/music", { music: 1 });
    addDir(HOMEP + "/projects", { run: "projects" });
    addDir(HOMEP + "/skills", { run: "skills" });
    addFile(HOMEP + "/socials", null, { run: "socials" });
    addFile(HOMEP + "/about.md", null, { special: "about" });
    addFile(HOMEP + "/README.md", null, { special: "readme" });
    FS[HOMEP].go = "~";
  }
  buildFS();

  function canon(arg) {
    let p = expand(arg);
    if (p[0] !== "/") p = (CWD === "/" ? "" : CWD) + "/" + p;
    const out = [];
    p.split("/").forEach((seg) => {
      if (!seg || seg === ".") return;
      if (seg === "..") out.pop();
      else out.push(seg);
    });
    return "/" + out.join("/");
  }

  function node(p) {
    return FS[p === "" ? "/" : p];
  }

  function children(p) {
    const prefix = p === "/" ? "/" : p + "/";
    const names = [];
    Object.keys(FS).forEach((k) => {
      if (k === "/" || k.indexOf(prefix) !== 0) return;
      const rest = k.slice(prefix.length);
      if (rest && rest.indexOf("/") < 0) names.push(rest);
    });
    return names.sort((a, b) => {
      const da = FS[prefix + a].d ? 0 : 1;
      const db = FS[prefix + b].d ? 0 : 1;
      return da - db || a.localeCompare(b);
    });
  }

  const PROJECTS = [
    ["DevTrack", "Flutter task manager · Spring Boot · PostgreSQL · JWT"],
    ["Spark", "sports platform · Next.js · Tailwind · Spring Boot · WebSockets"],
    ["Satellite Tracker", "3D ISS tracker · Three.js · satellite.js · CelesTrak"],
    ["Gallery", "Flutter gallery · albums · favorites · maps · sharing"],
    ["CivicPulse / MedIntel", "hackathon projects focused on real-world problems"],
    ["WonderVault", "map-based travel memories app · Flutter"],
  ];

  const SKILLS = [
    ["C / C++", "DSA, systems programming and performance-focused work"],
    ["Java", "Spring Boot, REST APIs, JPA and backend services"],
    ["Dart / Flutter", "cross-platform apps, Firebase, Provider and custom UI"],
    ["Python", "automation, data work, ML experiments and scripting"],
    ["TypeScript / JavaScript", "React, Next.js, Node.js and web tooling"],
    ["databases", "PostgreSQL, MySQL and MongoDB"],
    ["Linux", "Arch Linux, Hyprland, terminal tooling and system tinkering"],
    ["security", "learning web security, vulnerability research and cybersec"],
  ];

  const SOCIALS = [
    ["github", "https://github.com/TaH00R"],
    ["linkedin", "https://www.linkedin.com/in/x-tahoor-x-36652739a/"],
    ["instagram", "https://www.instagram.com/tahoor.69/"],
  ];  

  const ABOUT = [
    "CS student at IIIT Guwahati.",
    "building Flutter apps, Spring Boot backends and web projects.",
    "currently getting deeper into Linux, systems, cybersecurity and Go.",
    "Arch Linux + Hyprland + terminal enjoyer.",
  ];

  const FORTUNES = [
    "there is no dark side of the moon, really. matter of fact, it's all dark.",
    "talk is cheap. show me the code.  — linus",
    "an idiot admires complexity, a genius admires simplicity.  — terry a. davis",
    "shine on, you crazy diamond.",
    "the only intuitive interface is the nipple. everything else is learned.",
    "rm -rf / is not a personality trait.",
    "real programmers count from 0.",
    "there are only two hard things in cs: cache invalidation and naming things.",
  ];

  const TEASE = {
    mkdir: "mkdir: cannot create directory: Read-only file system (it's a website)",
    rmdir: "rmdir: can't do that here, sorry :(",
    rm: "rm: nice try. everything here stays put :(",
    touch: "touch: read-only filesystem, sorry :(",
    mv: "mv: can't move things around here, sorry :(",
    cp: "cp: can't do that here, sorry :(",
    chmod: "chmod: not your box to chmod, sorry :(",
    chown: "chown: it's all mine :(",
    ln: "ln: symlinks are a privilege you don't have here :(",
    dd: "dd: absolutely not.",
    mount: "mount: only root can do that, and you are not root :(",
    umount: "umount: nothing mounted here",
    vim: "vim: no editor here — try `cat` instead",
    nvim: "nvim: no editor here — try `cat` instead",
    nano: "nano: no editor here — try `cat` instead",
    emacs: "emacs: a great os, still looking for a decent website though",
    ssh: "ssh: connect to host: Connection refused (this is a browser)",
    scp: "scp: nowhere to copy to, sorry :(",
    curl: "curl: (7) couldn't connect — go touch grass instead",
    wget: "wget: nothing to fetch here but hyfetch",
    git: "git: not a git repository (but the source is on github)",
    make: "make: *** No rule to make target. this isn't your build server :(",
    gcc: "gcc: no input files (and no compiler down here)",
    apt: "apt: this is Arch Linux. we don't do that here.",
    nix: "nix: this is Arch Linux. pacman exists for a reason.",
    "apt-get": "apt-get: this is Arch Linux. we don't do that here.",
    pacman: "pacman: finally, a command that belongs here.",
    yay: "yay: AUR helper not installed here.",
    dnf: "dnf: this is Arch Linux. we don't do that here.",
    emerge: "emerge: compiling... just kidding. this is Arch.",
    reboot: "reboot: you can just refresh the page :)",
    poweroff: "poweroff: please don't",
    shutdown: "shutdown: please don't",
    halt: "halt: please don't",
    kill: "kill: (1) Operation not permitted",
    killall: "killall: no mercy, and no processes either",
    systemctl: "systemctl: Failed to connect to bus (there is no bus)",
    service: "service: no services here",
    journalctl: "journalctl: -- No entries -- (the journal is shy)",
    crontab: "crontab: no time for cron",
    passwd: "passwd: you shall not pass(wd)",
    useradd: "useradd: this is a one-man machine",
    mkfs: "mkfs: i will pretend i didn't see that",
    fdisk: "fdisk: step away from the partition table",
    yes: "yes: y y y y y ... (imagine this, forever)",
    cmatrix: "cmatrix: the matrix has you — but not today",
    htop: "htop: everything is running fine, trust me",
    top: "top: all nominal. go outside.",
    strace: "strace: nothing to trace but my thoughts",
    sl: "sl: choo choo... but not today",
    sudo: "we don't serve root here.",
  };

  function navTo(url) {
    window.location.href = url;
  }

  function goRoute(vpath) {
    navTo(ROOT + (ROUTE[vpath] || ""));
  }

  function startClock() {
    const el = document.querySelector(".panel-clock");
    if (!el) return;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      el.innerHTML =
        '<span class="clock-time">' + hh + ":" + mm + "</span> " +
        '<span class="clock-date">' + days[d.getDay()] + " " +
        String(d.getDate()).padStart(2, "0") + " " + mon[d.getMonth()] + "</span>";
    }
    tick();
    setInterval(tick, 15000);
  }

  const LOGCAT = [
    ["dim", "--------- beginning of main"],
    ["info", "01-07 01:32:07.104  1337  1337 I ActivityManager: Start proc 4821:com.TaHooR.breathe/u0a221 for activity"],
    ["dim", "01-07 01:32:07.221  4821  4821 D AndroidRuntime: >>>>>> START com.android.internal.os.ZygoteInit"],
    ["info", "01-07 01:32:07.336  4821  4821 I zygote64: Late-enabling -Xcheck:jni"],
    ["dim", "01-07 01:32:07.512  4821  4838 D BreatheApp: fetching AQI for grid 32.7266,74.8570"],
    ["info", "01-07 01:32:07.744  1201  1288 I ConnectivityService: NetworkAgentInfo [WIFI () - 121] validation passed"],
    ["dim", "01-07 01:32:07.901  4821  4838 D OkHttp: --> GET https://api.breathe.jk/v1/aqi?lat=32.72&lon=74.85"],
    ["info", "01-07 01:32:08.233  4821  4838 I OkHttp: <-- 200 OK (331ms)"],
    ["warn", "01-07 01:32:08.410  4821  4821 W BreatheApp: sensor tile stale (last update 42m ago), falling back to satellite"],
    ["dim", "01-07 01:32:08.588  1337  1502 D SurfaceFlinger: duplicate frame, dropping"],
    ["info", "01-07 01:32:08.720  4821  4821 I Choreographer: Skipped 31 frames! The application may be doing too much work on its main thread."],
    ["dim", "01-07 01:32:08.900  4821  4838 D Glide: loading marker icons into RecyclerView"],
    ["error", "01-07 01:32:09.140  4821  4838 E OkHttp: <-- HTTP FAILED: java.net.SocketTimeoutException: timeout"],
    ["warn", "01-07 01:32:09.155  4821  4838 W BreatheApp: retrying request (1/3)"],
    ["info", "01-07 01:32:09.602  4821  4838 I OkHttp: <-- 200 OK (447ms)"],
    ["dim", "01-07 01:32:09.780  1201  1201 D WifiService: acquireWifiLockLocked: WifiLock{...}"],
    ["info", "01-07 01:32:10.011  1337  1360 I ActivityManager: Displayed com.TaHooR.breathe/.MainActivity: +2s913ms"],
    ["dim", "01-07 01:32:10.240  4821  4821 D BreatheApp: AQI = 168 (unhealthy) — updating widget"],
    ["warn", "01-07 01:32:10.455  1088  1120 W SELinux: avc: denied { read } for scontext=u:r:untrusted_app"],
    ["dim", "01-07 01:32:10.700  4821  4890 D dalvikvm: GC_FOR_ALLOC freed 2048K, 14% free"],
    ["info", "01-07 01:32:11.020  4821  4821 I BreatheApp: notification posted: 'air quality is unhealthy'"],
    ["dim", "01-07 01:32:11.288  1337  1337 D PowerManagerService: lightsleep -> awake"],
    ["error", "01-07 01:32:11.503  2044  2044 E AudioFlinger: not enough memory for output buffer size=61440"],
    ["dim", "01-07 01:32:11.744  4821  4838 D BreatheApp: cached response for 15 min"],
    ["info", "01-07 01:32:12.100  1337  1502 I SurfaceFlinger: EventThread: 60.000 Hz"],
    ["dim", "01-07 01:32:12.360  4821  4821 D BreatheApp: idle — releasing wakelock"],
    ["dim", "^C"],
  ];

  function promptLocation() {
    return USER + "@" + HOST;
  }

  function initShell() {
    const form = document.querySelector(".cmd");
    if (!form) return;
    const input = form.querySelector(".cmd-input");
    const output = form.querySelector(".cmd-output");
    const pathSpan = form.querySelector(".cmd-line .p-path");
    const scroller = form.closest(".term-body") || form.parentElement;

    function syncPrompt() {
      if (pathSpan) pathSpan.textContent = abbr(CWD);
    }
    syncPrompt();

    const history = [];
    let hIndex = -1;

    function scrollBottom() {
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }

    function print(text, cls) {
      const line = document.createElement("div");
      line.className = "line" + (cls ? " " + cls : "");
      if (text instanceof Node) line.appendChild(text);
      else line.textContent = text;
      output.appendChild(line);
      return line;
    }

    function printRows(rows) {
      rows.forEach(([title, sub]) => {
        print(title, "rtitle");
        print(sub, "rsub");
      });
    }

    function printLink(label, href) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(label.padEnd(14, " ")));
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = href;
      frag.appendChild(a);
      print(frag);
    }

    function echoCmd(raw) {
      const line = document.createElement("div");
      line.className = "line echo";
      line.innerHTML =
        '<span class="p-loc">' + promptLocation() + '</span> ' +
        '<span class="p-path">' + abbr(CWD) + '</span> ' +
        '<span class="p-sym">$</span> ';
      line.appendChild(document.createTextNode(raw));
      output.appendChild(line);
    }

    function fileLines(n) {
      return (n.c || "").replace(/\n$/, "").split("\n");
    }

    function printSpecial(kind) {
      if (kind === "about") {
        ABOUT.forEach((l) => print(l));
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode("more: "));
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = "open about";
        a.addEventListener("click", (e) => { e.preventDefault(); goRoute("~/about"); });
        frag.appendChild(a);
        print(frag);
        return;
      }
      if (kind === "readme") {
        print("TaHooR's home directory.", "accent");
        print("try `ls`, `cd`, `projects`, `skills`, `socials`, or `cat about.md`.");
        return;
      }
      print("welcome. this is TaHooR's little corner of the web.", "accent");
      print("poke around with `ls`, `cd`, `tree /etc`, `cat ~/.zshrc`.");
      print("there is no dark side to the moon, really. it's all dark.", "dim");
    }

    function catNode(p, n, name) {
      if (!n) return print("cat: " + name + ": No such file or directory", "err");
      if (n.deny) return print("cat: " + name + ": Permission denied", "err");
      if (n.d) return print("cat: " + name + ": Is a directory", "err");
      if (n.bin) return print("cat: " + name + ": binary file (trust me, you don't want this in your terminal)", "dim");
      if (n.ln) return print(FS[n.ln] ? fileLines(FS[n.ln]).join("\n") : "(symlink to " + n.ln + ")");
      if (n.special) return printSpecial(n.special);
      if (n.run === "socials") return HANDLERS.socials();
      const lines = fileLines(n);
      const cap = 400;
      lines.slice(0, cap).forEach((l) => print(l));
      if (lines.length > cap) print("... (" + (lines.length - cap) + " more lines — this file is huge)", "dim");
    }

    let streaming = false;
    function stream(lines, delay) {
      streaming = true;
      let i = 0;
      const t = setInterval(() => {
        if (i >= lines.length) {
          clearInterval(t);
          streaming = false;
          return;
        }
        const [cls, txt] = lines[i++];
        print(txt, cls === "error" ? "err" : cls);
        scrollBottom();
      }, delay);
    }

    function argSplit(arg) {
      return (arg || "").trim().split(/\s+/).filter(Boolean);
    }

    const HANDLERS = {
      help() {
        print("commands:", "accent");
        print("  ls · cd · cat · tree · head · tail · grep · find · wc · du · file · stat");
        print("  pwd · open <name> · xdg-open <file> · projects · skills · socials");
        print("  neofetch · whoami · uptime · uname · hostname · id · free · df · ps");
        print("  lscpu · lsblk · ip · env · which · date · cal · history · ping <host>");
        print("  pacman · sudo · cowsay · fortune · adb · curl · ssh");
        print("the whole filesystem is walkable — try `cd /etc` or `tree /`.", "dim");
        print("tip: ctrl+space opens a launcher; right-click the desktop for a menu.", "dim");
      },
      ls(arg) {
        const parts = argSplit(arg).filter((a) => a[0] !== "-");
        const t = parts[0] || ".";
        const plain = t.replace(/^~\//, "").replace(/\/$/, "");
        if (plain === "projects") return HANDLERS.projects();
        if (plain === "skills") return HANDLERS.skills();
        if (plain === "socials") return HANDLERS.socials();
        const p = canon(t);
        const n = node(p);
        if (!n) return print("ls: cannot access '" + t + "': No such file or directory", "err");
        if (n.deny) return print("ls: cannot open directory '" + abbr(p) + "': Permission denied", "err");
        if (!n.d) {
          const s = document.createElement("span");
          s.textContent = abbr(p);
          s.style.color = n.ln ? "var(--sky)" : "var(--subtext)";
          return print(s);
        }
        const names = children(p);
        if (!names.length) return print("");
        names.forEach((name) => {
          const cp = (p === "/" ? "" : p) + "/" + name;
          const cn = FS[cp];
          const frag = document.createDocumentFragment();
          const label = name + (cn.d ? "/" : "") + (cn.ln ? " -> " + cn.ln : "");
          if (cn.go || cn.run || cn.music) {
            const a = document.createElement("a");
            a.href = "#";
            a.textContent = label;
            a.style.color = cn.d ? "var(--blue)" : "var(--lavender)";
            a.addEventListener("click", (e) => {
              e.preventDefault();
              if (cn.music) { print("opening ~/music ...", "ok"); openMusic(); }
              else if (cn.go) goRoute(cn.go);
              else run(cn.run);
            });
            frag.appendChild(a);
          } else {
            const span = document.createElement("span");
            span.textContent = label;
            span.style.color = cn.d ? "var(--blue)" : cn.ln ? "var(--sky)" : cn.deny ? "var(--red)" : "var(--subtext)";
            frag.appendChild(span);
          }
          print(frag);
        });
      },
      cd(arg) {
        const t = argSplit(arg)[0] || "~";
        const plain = t.replace(/^~\//, "").replace(/\/$/, "");
        if (plain === "projects") return HANDLERS.projects();
        if (plain === "skills") return HANDLERS.skills();
        if (plain === "music") { print("opening ~/music ...", "ok"); return openMusic(); }
        const p = canon(t);
        const n = node(p);
        if (!n) return print("cd: no such directory: " + t, "err");
        if (n.deny) return print("cd: permission denied: " + abbr(p), "err");
        if (!n.d) return print("cd: not a directory: " + abbr(p), "err");
        if (n.music) { print("opening ~/music ...", "ok"); return openMusic(); }
        if (n.go && p !== PAGE) {
          print("cd " + abbr(p), "ok");
          return goRoute(n.go);
        }
        CWD = p;
        syncPrompt();
      },
      cat(arg) {
        const parts = argSplit(arg);
        if (!parts.length) return print("cat: missing operand", "err");
        parts.forEach((t) => {
          const p = canon(t);
          catNode(p, node(p), t);
        });
      },
      head(arg) {
        const parts = argSplit(arg);
        let count = 10;
        const ni = parts.indexOf("-n");
        if (ni >= 0) { count = parseInt(parts[ni + 1], 10) || 10; parts.splice(ni, 2); }
        const t = parts[0];
        if (!t) return print("head: missing operand", "err");
        const n = node(canon(t));
        if (!n || n.d || !n.c) return print("head: cannot open '" + t + "'", "err");
        fileLines(n).slice(0, count).forEach((l) => print(l));
      },
      tail(arg) {
        const parts = argSplit(arg);
        let count = 10;
        const ni = parts.indexOf("-n");
        if (ni >= 0) { count = parseInt(parts[ni + 1], 10) || 10; parts.splice(ni, 2); }
        const t = parts[0];
        if (!t) return print("tail: missing operand", "err");
        const n = node(canon(t));
        if (!n || n.d || !n.c) return print("tail: cannot open '" + t + "'", "err");
        fileLines(n).slice(-count).forEach((l) => print(l));
      },
      wc(arg) {
        const parts = argSplit(arg).filter((a) => a[0] !== "-");
        const t = parts[0];
        if (!t) return print("wc: missing operand", "err");
        const n = node(canon(t));
        if (!n || n.d || !n.c) return print("wc: " + t + ": No such file", "err");
        const c = n.c;
        print(String(fileLines(n).length).padStart(5) + String(c.split(/\s+/).filter(Boolean).length).padStart(7) + String(c.length).padStart(8) + " " + t);
      },
      grep(arg) {
        const parts = argSplit(arg).filter((a) => a !== "-r" && a !== "-rn" && a !== "-n" && a !== "-i");
        const pat = parts[0];
        const t = parts[1] || ".";
        if (!pat) return print("usage: grep <pattern> <file|dir>", "dim");
        let re;
        try { re = new RegExp(pat, "i"); } catch (e) { return print("grep: invalid pattern", "err"); }
        const p = canon(t);
        const n = node(p);
        if (!n) return print("grep: " + t + ": No such file or directory", "err");
        let hits = 0;
        function scanFile(fp, fn) {
          if (!fn.c) return;
          fileLines(fn).forEach((l, i) => {
            if (re.test(l) && hits < 60) { hits++; print(abbr(fp) + ":" + (i + 1) + ": " + l.trim()); }
          });
        }
        if (n.d) {
          Object.keys(FS).forEach((k) => {
            if (k.indexOf(p === "/" ? "/" : p + "/") === 0 && FS[k].c) scanFile(k, FS[k]);
          });
        } else scanFile(p, n);
        if (!hits) print("(no matches)", "dim");
        else if (hits >= 60) print("... (capped at 60 matches)", "dim");
      },
      find(arg) {
        const parts = argSplit(arg);
        let dir = ".", pat = null;
        const ni = parts.indexOf("-name");
        if (ni >= 0) { pat = parts[ni + 1]; parts.splice(ni, 2); }
        if (parts[0]) dir = parts[0];
        const p = canon(dir);
        const n = node(p);
        if (!n || !n.d) return print("find: '" + dir + "': No such directory", "err");
        let re = null;
        if (pat) {
          try { re = new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$"); } catch (e) {}
        }
        let count = 0;
        print(abbr(p));
        Object.keys(FS).sort().forEach((k) => {
          if (k.indexOf(p === "/" ? "/" : p + "/") !== 0) return;
          const base = k.slice(k.lastIndexOf("/") + 1);
          if (re && !re.test(base)) return;
          if (count < 80) { count++; print(abbr(k) + (FS[k].d ? "/" : "")); }
        });
        if (count >= 80) print("... (capped at 80 results)", "dim");
      },
      tree(arg) {
        const t = argSplit(arg)[0] || ".";
        const p = canon(t);
        const n = node(p);
        if (!n || !n.d) return print("tree: " + t + ": No such directory", "err");
        if (n.deny) return print("tree: " + abbr(p) + ": Permission denied", "err");
        print(abbr(p));
        let dirs = 0, files = 0, lines = 0;
        const MAX = 120;
        function walk(dir, prefix, depth) {
          if (depth > 4 || lines > MAX) return;
          const kids = children(dir);
          kids.forEach((name, i) => {
            if (lines > MAX) return;
            lines++;
            const cp = (dir === "/" ? "" : dir) + "/" + name;
            const cn = FS[cp];
            const last = i === kids.length - 1;
            print(prefix + (last ? "└── " : "├── ") + name + (cn.d ? "/" : ""));
            if (cn.d && !cn.deny) { dirs++; walk(cp, prefix + (last ? "    " : "│   "), depth + 1); }
            else files++;
          });
        }
        walk(p, "", 1);
        if (lines > MAX) print("... (truncated)", "dim");
        print(dirs + " directories, " + files + " files", "dim");
      },
      du(arg) {
        const t = argSplit(arg).filter((a) => a[0] !== "-")[0] || ".";
        const p = canon(t);
        const n = node(p);
        if (!n) return print("du: cannot access '" + t + "'", "err");
        let total = 0;
        if (n.d) Object.keys(FS).forEach((k) => { if (k.indexOf(p === "/" ? "/" : p + "/") === 0 && FS[k].c) total += FS[k].c.length; });
        else total = (n.c || "").length;
        print(Math.max(1, Math.round(total / 1024)) + "K\t" + abbr(p));
      },
      file(arg) {
        const t = argSplit(arg)[0];
        if (!t) return print("usage: file <path>", "dim");
        const p = canon(t);
        const n = node(p);
        if (!n) return print(t + ": cannot open (No such file or directory)", "err");
        if (n.d) return print(abbr(p) + ": directory");
        if (n.ln) return print(abbr(p) + ": symbolic link to " + n.ln);
        if (n.bin) return print(abbr(p) + ": ELF 64-bit LSB pie executable, x86-64 (allegedly)");
        if (/\.nix$/.test(p)) return print(abbr(p) + ": Nix language source, ASCII text");
        if (/\.(md|txt|conf|lock|json)$/.test(p) || n.c) return print(abbr(p) + ": ASCII text");
        return print(abbr(p) + ": data");
      },
      stat(arg) {
        const t = argSplit(arg)[0];
        if (!t) return print("usage: stat <path>", "dim");
        const p = canon(t);
        const n = node(p);
        if (!n) return print("stat: cannot statx '" + t + "': No such file or directory", "err");
        print("  File: " + abbr(p) + (n.ln ? " -> " + n.ln : ""));
        print("  Size: " + ((n.c || "").length || 4096) + "\t" + (n.d ? "directory" : n.ln ? "symbolic link" : "regular file"));
        print("Access: (" + (n.deny ? "0700/drwx------" : n.d ? "0755/drwxr-xr-x" : "0644/-rw-r--r--") + ")  Uid: (1000/TaHooR)   Gid: (100/users)");
        print("Modify: 2026-06-25 13:41:00.000000000 +0530");
      },
      realpath(arg) {
        const t = argSplit(arg)[0] || ".";
        print(canon(t));
      },
      open(arg) {
        if (!arg) return print("open: missing operand", "err");
        if (arg === "about.md" || arg === "about") return goRoute("~/about");
        if (arg === "music" || arg === "music/") { print("opening ~/music ...", "ok"); return openMusic(); }
        let p = canon(arg);
        let n = node(p);
        if (!n && BLOGS[arg.replace(/\/$/, "")]) { p = HOMEP + "/blog/" + arg.replace(/\/$/, ""); n = node(p); }
        if (n && n.go) return goRoute(n.go);
        if (n && n.music) { print("opening ~/music ...", "ok"); return openMusic(); }
        print("open: cannot open '" + arg + "': No such file", "err");
      },
      "xdg-open"(arg) {
        if (!arg) return print("usage: xdg-open <file>", "dim");
        if (window.sidhOpen && window.sidhOpen(arg)) { print("opening " + arg + " ...", "ok"); return; }
        if (arg === "about.md") return goRoute("~/about");
        print("xdg-open: no application registered for '" + arg + "'", "err");
      },
      projects() { printRows(PROJECTS); },
      skills() { printRows(SKILLS); },
      socials() { SOCIALS.forEach(([l, h]) => printLink(l, h)); },
      pwd() { print(CWD); },
      whoami() { print(USER); },
      echo(arg) { print(arg || ""); },
      date() { print(new Date().toString()); },
      clear() { output.innerHTML = ""; },
      uname(arg) {
        if ((arg || "").includes("a")) {
          print("Linux arch 6.x-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux");
        } else {
          print("Linux");
        }
      },
      hostname() { print(HOST); },
      uptime() { print(" 21:31:07 up  3:14,  1 user,  load average: 0.42, 0.37, 0.29"); },
      id() { print("uid=1000(TaHooR) gid=100(users) groups=100(users),1(wheel),26(video),27(audio)"); },
      free() {
        print("               total        used        free      shared  buff/cache   available");
        print("Mem:        16252928     9011204     2143908      612044     5113816     6715308");
        print("Swap:        8388604      262144     8126460");
      },
      df() {
        print("Filesystem      Size  Used Avail Use% Mounted on");
        print("/dev/nvme0n1p2  476G  309G  167G  65% /");
        print("/dev/nvme0n1p1  512M   96M  416M  19% /boot");
        print("/dev/sdb1       1.8T  1.2T  600G  67% /mnt/external");
        print("tmpfs           7.8G   84M  7.7G   2% /run");
      },
      ps() {
        print("  PID TTY          TIME CMD");
        print(" 1337 pts/0    00:00:00 zsh");
        print(" 2048 pts/0    00:00:05 Hyprland");
        print(" 2051 pts/0    00:00:02 waybar");
        print(" 4096 pts/0    00:00:00 alacritty");
        print(" 8080 pts/0    00:00:00 ps");
      },
      lscpu() {
        print("Architecture:            x86_64");
        print("CPU(s):                  12");
        print("Model name:              13th Gen Intel(R) Core(TM) i5");
        print("CPU max MHz:             4500.0000");
        print("Caches:                  L1 544 KiB, L2 5 MiB, L3 12 MiB");
      },
      lsblk() {
        print("NAME        SIZE TYPE MOUNTPOINTS");
        print("sdb         1.8T disk /mnt/external");
        print("nvme0n1     477G disk");
        print("├─nvme0n1p1 512M part /boot");
        print("└─nvme0n1p2 476G part /");
      },
      ip() {
        print("1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536");
        print("    inet 127.0.0.1/8 scope host lo");
        print("2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500");
        print("    inet 192.168.1.42/24 scope global dynamic wlan0");
        print("3: tailscale0: <POINTOPOINT,MULTICAST,NOARP,UP> mtu 1280");
        print("    inet 100.64.0.42/32 scope global tailscale0");
      },
      env() {
        print("SHELL=/bin/zsh");
        print("USER=tahoor");
        print("HOME=/home/tahoor");
        print("EDITOR=nvim");
        print("DE=Hyprland");
        print("TERM=alacritty");
        print("XDG_CURRENT_DESKTOP=Hyprland");
        print("WAYLAND_DISPLAY=wayland-1");
        print("PATH=/usr/local/bin:/usr/bin:/home/tahoor/.local/bin");
      },
      pacman(arg) {
        const parts = argSplit(arg);
        const sub = parts[0] || "-Q";
        if (sub === "-S" || sub === "-Syu") {
          print(":: Synchronizing package databases...", "dim");
          print(":: Starting full system upgrade...", "accent");
          print("there is no package manager here, but the vibes are immaculate.", "ok");
          return;
        }
        if (sub === "-Q" || sub === "-Qs") {
          [
            "base", "base-devel", "linux", "linux-firmware",
            "hyprland", "waybar", "alacritty", "neovim", "git",
            "python", "nodejs", "jdk17-openjdk", "go", "docker"
          ].forEach((name) => print(name, "accent"));
          return;
        }
        if (sub === "-R" || sub === "-Rns") {
          print(":: removing packages... nice try. this filesystem is read-only.", "dim");
          return;
        }
        print("pacman: try `pacman -Syu` or `pacman -Q`", "dim");
      },
      which(arg) {
        if (!arg) return print("usage: which <command>", "dim");
        if (FS["/usr/bin/" + arg] || COMMANDS.includes(arg)) {
          print("/usr/bin/" + arg);
        } else {
          print("which: no " + arg + " in (/usr/local/bin:/usr/bin:/home/tahoor/.local/bin)", "err");
        }
      },
      history() {
        history.forEach((h, i) => print(String(i + 1).padStart(4) + "  " + h));
      },
      cal() {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();
        const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const first = new Date(y, m, 1).getDay();
        const days = new Date(y, m + 1, 0).getDate();
        const title = names[m] + " " + y;
        print(" ".repeat(Math.max(0, Math.floor((20 - title.length) / 2))) + title);
        print("Su Mo Tu We Th Fr Sa");
        let row = "   ".repeat(first);
        for (let d = 1; d <= days; d++) {
          row += String(d).padStart(2) + " ";
          if ((first + d) % 7 === 0) { print(row.replace(/\s+$/, "")); row = ""; }
        }
        if (row.trim()) print(row.replace(/\s+$/, ""));
      },
      cowsay(arg) {
        const txt = arg || "moo";
        print(" " + "_".repeat(txt.length + 2));
        print("< " + txt + " >");
        print(" " + "-".repeat(txt.length + 2));
        print("        \\   ^__^");
        print("         \\  (oo)\\_______");
        print("            (__)\\       )\\/\\");
        print("                ||----w |");
        print("                ||     ||");
      },
      fortune() { print(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]); },
      man(arg) { print("No manual entry for " + (arg || "that") + " — try 'help' instead.", "dim"); },
      su() { print("Password: ", "dim"); print("su: Authentication failure", "err"); },
      ping(arg) {
        if (streaming) return;
        const host = arg ? arg.split(/\s+/)[0] : "archlinux.org";
        print("PING " + host + " (151.101.65.140) 56(84) bytes of data.");
        const lines = [];
        for (let i = 1; i <= 4; i++)
          lines.push(["", "64 bytes from " + host + ": icmp_seq=" + i + " ttl=55 time=" + (11 + Math.random() * 8).toFixed(1) + " ms"]);
        lines.push(["dim", "--- " + host + " ping statistics ---"]);
        lines.push(["dim", "4 packets transmitted, 4 received, 0% packet loss, time 3004ms"]);
        stream(lines, 380);
      },
      adb(arg) {
        const sub = (arg || "").trim();
        if (sub === "devices") {
          print("List of devices attached");
          print("R58N12ABCDEF       device");
          return;
        }
        if (sub === "logcat" || sub.indexOf("logcat") === 0) {
          if (streaming) return;
          stream(LOGCAT, 90);
          return;
        }
        if (!sub) {
          print("Android Debug Bridge version 1.0.41");
          print("usage: adb [devices|logcat|shell|install|...]", "dim");
          return;
        }
        print("adb: unknown command '" + sub + "'", "err");
      },
      shine() { print("shine on, you crazy diamond", "accent"); },
      neofetch() {
        print("Arch Linux x86_64 · " + promptLocation(), "accent");
        print("shell: zsh · wm: Hyprland · compositor: Wayland · terminal: Alacritty");
        print("focus: Flutter · Spring Boot · Next.js · Go · C++ · security");
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode("the full splash lives on "));
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = "~ (home)";
        a.addEventListener("click", (e) => { e.preventDefault(); goRoute("~"); });
        frag.appendChild(a);
        print(frag);
      },
    };
    HANDLERS.hyfetch = HANDLERS.neofetch;
    HANDLERS.fastfetch = HANDLERS.neofetch;
    HANDLERS.ifconfig = HANDLERS.ip;
    HANDLERS.less = HANDLERS.cat;
    HANDLERS.more = HANDLERS.cat;
    HANDLERS.bat = HANDLERS.cat;
    HANDLERS.readlink = HANDLERS.realpath;

    const COMMANDS = [
      "help", "ls", "cd", "cat", "less", "bat", "head", "tail", "wc", "grep",
      "find", "tree", "du", "file", "stat", "realpath", "open", "xdg-open",
      "projects", "skills", "socials", "pwd", "clear", "whoami", "echo", "date",
      "neofetch", "hyfetch", "fastfetch", "uname", "hostname", "uptime", "id",
      "free", "df", "ps", "lscpu", "lsblk", "ip", "env", "which", "history",
      "cal", "cowsay", "fortune", "man", "ping", "su", "adb", "pacman",
      "gcc", "g++", "make", "cmake", "gdb",
    ];

    function run(raw) {
      const trimmed = raw.trim();
      echoCmd(raw);
      if (trimmed) {
        const [cmd, ...rest] = trimmed.split(/\s+/);
        const name = cmd.toLowerCase();
        const arg = rest.join(" ");
        if (name === "sudo") {
          const sub = (rest[0] || "").toLowerCase();
          if (sub && HANDLERS[sub]) {
            print("[sudo] password for TaHooR: ", "dim");
            HANDLERS[sub](rest.slice(1).join(" "));
          } else {
            print("shine on, you crazy diamond", "accent");
            print("(nice try — there is no dark side of the moon, really)", "dim");
          }
        } else if (HANDLERS[name]) HANDLERS[name](arg);
        else if (TEASE[name]) print(TEASE[name], "dim");
        else print("command not found: " + cmd + " — type 'help'", "err");
      }
      scrollBottom();
    }

    function complete() {
      const val = input.value;
      const parts = val.split(/\s+/);
      let pool, token, prefixLen;
      if (parts.length <= 1) {
        pool = COMMANDS;
        token = parts[0] || "";
        prefixLen = 0;
      } else {
        token = parts[parts.length - 1];
        prefixLen = val.length - token.length;
        const slash = token.lastIndexOf("/");
        if (slash >= 0) {
          const dirPart = token.slice(0, slash + 1);
          const base = token.slice(slash + 1);
          const dp = canon(dirPart);
          const dn = node(dp);
          if (dn && dn.d && !dn.deny) {
            pool = children(dp).filter((n) => n.indexOf(base) === 0).map((n) => dirPart + n + (FS[(dp === "/" ? "" : dp) + "/" + n].d ? "/" : ""));
            const matches = pool;
            if (matches.length === 1) input.value = val.slice(0, prefixLen) + matches[0];
            else if (matches.length > 1) print(matches.map((m) => m.slice(m.lastIndexOf("/", m.length - 2) + 1)).join("   "), "dim");
            return;
          }
          pool = [];
        } else {
          pool = children(CWD).map((n) => n + (FS[(CWD === "/" ? "" : CWD) + "/" + n].d ? "/" : "")).concat(["..", "~", "/etc"]);
        }
      }
      const matches = pool.filter((c) => c.indexOf(token) === 0);
      if (matches.length === 1) input.value = val.slice(0, prefixLen) + matches[0] + (matches[0].slice(-1) === "/" ? "" : " ");
      else if (matches.length > 1) print(matches.join("   "), "dim");
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = input.value;
        if (v.trim()) { history.push(v); hIndex = history.length; }
        input.value = "";
        run(v);
      } else if (e.key === "ArrowUp") {
        if (history.length) { hIndex = Math.max(0, hIndex - 1); input.value = history[hIndex] || ""; e.preventDefault(); }
      } else if (e.key === "ArrowDown") {
        if (history.length) { hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] || ""; e.preventDefault(); }
      } else if (e.key === "Tab") {
        e.preventDefault();
        complete();
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        output.innerHTML = "";
      }
    });

    form.addEventListener("click", (e) => {
      if (e.target.tagName !== "A") input.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    startClock();
    initShell();
    try {
      console.log("%cshine on, you crazy diamond", "color:#cba6f7;font:700 14px monospace");
    } catch (_) {}
  });
})();
