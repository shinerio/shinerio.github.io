document.addEventListener('DOMContentLoaded', function () {
    const tocLinks = Array.from(document.querySelectorAll('.article-toc-nav .toc-link'));
    if (tocLinks.length === 0) return;

    const headingTargets = tocLinks
        .map((link) => {
            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return null;
            const heading = document.getElementById(href.slice(1));
            if (!heading) return null;
            return { link: link, heading: heading };
        })
        .filter(Boolean);

    if (headingTargets.length === 0) return;

    const clearActive = () => {
        tocLinks.forEach((link) => link.classList.remove('active'));
    };

    const setActive = (id) => {
        clearActive();
        const activeLink = document.querySelector(`.article-toc-nav .toc-link[href="#${CSS.escape(id)}"]`);
        if (activeLink) activeLink.classList.add('active');
    };

    tocLinks.forEach((link) => {
        link.addEventListener('click', function (event) {
            const href = link.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            const heading = document.getElementById(href.slice(1));
            if (!heading) return;

            event.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', href);
            setActive(href.slice(1));
        });
    });

    const updateActiveByScroll = () => {
        const offsetTop = 110;
        let currentId = headingTargets[0].heading.id;

        for (const item of headingTargets) {
            const top = item.heading.getBoundingClientRect().top;
            if (top - offsetTop <= 0) {
                currentId = item.heading.id;
            } else {
                break;
            }
        }

        setActive(currentId);
    };

    let ticking = false;
    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            updateActiveByScroll();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener('resize', updateActiveByScroll);
    updateActiveByScroll();

    if (window.location.hash) {
        const hashId = window.location.hash.slice(1);
        if (document.getElementById(hashId)) {
            setActive(hashId);
        }
    }
});
