/**
 * Shared UI Components for Orange Dev Tracker
 */

const Navigation = {
    links: [
        { name: 'Dashboard', url: 'dashboard.html' },
        { name: 'Contributors', url: 'contributors.html' },
        { name: 'Codebase', url: 'codebase.html' },
        { name: 'Engineering', url: 'engineering.html' },
        { name: 'Health & Culture', url: 'health.html' },
        { name: 'Methodology', url: 'methodology.html' }
    ],

    render() {
        const container = document.getElementById('main-nav');
        if (!container) return;

        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

        const navHtml = `
            <button class="mobile-nav-toggle" aria-label="Toggle navigation">
                <i class="fas fa-bars"></i>
            </button>
            <nav id="nav-menu">
                ${this.links.map(link => {
            const isActive = currentPath === link.url ? 'class="active"' : '';
            return `<a href="${link.url}" ${isActive}>${link.name}</a>`;
        }).join('')}
            </nav>
        `;

        container.innerHTML = navHtml;

        // Add event listener for mobile toggle
        const toggleBtn = container.querySelector('.mobile-nav-toggle');
        const navMenu = container.querySelector('#nav-menu');

        if (toggleBtn && navMenu) {
            toggleBtn.addEventListener('click', () => {
                navMenu.classList.toggle('open');
                const icon = toggleBtn.querySelector('i');
                if (navMenu.classList.contains('open')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            });
        }
    }
};

// Auto-init when script is loaded or on DOMContentLoaded
function initSharedComponents() {
    Navigation.render();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedComponents);
} else {
    initSharedComponents();
}
