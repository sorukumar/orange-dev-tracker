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
                { name: 'Methodology & Definitions', url: 'https://tracker.bitcoindatalabs.org/methodology.html' }
            ],
            feedbackUrl: 'roadmap.html',
            suiteLinks: [
                { name: 'orange-dev-network', url: 'https://network.bitcoindatalabs.org', icon: 'fas fa-project-diagram' },
                { name: 'this-week-in-bitcoin', url: 'https://twib.bitcoindatalabs.org', icon: 'fas fa-newspaper' }
            ]
        });
    }
});
