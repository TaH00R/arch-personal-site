// Highlight.js init — Catppuccin-style tab bar + copy button + line numbers
document.addEventListener('DOMContentLoaded', function () {
    // Language display names
    var langNames = {
        bash: 'bash', sh: 'shell', python: 'python', py: 'python',
        javascript: 'javascript', js: 'javascript', typescript: 'typescript',
        ts: 'typescript', cpp: 'c++', c: 'c', java: 'java',
        kotlin: 'kotlin', kt: 'kotlin', rust: 'rust', go: 'go',
        html: 'html', css: 'css', scss: 'scss', json: 'json',
        yaml: 'yaml', yml: 'yaml', xml: 'xml', sql: 'sql',
        makefile: 'makefile', ruby: 'ruby', php: 'php', swift: 'swift',
    };

    // Map Prism-style classes to hljs
    document.querySelectorAll('code[class*="language-"]').forEach(function (block) {
        var lang = block.className.match(/language-(\S+)/);
        if (lang) block.classList.add(lang[1]);
    });

    // Run highlight.js
    hljs.highlightAll();

    // Line numbers
    hljs.initLineNumbersOnLoad();

    // Inject tab bar + copy button into each <pre>
    document.querySelectorAll('pre').forEach(function (pre) {
        var code = pre.querySelector('code');
        if (!code) return;

        // ── Tab bar with language label ──
        if (!pre.hasAttribute('data-filename')) {
            var lang = '';
            var m = code.className.match(/language-(\S+)/);
            if (m) lang = m[1];
            if (!lang) {
                // fallback: first non-hljs class
                code.className.split(/\s+/).some(function (c) {
                    if (c !== 'hljs' && !c.startsWith('hljs-')) { lang = c; return true; }
                });
            }

            if (lang) {
                var name = langNames[lang] || lang;
                var bar = document.createElement('div');
                bar.className = 'code-tab-bar';
                var tab = document.createElement('span');
                tab.className = 'code-tab';
                tab.textContent = name;
                bar.appendChild(tab);
                pre.insertBefore(bar, pre.firstChild);
            }
        }

        // ── Copy button ──
        if (pre.querySelector('.code-copy-btn')) return;

        var btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.title = 'Copy to clipboard';
        btn.innerHTML =
            '<svg viewBox="0 0 24 24"><path d="M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1"/><rect x="6" y="5" width="16" height="18" rx="1.5" ry="1.5"/></svg>';

        btn.addEventListener('click', function () {
            var text = '';
            var cells = code.querySelectorAll('.hljs-ln-code');
            if (cells.length) {
                cells.forEach(function (c) { text += c.textContent + '\n'; });
                text = text.replace(/\n$/, '');
            } else {
                text = code.textContent;
            }

            navigator.clipboard.writeText(text).then(function () {
                btn.classList.add('copied');
                btn.innerHTML =
                    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(function () {
                    btn.classList.remove('copied');
                    btn.innerHTML =
                        '<svg viewBox="0 0 24 24"><path d="M3 19a2 2 0 0 1-1-2V2a2 2 0 0 1 1-1h13a2 2 0 0 1 2 1"/><rect x="6" y="5" width="16" height="18" rx="1.5" ry="1.5"/></svg>';
                }, 2000);
            });
        });

        pre.appendChild(btn);
    });
});
