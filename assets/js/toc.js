document.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('article');
    const tocContainer = document.querySelector('.toc');

    if (!article || !tocContainer) return;

    const headings = article.querySelectorAll('h1, h2, h3');
    if (headings.length < 2) {
        tocContainer.style.display = 'none';
        return;
    }

    const windowed = window.matchMedia('(min-width: 761px) and (pointer: fine)').matches;
    const scrollRoot = windowed ? article.closest('.term-body') : null;

    function scrollToHeading(target, smooth) {
        if (scrollRoot) {
            const top = target.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top + scrollRoot.scrollTop - 16;
            scrollRoot.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        } else {
            const top = target.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        }
    }

    const tocNav = document.createElement('nav');
    tocNav.className = 'toc-nav';
    tocNav.setAttribute('aria-label', 'Table of contents');

    const tocTitle = document.createElement('span');
    tocTitle.className = 'toc-title';
    tocTitle.textContent = 'Contents';
    tocNav.appendChild(tocTitle);

    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';

    let headingIndex = 0;

    headings.forEach((heading, index) => {
        if (index === 0 && heading.tagName === 'H1') return;

        if (!heading.id) {
            heading.id = `section-${headingIndex}`;
        }
        headingIndex++;

        const li = document.createElement('li');
        li.className = `toc-item toc-${heading.tagName.toLowerCase()}`;

        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = 'toc-link';
        link.textContent = heading.textContent;

        // Smooth scroll on click
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(heading.id);
            if (target) {
                scrollToHeading(target, true);
                history.pushState(null, '', `#${heading.id}`);
            }
        });

        li.appendChild(link);
        tocList.appendChild(li);
    });

    tocNav.appendChild(tocList);
    tocContainer.appendChild(tocNav);

    const observerOptions = {
        root: scrollRoot,
        rootMargin: scrollRoot ? '-8px 0px -78% 0px' : '-100px 0px -70% 0px',
        threshold: 0
    };

    let currentActive = null;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Remove active from all links
                tocList.querySelectorAll('.toc-link').forEach(link => {
                    link.classList.remove('active');
                });

                const activeLink = tocList.querySelector(`a[href="#${entry.target.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    currentActive = activeLink;
                }
            }
        });
    }, observerOptions);

    headings.forEach((heading, index) => {
        if (index === 0 && heading.tagName === 'H1') return;
        observer.observe(heading);
    });

    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            setTimeout(() => scrollToHeading(target, true), 120);
        }
    }
});
