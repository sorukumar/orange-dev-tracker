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
    const highlightsContainerEl = document.getElementById('release-highlights-container');
    const highlightsListEl = document.getElementById('release-highlights-list');
    const filterContainerEl = document.getElementById('filter-container');
    const listContainerEl = document.getElementById('pr-list-container');
    const searchInputEl = document.getElementById('pr-search-input');

    let releasesData = [];
    let currentVersion = null;
    let activeFilter = 'All';
    let searchQuery = '';
    let renderLimit = 15;

    if (searchInputEl) {
        searchInputEl.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderLimit = 15;
            
            if (searchQuery.length > 0) {
                // Global search mode
                document.querySelector('.release-header').style.display = 'none';
                filterContainerEl.style.display = 'none';
                
                let allPRs = [];
                releasesData.forEach(release => {
                    if (release.prs) {
                        release.prs.forEach(pr => {
                            // Clone PR to inject release version as a tag
                            const prCopy = { ...pr };
                            if (!prCopy.categories) prCopy.categories = [];
                            prCopy.categories = [`v${release.version}`, ...prCopy.categories];
                            allPRs.push(prCopy);
                        });
                    }
                });
                
                activeFilter = 'All'; // Ignore category filter during global search
                renderPRs(allPRs);
            } else {
                // Restore release view mode
                document.querySelector('.release-header').style.display = '';
                filterContainerEl.style.display = '';
                if (currentVersion) {
                    const release = releasesData.find(r => r.version === currentVersion);
                    if (release) renderPRs(release.prs || []);
                }
            }
        });
    }

    try {
        const response = await fetch(DATA_PATH_PREFIX + 'output/tracker/releases.json');
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
        searchQuery = '';
        renderLimit = 15;
        if (searchInputEl) searchInputEl.value = '';
        
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
        
        if (release.last_active_date && release.last_active_date !== "TBD") {
            dateEl.textContent = release.status === 'upcoming' ? `(Target: TBD | Last Active: ${release.last_active_date})` : `(Released: ${release.last_active_date})`;
        } else {
            dateEl.textContent = `(Expected: TBD)`;
        }
        
        if (release.release_summary) {
            summaryEl.textContent = release.release_summary;
        } else {
            summaryEl.textContent = release.summary || `A complete log of what shipped, who built it, and how long it took for Bitcoin Core ${release.version}.`;
        }

        if (release.highlights && release.highlights.length > 0) {
            if (highlightsContainerEl) highlightsContainerEl.style.display = 'block';
            if (highlightsListEl) {
                highlightsListEl.innerHTML = release.highlights.map(h => {
                    // Convert markdown bold to styled strong tag
                    const formattedHtml = h.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent);">$1</strong>');
                    return `<li style="margin-bottom: 8px;">${formattedHtml}</li>`;
                }).join('');
            }
        } else {
            if (highlightsContainerEl) highlightsContainerEl.style.display = 'none';
        }

        // Extract unique categories from the flattened PR list
        const categoriesSet = new Set();
        if (release.prs) {
            release.prs.forEach(pr => {
                if (pr.categories) {
                    pr.categories = pr.categories.map(c => c === 'Uncategorized' ? 'Miscellaneous' : c);
                    pr.categories.forEach(c => categoriesSet.add(c));
                }
            });
        }
        
        // Sort categories to put Miscellaneous/Backport at end
        let sortedCats = Array.from(categoriesSet).sort((a, b) => {
            if (a === 'Miscellaneous' || a === 'Backport') return 1;
            if (b === 'Miscellaneous' || b === 'Backport') return -1;
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
            renderLimit = 15;
            renderReleaseContent(release);
        };
        filterContainerEl.appendChild(allBtn);

        categories.forEach(cat => {
            const count = release.prs.filter(pr => pr.categories.includes(cat)).length;
            const btn = document.createElement('button');
            btn.className = `filter-pill ${activeFilter === cat ? 'active' : ''}`;
            btn.textContent = `${cat} (${count})`;
            btn.onclick = () => {
                activeFilter = cat;
                renderLimit = 15;
                renderReleaseContent(release);
            };
            filterContainerEl.appendChild(btn);
        });
    }

    function renderPRs(prs) {
        listContainerEl.innerHTML = '';
        
        const filteredPRs = prs.filter(pr => {
            const matchesFilter = activeFilter === 'All' || (pr.categories && pr.categories.includes(activeFilter));
            if (!matchesFilter) return false;
            
            if (searchQuery) {
                const searchTarget = `${pr.pr} ${pr.title || ''} ${pr.author || ''} ${pr.author_name || ''} ${pr.public_summary || ''}`.toLowerCase();
                if (!searchTarget.includes(searchQuery)) return false;
            }
            return true;
        });

        const denseList = document.createElement('div');
        denseList.className = 'pr-dense-list';

        filteredPRs.slice(0, renderLimit).forEach(pr => {
            const prNum = pr.pr.replace('#', '');
            const pubSummary = pr.public_summary || pr.description || "No public summary provided.";
            const techSummary = pr.technical_summary || "";
            const prTitle = pr.title || pubSummary; // Fallback to pubSummary if no title
            
            let catTags = '';
            if (pr.categories) {
                pr.categories.forEach(c => {
                    catTags += `<span class="pr-cat-tag">${c}</span>`;
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
        
        if (filteredPRs.length > renderLimit) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.style.textAlign = 'center';
            loadMoreContainer.style.marginTop = '24px';
            
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = `Load More (${filteredPRs.length - renderLimit} remaining)`;
            
            loadMoreBtn.addEventListener('click', () => {
                renderLimit += 15;
                renderPRs(prs);
            });
            
            loadMoreContainer.appendChild(loadMoreBtn);
            listContainerEl.appendChild(loadMoreContainer);
        }
    }
});
