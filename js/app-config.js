document.addEventListener('DOMContentLoaded', () => {
    if (typeof BitcoinLabsApp !== 'undefined') {
        BitcoinLabsApp.init({
            isApp: true,
            appName: 'orange-dev-tracker',
            appHomeUrl: 'index.html',
            navLinks: [
                { name: 'Dashboard', url: 'index.html' },
                { name: 'Contributors', url: 'contributors.html' },
                { name: 'Codebase', url: 'codebase.html' },
                { name: 'Engineering', url: 'engineering.html' },
                { name: 'Health & Culture', url: 'health.html' },
                { name: 'Methodology', url: 'methodology.html' },
                { name: 'Roadmap & Feedback', url: 'roadmap.html' }
            ],
            suiteLinks: [
                { name: 'Network', url: 'https://sorukumar.github.io/orange-dev-network', icon: 'fas fa-project-diagram' }
            ]
        });
    }
});
