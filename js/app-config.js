document.addEventListener('DOMContentLoaded', () => {
    if (typeof BitcoinLabsApp !== 'undefined') {
        BitcoinLabsApp.init({
            isApp: true,
            appName: 'orange-dev-tracker',
            appHomeUrl: 'index.html',
            navLinks: [
                { name: 'Home', url: 'index.html' },
                { name: 'Engineering', url: 'engineering.html' },
                { name: 'Protocol Pulse', url: 'pulse.html' },
                { name: 'Releases', url: 'releases.html' },
                { name: 'Health', url: 'health.html' }
            ],
            footerLinks: [
                { name: 'Methodology & Definitions', url: 'https://sorukumar.github.io/orange-dev-tracker/methodology.html' }
            ],
            feedbackUrl: 'roadmap.html',
            suiteLinks: [
                { name: 'orange-dev-network', url: 'https://sorukumar.github.io/orange-dev-network', icon: 'fas fa-project-diagram' },
                { name: 'this-week-in-bitcoin', url: 'https://sorukumar.github.io/this-week-in-bitcoin', icon: 'fas fa-newspaper' }
            ]
        });
    }
});
