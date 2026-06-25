document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('release-loading');
    const contentEl = document.getElementById('release-content');
    const customDropdown = document.getElementById('version-custom-dropdown');
    const dropdownBtn = document.getElementById('version-dropdown-btn');
    const dropdownLabel = document.getElementById('version-dropdown-label');
    const dropdownMenu = document.getElementById('version-dropdown-menu');
    const dateEl = document.getElementById('release-date');
    const summaryEl = document.getElementById('release-summary');
    const badgeEl = document.getElementById('release-status-badge');
    const filterContainerEl = document.getElementById('filter-container');
    const listContainerEl = document.getElementById('pr-list-container');

    let releasesData = [];
    let currentVersion = null;
    let activeFilter = 'All';

    try {
        const response = await fetch('output/tracker/releases.json');
        if (!response.ok) throw new Error('Failed to fetch releases.json');
        releasesData = await response.json();
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

        renderSidebar(); // actually renders the dropdown now
        
        // Select first one by default
        if (releasesData.length > 0) {
            selectVersion(releasesData[0].version);
        }

    } catch (error) {
        console.error(error);
        loadingEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
            <p>Unable to load release data.</p>
        `;
    }

    function groupReleasesByMajor() {
        const groups = {};
        releasesData.forEach(release => {
            const majorStr = release.version.split('.')[0];
            const seriesName = `${majorStr}.x Series`;
            if (!groups[seriesName]) groups[seriesName] = [];
            groups[seriesName].push(release);
        });
        return groups;
    }

    function renderSidebar() {
        if (!dropdownMenu) return;
        
        dropdownMenu.innerHTML = '';
        const groups = groupReleasesByMajor();

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (customDropdown && !customDropdown.contains(e.target)) {
                customDropdown.classList.remove('open');
            }
        });

        if (dropdownBtn) {
            dropdownBtn.addEventListener('click', () => {
                customDropdown.classList.toggle('open');
            });
        }

        Object.keys(groups).forEach(groupName => {
            const optgroup = document.createElement('div');
            optgroup.className = 'dropdown-optgroup';
            optgroup.textContent = groupName;
            dropdownMenu.appendChild(optgroup);

            groups[groupName].forEach(release => {
                const btn = document.createElement('button');
                btn.className = 'dropdown-item';
                btn.dataset.version = release.version;
                btn.textContent = release.version + (release.status === 'upcoming' ? ' (Upcoming)' : '');
                
                btn.addEventListener('click', () => {
                    customDropdown.classList.remove('open');
                    selectVersion(release.version);
                });
                
                dropdownMenu.appendChild(btn);
            });
        });
    }

    function selectVersion(version) {
        currentVersion = version;
        activeFilter = 'All'; 
        
        const release = releasesData.find(r => r.version === version);
        if (release) {
            if (dropdownLabel) {
                dropdownLabel.textContent = release.version + (release.status === 'upcoming' ? ' (Upcoming)' : '');
            }
            
            // Update active state in dropdown
            if (dropdownMenu) {
                const items = dropdownMenu.querySelectorAll('.dropdown-item');
                items.forEach(item => {
                    if (item.dataset.version === version) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }

            // Update URL without reload
            window.history.replaceState(null, null, `#${version}`);
            renderReleaseContent(release);
        }
    }

    function renderReleaseContent(release) {
        badgeEl.className = `release-status-badge ${release.status}`;
        badgeEl.textContent = release.status;
        
        if (release.target_date && release.target_date !== "TBD") {
            dateEl.textContent = release.status === 'upcoming' ? `(Target: ${release.target_date})` : `(Released: ${release.target_date})`;
        } else {
            dateEl.textContent = `(Expected: TBD)`;
        }
        
        summaryEl.textContent = release.summary || `Release notes and changes for Bitcoin Core ${release.version}.`;

        // Extract unique categories from the flattened PR list
        const categoriesSet = new Set();
        if (release.prs) {
            release.prs.forEach(pr => {
                if (pr.categories) {
                    pr.categories.forEach(c => categoriesSet.add(c));
                }
            });
        }
        
        // Sort categories to put Uncategorized/Backport at end
        let sortedCats = Array.from(categoriesSet).sort((a, b) => {
            if (a === 'Uncategorized' || a === 'Backport') return 1;
            if (b === 'Uncategorized' || b === 'Backport') return -1;
            return a.localeCompare(b);
        });

        renderFilters(sortedCats, release);
        renderPRs(release.prs || []);
    }

    function renderFilters(categories, release) {
        filterContainerEl.innerHTML = '';
        
        const allBtn = document.createElement('button');
        allBtn.className = `filter-pill ${activeFilter === 'All' ? 'active' : ''}`;
        allBtn.textContent = `All (${release.prs.length})`;
        allBtn.onclick = () => {
            activeFilter = 'All';
            renderReleaseContent(release);
        };
        filterContainerEl.appendChild(allBtn);

        categories.forEach(cat => {
            if (cat === 'Uncategorized' && categories.length > 1) return; // Optional logic, we can keep it
            
            const count = release.prs.filter(pr => pr.categories.includes(cat)).length;
            const btn = document.createElement('button');
            btn.className = `filter-pill ${activeFilter === cat ? 'active' : ''}`;
            btn.textContent = `${cat} (${count})`;
            btn.onclick = () => {
                activeFilter = cat;
                renderReleaseContent(release);
            };
            filterContainerEl.appendChild(btn);
        });
    }

    function renderPRs(prs) {
        listContainerEl.innerHTML = '';
        
        const filteredPRs = activeFilter === 'All' 
            ? prs 
            : prs.filter(pr => pr.categories && pr.categories.includes(activeFilter));

        const denseList = document.createElement('div');
        denseList.className = 'pr-dense-list';

        filteredPRs.forEach(pr => {
            const prNum = pr.pr.replace('#', '');
            const pubSummary = pr.public_summary || pr.description || "No public summary provided.";
            const techSummary = pr.technical_summary || "";
            const prTitle = pr.title || pubSummary; // Fallback to pubSummary if no title
            
            let catTags = '';
            if (pr.categories) {
                pr.categories.forEach(c => {
                    if (c !== 'Uncategorized') {
                        catTags += `<span class="pr-cat-tag">${c}</span>`;
                    }
                });
            }

            // Create PR Item Container
            const prItem = document.createElement('div');
            prItem.className = 'pr-item';
            
            // Meta Tags (Author & Merge Time)
            let metaTags = '';
            let authorBlock = '';
            
            if (pr.author && pr.author !== 'nan' && pr.author !== 'None') {
                if (pr.author_uuid) {
                    authorBlock = `(by <a href="https://sorukumar.github.io/orange-dev-network/profile.html?uuid=${pr.author_uuid}" target="_blank" class="pr-meta-author-link">@${pr.author}</a>)`;
                } else {
                    authorBlock = `(by <a href="https://github.com/${pr.author}" target="_blank" class="pr-meta-author-link">@${pr.author}</a>)`;
                }
            }

            if (pr.merge_time_days !== undefined && pr.merge_time_days !== null) {
                const speedClass = pr.merge_time_days < 5 ? 'fast' : (pr.merge_time_days > 45 ? 'slow' : 'normal');
                metaTags += `<span class="pr-meta-tag ${speedClass}"><i class="fas fa-clock" style="font-size: 0.75rem; margin-right: 3px;"></i>${pr.merge_time_days} days to merge</span>`;
            }

            // Header Row (PR Number, Title, Tags)
            const headerRow = document.createElement('div');
            headerRow.className = 'pr-header-row';
            headerRow.innerHTML = `
                <div class="pr-title-container">
                    <div class="pr-title-topline">
                        <a href="https://github.com/bitcoin/bitcoin/pull/${prNum}" target="_blank" class="pr-number-link">[#${prNum}]</a>
                        ${authorBlock ? `<span class="pr-title-author">${authorBlock}</span>` : ''}
                        ${metaTags ? `<span class="pr-meta-group">${metaTags}</span>` : ''}
                    </div>
                    <span class="pr-title-text">${prTitle}</span>
                </div>
                <div class="pr-cat-tags-container">
                    ${catTags}
                </div>
            `;
            prItem.appendChild(headerRow);

            // Public Summary (only if it differs from the title, or if we have one)
            if (pubSummary && pubSummary !== prTitle) {
                const summaryP = document.createElement('p');
                summaryP.className = 'pr-public-summary';
                summaryP.textContent = pubSummary;
                prItem.appendChild(summaryP);
            } else if (prTitle === pubSummary) {
                // If title and pubsummary are the same (e.g. old data), we just show it as title
            }

            // Technical Details Toggle
            if (techSummary && techSummary.trim() !== "" && techSummary !== "Technical details pending.") {
                const detailsContainer = document.createElement('div');
                detailsContainer.className = 'pr-details-container';
                
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'pr-details-toggle';
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.innerHTML = `<i class="fas fa-chevron-down"></i> Technical Details`;
                
                const techContent = document.createElement('div');
                techContent.className = 'pr-technical-content';
                techContent.textContent = techSummary;
                
                toggleBtn.addEventListener('click', () => {
                    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                    toggleBtn.setAttribute('aria-expanded', !isExpanded);
                    techContent.classList.toggle('open');
                });
                
                detailsContainer.appendChild(toggleBtn);
                detailsContainer.appendChild(techContent);
                prItem.appendChild(detailsContainer);
            }

            denseList.appendChild(prItem);
        });

        listContainerEl.appendChild(denseList);
    }
});
