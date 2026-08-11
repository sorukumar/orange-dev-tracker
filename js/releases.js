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
    let activeAuthorFilter = null;
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
                const kpisEl = document.getElementById('release-kpis');
                const topContribsEl = document.getElementById('top-contributors-container');
                if (kpisEl) kpisEl.style.display = 'none';
                if (topContribsEl) topContribsEl.style.display = 'none';

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

        if (releasesData.length > 0) {
            let initialVersion = releasesData[0].version;
            const hashVersion = window.location.hash.replace('#', '');
            if (hashVersion && releasesData.some(r => r.version === hashVersion)) {
                initialVersion = hashVersion;
            }
            selectVersion(initialVersion);
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
        activeAuthorFilter = null;
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

        let summaryText = release.release_summary || release.summary || `A curated log of high-impact features shipped in Bitcoin Core ${release.version}.`;
        let releaseNotesLink = release.status === 'upcoming' 
            ? 'https://github.com/bitcoin/bitcoin/milestones' 
            : `https://github.com/bitcoin/bitcoin/releases/tag/v${release.version}`;
        let linkText = release.status === 'upcoming' ? 'View active milestones' : 'Read official release notes';
            
        let progressHtml = '';
        if (release.status === 'upcoming' && release.milestone_progress) {
            const openPRs = release.milestone_progress.open_prs || 0;
            const closedPRs = release.milestone_progress.closed_prs || 0;
            const totalPRs = openPRs + closedPRs;
            const percent = totalPRs > 0 ? Math.round((closedPRs / totalPRs) * 100) : 0;
            
            progressHtml = `
            <div style="margin-top: 15px; margin-bottom: 5px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: var(--text-secondary); font-weight: 600;">
                    <span>Milestone Progress</span>
                    <span>${percent}% Complete (${openPRs} Open / ${closedPRs} Closed)</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.5s ease;"></div>
                </div>
            </div>`;
        }
            
        summaryEl.innerHTML = `${progressHtml} <div style="margin-top: 12px;">${summaryText} <a href="${releaseNotesLink}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600; font-size: 0.9em; margin-left: 8px; white-space: nowrap;">${linkText} <i class="fas fa-external-link-alt" style="font-size: 0.8em; margin-left: 2px;"></i></a></div>`;

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

        // Extract unique impact categories from the PR list for filters
        const impactCategoriesSet = new Set();
        if (release.prs) {
            release.prs.forEach(pr => {
                if (pr.impact_category) {
                    impactCategoriesSet.add(pr.impact_category);
                } else {
                    impactCategoriesSet.add('Maintenance & Tech Debt');
                }
            });
        }

        // Sort categories to put Maintenance at end
        let sortedCats = Array.from(impactCategoriesSet).sort((a, b) => {
            if (a === 'Maintenance & Tech Debt') return 1;
            if (b === 'Maintenance & Tech Debt') return -1;
            return a.localeCompare(b);
        });

        renderFilters(sortedCats, release);
        renderReleaseKPIs(release, sortedCats);
        renderTopContributors(release);
        renderPRs(release.prs || []);
    }

    function renderReleaseKPIs(release, sortedCats) {
        const kpiContainer = document.getElementById('release-kpis');
        if (!kpiContainer || !release.prs || release.prs.length === 0) {
            if (kpiContainer) kpiContainer.style.display = 'none';
            return;
        }

        const highImpactPRs = release.prs.length;
        const totalPRs = release.total_prs_in_release || highImpactPRs;
        const uniqueContributors = new Set(release.prs.filter(pr => pr.author && pr.author !== 'nan' && pr.author !== 'None').map(pr => pr.author)).size;
        const categoriesTouched = sortedCats.length;

        let validMergeTimes = release.prs.map(pr => pr.merge_time_days).filter(d => d !== undefined && d !== null);
        const avgMergeTime = validMergeTimes.length > 0 ? Math.round(validMergeTimes.reduce((a, b) => a + b, 0) / validMergeTimes.length) : '-';

        kpiContainer.style.display = 'grid';
        kpiContainer.innerHTML = `
            <div style="padding: 20px; border-right: 1px solid rgba(255,255,255,0.05); text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 10px;">
                    <i class="fas fa-code-branch" style="margin-right: 6px; opacity: 0.7;"></i>High-Impact PRs
                </div>
                <div style="font-size: 2.5em; font-weight: bold; color: var(--text-primary); margin: 5px 0 2px 0; line-height: 1;">${highImpactPRs}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.8; margin-top: 5px;">(Total Merged: ~${totalPRs})</div>
            </div>
            <div style="padding: 20px; border-right: 1px solid rgba(255,255,255,0.05); text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 10px;">
                    <i class="fas fa-users" style="margin-right: 6px; opacity: 0.7;"></i>Contributors
                </div>
                <div style="font-size: 2.5em; font-weight: bold; color: var(--text-primary); margin: 5px 0 2px 0; line-height: 1;">${uniqueContributors}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.8; margin-top: 5px;">(in featured PRs)</div>
            </div>
            <div style="padding: 20px; text-align: center; flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); font-weight: 600; margin-bottom: 10px;">
                    <i class="fas fa-clock" style="margin-right: 6px; opacity: 0.7;"></i>Avg Days in Review
                </div>
                <div style="font-size: 2.5em; font-weight: bold; color: var(--text-primary); margin: 5px 0; line-height: 1;">${avgMergeTime}</div>
            </div>
        `;
    }

    function renderTopContributors(release) {
        const container = document.getElementById('top-contributors-container');
        const list = document.getElementById('top-contributors-list');
        if (!container || !list || !release.prs || release.prs.length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        const authorCounts = {};
        const authorUUIDs = {};

        release.prs.forEach(pr => {
            const author = pr.author;
            if (author && author !== 'nan' && author !== 'None') {
                authorCounts[author] = (authorCounts[author] || 0) + 1;
                if (pr.author_uuid) authorUUIDs[author] = pr.author_uuid;
            }
        });

        const sortedAuthors = Object.keys(authorCounts).sort((a, b) => authorCounts[b] - authorCounts[a]);
        const topAuthors = sortedAuthors.slice(0, 5);

        if (topAuthors.length === 0) {
            container.style.display = 'none';
            return;
        }

        list.innerHTML = topAuthors.map(author => {
            const count = authorCounts[author];
            const uuid = authorUUIDs[author];
            const url = uuid ? `https://network.bitcoindatalabs.org/profile.html?uuid=${uuid}` : `https://github.com/${author}`;
            const isActive = activeAuthorFilter === author;

            return `
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button class="contributor-badge ${isActive ? 'active' : ''}" data-author="${author}" style="cursor: pointer; border: ${isActive ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'}; background: ${isActive ? 'rgba(247, 147, 26, 0.1)' : ''}">
                        <span class="contributor-badge-name">@${author}</span>
                        <span class="contributor-badge-count">${count} PR${count > 1 ? 's' : ''}</span>
                    </button>
                    <a href="${url}" target="_blank" style="color: var(--text-secondary); font-size: 0.8rem; padding: 4px; border-radius: 4px; transition: color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-secondary)'" title="View Profile">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;
        }).join('');

        // Add event listeners to the new buttons
        const buttons = list.querySelectorAll('button.contributor-badge');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const author = e.currentTarget.dataset.author;
                if (activeAuthorFilter === author) {
                    activeAuthorFilter = null; // toggle off
                } else {
                    activeAuthorFilter = author; // toggle on
                }
                renderLimit = 15;
                renderReleaseContent(release);
            });
        });

        container.style.display = 'block';
    }

    function renderFilters(categories, release) {
        filterContainerEl.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = `filter-pill ${activeFilter === 'All' ? 'active' : ''}`;
        allBtn.textContent = `All (${release.prs.length})`;
        allBtn.onclick = () => {
            activeFilter = 'All';
            activeAuthorFilter = null; // Clearing main filter also clears author filter
            renderLimit = 15;
            renderReleaseContent(release);
        };
        filterContainerEl.appendChild(allBtn);

        categories.forEach(cat => {
            const count = release.prs.filter(pr => (pr.impact_category || 'Maintenance & Tech Debt') === cat).length;
            const pct = release.prs.length > 0 ? Math.round((count / release.prs.length) * 100) : 0;
            const btn = document.createElement('button');
            btn.className = `filter-pill ${activeFilter === cat ? 'active' : ''}`;
            btn.textContent = `${cat} (${count})`;
            btn.style.setProperty('--fill-pct', `${pct}%`);
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
            const matchesFilter = activeFilter === 'All' || (pr.impact_category || 'Maintenance & Tech Debt') === activeFilter;
            if (!matchesFilter) return false;

            if (activeAuthorFilter && pr.author !== activeAuthorFilter) {
                return false;
            }

            if (searchQuery) {
                const searchTarget = `${pr.pr} ${pr.title || ''} ${pr.author || ''} ${pr.author_name || ''} ${pr.public_summary || ''}`.toLowerCase();
                if (!searchTarget.includes(searchQuery)) return false;
            }
            return true;
        });

        filteredPRs.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));

        const denseList = document.createElement('div');
        denseList.className = 'pr-dense-list';

        filteredPRs.slice(0, renderLimit).forEach(pr => {
            const prNum = pr.pr.replace('#', '');
            const pubSummary = pr.public_summary || pr.description || "No public summary provided.";
            const techSummary = pr.technical_summary || "";
            const prTitle = pr.title || ""; // No fallback to pubSummary

            let catTags = '';
            if (pr.categories) {
                pr.categories.forEach(c => {
                    catTags += `<span class="pr-cat-tag">${c}</span>`;
                });
            }

            // Create PR Item Container
            const prItem = document.createElement('div');
            prItem.className = 'pr-item';

            // Meta tags (fast/slow, review_count, author)
            let metaTags = '';
            let authorBlock = '';

            if (pr.author && pr.author !== 'nan' && pr.author !== 'None') {
                if (pr.author_uuid) {
                    authorBlock = `<span class="pr-title-author">(by <a href="https://network.bitcoindatalabs.org/profile.html?uuid=${pr.author_uuid}" target="_blank" class="pr-meta-author-link">@${pr.author}</a>)</span>`;
                } else {
                    authorBlock = `<span class="pr-title-author">(by <a href="https://github.com/${pr.author}" target="_blank" class="pr-meta-author-link">@${pr.author}</a>)</span>`;
                }
            }

            if (pr.days_in_review !== undefined && pr.days_in_review !== null) {
                const speedClass = pr.days_in_review < 30 ? 'fast' : (pr.days_in_review > 180 ? 'slow' : 'normal');
                if (speedClass !== 'normal') {
                    metaTags += `<span class="pr-meta-tag ${speedClass}"><i class="far fa-clock" style="font-size: 0.75rem; margin-right: 3px;"></i>${pr.days_in_review} days in review</span>`;
                } else {
                    metaTags += `<span class="pr-meta-tag" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border-color: rgba(255,255,255,0.1);"><i class="far fa-clock" style="font-size: 0.75rem; margin-right: 3px;"></i>${pr.days_in_review} days in review</span>`;
                }
            }
            
            if (pr.review_count !== undefined && pr.review_count > 0) {
                metaTags += `<span class="pr-meta-tag" style="background: rgba(247, 147, 26, 0.1); border-color: rgba(247, 147, 26, 0.3); color: var(--accent);"><i class="fas fa-comments" style="font-size: 0.75rem; margin-right: 3px;"></i>${pr.review_count} review comments</span>`;
            }

            const titleHTML = prTitle ? `<span class="pr-title-text">${prTitle}</span>` : '';

            // Header Row (PR Number, Title, Tags)
            let headerHTML = `
                <div class="pr-header-row">
                    <div class="pr-title-container">
                        <div class="pr-title-topline">
                            <a href="https://github.com/bitcoin/bitcoin/pull/${prNum}" target="_blank" class="pr-number-link">[#${prNum}]</a>
                            ${authorBlock}
                            <div class="pr-meta-group">
                                ${metaTags}
                            </div>
                        </div>
                        ${titleHTML}
                    </div>
                    <div class="pr-cat-tags-container">
                        ${catTags}
                    </div>
                </div>
            `;
            prItem.innerHTML = headerHTML;

            // Public Summary (always render if it exists)
            if (pubSummary) {
                const summaryP = document.createElement('p');
                summaryP.className = 'pr-public-summary';
                summaryP.textContent = pubSummary;
                // Add a slightly larger font size since it's acting as the main description when title is missing
                if (!prTitle) {
                    summaryP.style.fontSize = '14px';
                    summaryP.style.color = 'var(--text-primary)';
                }
                prItem.appendChild(summaryP);
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
