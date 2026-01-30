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
            <nav>
                ${this.links.map(link => {
            const isActive = currentPath === link.url ? 'class="active"' : '';
            return `<a href="${link.url}" ${isActive}>${link.name}</a>`;
        }).join('')}
            </nav>
        `;

        container.innerHTML = navHtml;
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
