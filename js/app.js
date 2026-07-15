// ============================================
// ONLINE AUCTION PLATFORM - Frontend JavaScript
// ============================================

// ===== STATE MANAGEMENT =====
const AppState = {
    currentUser: null,
    isAuthenticated: false,
    auctions: [],
    categories: [],
    myBids: [],
    myAuctions: [],
    notifications: [],
    users: [],
    isLoading: false,
    currentPage: 1,
    filter: 'all',
    searchQuery: ''
};

// ===== API SERVICE =====
const Api = window.ApiService;

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    return formatDate(dateStr);
}

function getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
}

function getRandomPastelColor(name) {
    const colors = ['#6c5ce7', '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#fdcb6e', '#a29bfe', '#55efc4'];
    let hash = 0;
    for (let i = 0; i < (name || 'user').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// ===== TOAST NOTIFICATIONS =====
const Toast = {
    show(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i> ${message}`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ===== UI RENDERERS =====
const UI = {
    renderNav() {
        const header = document.querySelector('header');
        if (!header) return;
        
        const isLoggedIn = AppState.isAuthenticated;
        const user = AppState.currentUser;
        
        let authContent = '';
        if (isLoggedIn) {
            authContent = `
                <div class="user-menu">
                    <span style="color:var(--gray-400);font-size:0.9rem;">${user.name}</span>
                    <div class="user-avatar" id="user-avatar" style="background:${getRandomPastelColor(user.name)}">
                        ${getInitials(user.name)}
                    </div>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                        ${user.role === 'admin' ? '<a href="admin.html"><i class="fas fa-shield-alt"></i> Admin Panel</a>' : ''}
                        <a href="create-auction.html"><i class="fas fa-plus-circle"></i> Create Auction</a>
                        <div class="divider"></div>
                        <a href="#" id="logout-btn" class="logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            `;
        } else {
            authContent = `
                <div class="auth-buttons">
                    <a href="login.html" class="btn-login">Login</a>
                    <a href="register.html" class="btn-register">Register</a>
                </div>
            `;
        }
        
        const nav = header.querySelector('nav');
        if (nav) {
            const navLinks = nav.querySelector('.nav-links');
            if (navLinks) nav.removeChild(navLinks);
            
            const authDiv = nav.querySelector('.auth-buttons, .user-menu');
            if (authDiv) nav.removeChild(authDiv);
            
            const linksHTML = `
                <div class="nav-links" id="nav-links">
                    <a href="index.html" class="${window.location.pathname.includes('index') || window.location.pathname.endsWith('/') ? 'active' : ''}">Home</a>
                    <a href="auctions.html" class="${window.location.pathname.includes('auctions') ? 'active' : ''}">Auctions</a>
                    <a href="how-it-works.html">How It Works</a>
                </div>
            `;
            
            nav.insertAdjacentHTML('beforeend', linksHTML);
            nav.insertAdjacentHTML('beforeend', authContent);
        }
        
        // Event listeners
        setTimeout(() => {
            const avatar = document.getElementById('user-avatar');
            const dropdown = document.getElementById('user-dropdown');
            if (avatar && dropdown) {
                avatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });
                document.addEventListener('click', () => dropdown.classList.remove('show'));
            }
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Api.logout();
                });
            }
            
            const mobileToggle = document.querySelector('.mobile-toggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', () => {
                    document.getElementById('nav-links')?.classList.toggle('mobile-open');
                });
            }
        }, 50);
    },

    renderAuctionCard(auction) {
        const now = new Date();
        const endTime = new Date(auction.end_time || auction.endTime);
        const timeLeft = endTime - now;
        const isEndingSoon = timeLeft > 0 && timeLeft < 3600000 * 6;
        const isNew = (now - new Date(auction.start_time || auction.startTime)) < 3600000 * 24;
        
        let badge = '';
        if (isEndingSoon) badge = '<span class="auction-badge badge-ending">Ending Soon</span>';
        else if (isNew && (auction.bid_count || auction.bids?.length || 0) === 0) badge = '<span class="auction-badge badge-new">New</span>';
        else if ((auction.bid_count || auction.bids?.length || 0) > 5) badge = '<span class="auction-badge badge-hot">Hot</span>';
        
        const endTimeStr = (auction.end_time || auction.endTime);
        
        return `
            <div class="auction-card" onclick="window.location.href='auction-detail.html?id=${auction.id}'">
                <div class="auction-img">
                    <i class="fas fa-${auction.image || 'box'}"></i>
                    ${badge}
                    <span class="auction-timer" data-end="${endTimeStr}">
                        <i class="far fa-clock"></i> <span class="timer-text">--:--:--</span>
                    </span>
                </div>
                <div class="auction-body">
                    <h3 class="auction-title">${auction.title}</h3>
                    <p class="auction-desc">${auction.description}</p>
                    <div class="auction-meta">
                        <div class="auction-price">
                            <div class="current-bid">Current Bid</div>
                            <div class="bid-amount"><span class="currency">$</span>${Number(auction.current_bid || auction.currentBid).toLocaleString()}</div>
                        </div>
                        <div class="auction-bids">
                            <i class="fas fa-gavel"></i> ${auction.bid_count || auction.bids?.length || 0} bids
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBidHistoryItem(bid) {
        return `
            <div class="bid-history-item">
                <div class="bidder">
                    <span class="avatar-sm" style="background:${getRandomPastelColor(bid.user_name || bid.userName)}">${getInitials(bid.user_name || bid.userName)}</span>
                    ${bid.user_name || bid.userName}
                </div>
                <div class="bid-amount">${formatCurrency(bid.amount)}</div>
                <div class="bid-time">${timeAgo(bid.created_at || bid.time)}</div>
            </div>
        `;
    },

    updateTimers() {
        document.querySelectorAll('.auction-timer').forEach(el => {
            const end = new Date(el.dataset.end);
            const now = new Date();
            const diff = end - now;
            
            const timerText = el.querySelector('.timer-text');
            if (!timerText) return;
            
            if (diff <= 0) {
                timerText.textContent = 'Ended';
                return;
            }
            
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timerText.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        });
    },

    initTimers() {
        this.updateTimers();
        setInterval(() => this.updateTimers(), 1000);
    }
};

// ===== PAGE INITIALIZATIONS =====
const Page = {
    // Landing Page
    async landing() {
        try {
            const featured = await Api.getFeaturedAuctions();
            const grid = document.getElementById('featured-grid');
            if (grid) {
                grid.innerHTML = featured.map(a => UI.renderAuctionCard(a)).join('');
            }
            UI.initTimers();
        } catch (error) {
            console.error('Error loading featured auctions:', error);
            Toast.show('Failed to load auctions. Make sure backend is running.', 'error');
        }
        UI.renderNav();
    },

    // Auctions Listing Page
    async auctions() {
        UI.renderNav();
        
        const grid = document.getElementById('auction-grid');
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        const categoryBtns = document.querySelectorAll('.category-filter');
        
        async function renderListings() {
            try {
                const category = document.querySelector('.category-filter.active')?.dataset.category || 'all';
                const search = searchInput?.value || '';
                const sort = sortSelect?.value || 'popular';
                
                const results = await Api.getAuctions({ category, search, sort });
                if (grid) {
                    grid.innerHTML = results.length 
                        ? results.map(a => UI.renderAuctionCard(a)).join('')
                        : '<div style="text-align:center;padding:60px 20px;color:var(--gray-500);"><i class="fas fa-search" style="font-size:3rem;margin-bottom:15px;display:block;"></i><p>No auctions found matching your criteria.</p></div>';
                }
                UI.initTimers();
            } catch (error) {
                console.error('Error loading auctions:', error);
                Toast.show('Failed to load auctions', 'error');
            }
        }
        
        if (searchInput) searchInput.addEventListener('input', renderListings);
        if (sortSelect) sortSelect.addEventListener('change', renderListings);
        
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderListings();
            });
        });
        
        await renderListings();
    },

    // Auction Detail Page
    async auctionDetail() {
        UI.renderNav();
        
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        
        try {
            const auction = await Api.getAuction(id);
            const detailEl = document.getElementById('auction-detail');
            if (!detailEl) return;
            
            const now = new Date();
            const endTime = new Date(auction.end_time || auction.endTime);
            const isActive = endTime > now && auction.status === 'active';
            
            const diff = endTime - now;
            const h = Math.floor(Math.abs(diff) / 3600000);
            const m = Math.floor((Math.abs(diff) % 3600000) / 60000);
            const s = Math.floor((Math.abs(diff) % 60000) / 1000);
            
            detailEl.innerHTML = `
                <div class="detail-layout">
                    <div class="detail-image">
                        <i class="fas fa-${auction.image || 'box'}"></i>
                    </div>
                    <div class="detail-info">
                        <span style="color:var(--primary);font-weight:600;font-size:0.9rem;">${auction.category}</span>
                        <h1>${auction.title}</h1>
                        <p class="description">${auction.description}</p>
                        
                        <div class="bid-box">
                            <div class="price-row">
                                <div>
                                    <div class="label">Current Bid</div>
                                    <div class="price">${formatCurrency(auction.current_bid || auction.currentBid)}</div>
                                </div>
                                <div style="text-align:right;">
                                    <div class="label">${auction.bid_count || auction.bids?.length || 0} bid${(auction.bid_count || auction.bids?.length || 0) !== 1 ? 's' : ''}</div>
                                    <div style="font-size:0.9rem;color:var(--gray-500);margin-top:4px;">
                                        <i class="fas fa-users"></i> ${auction.watchers} watching
                                    </div>
                                </div>
                            </div>
                            
                            ${!isActive ? '<div style="text-align:center;padding:15px;background:var(--danger);color:var(--white);border-radius:var(--radius-sm);font-weight:600;">This auction has ended</div>' : `
                                <div class="timer" id="detail-timer">
                                    <div class="timer-unit">
                                        <span class="num" id="timer-h">${h.toString().padStart(2, '0')}</span>
                                        <span class="unit">Hours</span>
                                    </div>
                                    <div class="timer-unit">
                                        <span class="num" id="timer-m">${m.toString().padStart(2, '0')}</span>
                                        <span class="unit">Minutes</span>
                                    </div>
                                    <div class="timer-unit">
                                        <span class="num" id="timer-s">${s.toString().padStart(2, '0')}</span>
                                        <span class="unit">Seconds</span>
                                    </div>
                                </div>
                                
                                <div class="bid-input-group">
                                    <input type="number" id="bid-amount" value="${(auction.current_bid || auction.currentBid) + (auction.min_increment || auction.minIncrement)}" step="${auction.min_increment || auction.minIncrement}" min="${(auction.current_bid || auction.currentBid) + (auction.min_increment || auction.minIncrement)}" ${!AppState.isAuthenticated ? 'disabled' : ''}>
                                    <button class="btn-bid" id="place-bid-btn" ${!AppState.isAuthenticated ? 'disabled' : ''}>
                                        <i class="fas fa-gavel"></i> Place Bid
                                    </button>
                                </div>
                                ${!AppState.isAuthenticated ? '<p style="margin-top:10px;font-size:0.85rem;color:var(--gray-500);"><a href="login.html" style="color:var(--primary);font-weight:600;">Login</a> to place a bid</p>' : ''}
                            `}
                            
                            <div style="margin-top:15px;display:flex;justify-content:space-between;font-size:0.85rem;color:var(--gray-500);">
                                <span><i class="fas fa-flag"></i> Starting: ${formatCurrency(auction.starting_price || auction.startingPrice)}</span>
                                <span><i class="fas fa-arrow-up"></i> Min increment: ${formatCurrency(auction.min_increment || auction.minIncrement)}</span>
                            </div>
                        </div>
                        
                        <div class="bid-history">
                            <h3><i class="fas fa-history"></i> Bid History (${auction.bid_count || auction.bids?.length || 0})</h3>
                            <div class="bid-history-list" id="bid-history-list">
                                ${auction.bids && auction.bids.length ? auction.bids.slice().reverse().map(b => UI.renderBidHistoryItem(b)).join('') : '<p style="color:var(--gray-500);text-align:center;padding:20px;">No bids yet. Be the first!</p>'}
                            </div>
                        </div>
                        
                        <div style="margin-top:20px;font-size:0.85rem;color:var(--gray-500);">
                            <p><i class="fas fa-user"></i> Sold by: <strong>${auction.seller_name || auction.sellerName}</strong></p>
                            <p style="margin-top:5px;"><i class="fas fa-eye"></i> ${auction.views} views</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Timer
            if (isActive) {
                const timerInterval = setInterval(() => {
                    const now = new Date();
                    const end = new Date(auction.end_time || auction.endTime);
                    const diff = end - now;
                    
                    if (diff <= 0) {
                        clearInterval(timerInterval);
                        document.getElementById('timer-h').textContent = '00';
                        document.getElementById('timer-m').textContent = '00';
                        document.getElementById('timer-s').textContent = '00';
                        document.querySelector('.btn-bid').disabled = true;
                        document.querySelector('.btn-bid').textContent = 'Auction Ended';
                        return;
                    }
                    
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    
                    document.getElementById('timer-h').textContent = h.toString().padStart(2, '0');
                    document.getElementById('timer-m').textContent = m.toString().padStart(2, '0');
                    document.getElementById('timer-s').textContent = s.toString().padStart(2, '0');
                }, 1000);
            }
            
            // Place bid
            const bidBtn = document.getElementById('place-bid-btn');
            const bidInput = document.getElementById('bid-amount');
            
            if (bidBtn && bidInput) {
                bidBtn.addEventListener('click', async () => {
                    if (!AppState.isAuthenticated) return;
                    
                    const amount = parseFloat(bidInput.value);
                    const minBid = (auction.current_bid || auction.currentBid) + (auction.min_increment || auction.minIncrement);
                    
                    if (isNaN(amount) || amount < minBid) {
                        Toast.show(`Bid must be at least ${formatCurrency(minBid)}`, 'error');
                        return;
                    }
                    
                    try {
                        const result = await Api.placeBid(id, amount);
                        Toast.show(`Bid of ${formatCurrency(amount)} placed successfully!`, 'success');
                        setTimeout(() => window.location.reload(), 1500);
                    } catch (error) {
                        Toast.show(error.message, 'error');
                    }
                });
                
                bidInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') bidBtn.click();
                });
            }
        } catch (error) {
            console.error('Error loading auction:', error);
            Toast.show('Failed to load auction details', 'error');
        }
    },

    // Dashboard Page
    async dashboard() {
        UI.renderNav();
        
        if (!AppState.isAuthenticated) {
            window.location.href = 'login.html?redirect=dashboard.html';
            return;
        }
        
        try {
            const [myBids, myAuctions, wonAuctions] = await Promise.all([
                Api.getMyBids(),
                Api.getMyAuctions(),
                Api.getWonAuctions()
            ]);
            
            const activeBids = myBids.filter(b => new Date(b.auction_end || b.auctionEnd) > new Date());
            
            document.getElementById('dash-active-bids').textContent = activeBids.length;
            document.getElementById('dash-my-auctions').textContent = myAuctions.length;
            document.getElementById('dash-won').textContent = wonAuctions.length;
            
            const totalSpent = myBids
                .filter(b => b.auction_status === 'ended')
                .reduce((sum, b) => sum + b.amount, 0);
            document.getElementById('dash-total-spent').textContent = formatCurrency(totalSpent);
            
            const tabs = document.querySelectorAll('.tab');
            const tabContents = {
                'my-bids': () => {
                    const list = document.getElementById('tab-content');
                    if (!list) return;
                    if (!myBids.length) {
                        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-500);">No bids placed yet. <a href="auctions.html" style="color:var(--primary);">Browse auctions</a></div>';
                        return;
                    }
                    list.innerHTML = `
                        <div class="table-wrapper">
                            <table>
                                <thead><tr><th>Auction</th><th>Your Bid</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
                                <tbody>
                                    ${myBids.slice(0, 20).map(b => {
                                        const isWon = wonAuctions.find(w => w.id === b.auction_id);
                                        const isActive = new Date(b.auction_end || b.auctionEnd) > new Date();
                                        let status = isActive ? 'active' : (isWon ? 'won' : 'ended');
                                        return `
                                            <tr>
                                                <td><strong>${b.auction_title}</strong></td>
                                                <td>${formatCurrency(b.amount)}</td>
                                                <td><span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                                                <td>${timeAgo(b.created_at || b.time)}</td>
                                                <td><a href="auction-detail.html?id=${b.auction_id}" class="btn-sm primary">View</a></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                },
                'my-auctions': () => {
                    const list = document.getElementById('tab-content');
                    if (!list) return;
                    if (!myAuctions.length) {
                        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-500);">You haven\'t created any auctions. <a href="create-auction.html" style="color:var(--primary);">Create one</a></div>';
                        return;
                    }
                    list.innerHTML = `
                        <div class="table-wrapper">
                            <table>
                                <thead><tr><th>Title</th><th>Current Bid</th><th>Bids</th><th>Status</th><th>Ends</th><th>Action</th></tr></thead>
                                <tbody>
                                    ${myAuctions.map(a => {
                                        const isActive = new Date(a.end_time || a.endTime) > new Date();
                                        return `
                                            <tr>
                                                <td><strong>${a.title}</strong></td>
                                                <td>${formatCurrency(a.current_bid || a.currentBid)}</td>
                                                <td>${a.bid_count || 0}</td>
                                                <td><span class="status ${isActive ? 'active' : 'ended'}">${isActive ? 'Active' : 'Ended'}</span></td>
                                                <td>${isActive ? formatDate(a.end_time || a.endTime) : 'Ended'}</td>
                                                <td><a href="auction-detail.html?id=${a.id}" class="btn-sm primary">View</a></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                },
                'won': () => {
                    const list = document.getElementById('tab-content');
                    if (!list) return;
                    if (!wonAuctions.length) {
                        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-500);">No won auctions yet. Keep bidding!</div>';
                        return;
                    }
                    list.innerHTML = `
                        <div class="table-wrapper">
                            <table>
                                <thead><tr><th>Auction</th><th>Winning Bid</th><th>Seller</th><th>Ended</th><th>Action</th></tr></thead>
                                <tbody>
                                    ${wonAuctions.map(a => {
                                        const lastBid = a.bids && a.bids.length ? a.bids[a.bids.length - 1] : null;
                                        return `
                                            <tr>
                                                <td><strong>${a.title}</strong></td>
                                                <td>${lastBid ? formatCurrency(lastBid.amount) : 'N/A'}</td>
                                                <td>${a.seller_name || a.sellerName}</td>
                                                <td>${formatDate(a.end_time || a.endTime)}</td>
                                                <td><a href="auction-detail.html?id=${a.id}" class="btn-sm primary">View</a></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            };
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const content = tabContents[tab.dataset.tab];
                    if (content) content();
                });
            });
            
            if (tabs.length) tabs[0].click();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            Toast.show('Failed to load dashboard', 'error');
        }
    },

    // Admin Page
    async admin() {
        UI.renderNav();
        
        if (!AppState.isAuthenticated || AppState.currentUser?.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const [stats, users, auctions] = await Promise.all([
                Api.getAdminStats(),
                Api.getAdminUsers(),
                Api.getAdminAuctions()
            ]);
            
            document.getElementById('admin-total-auctions').textContent = stats.total_auctions;
            document.getElementById('admin-active-auctions').textContent = stats.active_auctions;
            document.getElementById('admin-total-users').textContent = stats.total_users;
            document.getElementById('admin-total-bids').textContent = stats.total_bids;
            
            const usersBody = document.getElementById('admin-users-body');
            if (usersBody) {
                usersBody.innerHTML = users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td><strong>${u.name}</strong></td>
                        <td>${u.email}</td>
                        <td><span class="status ${u.role === 'admin' ? 'active' : 'pending'}">${u.role}</span></td>
                        <td>${formatDate(u.created_at)}</td>
                        <td>
                            <button class="btn-sm danger" onclick="if(confirm('Delete user ${u.name}?')){deleteUser('${u.id}')}">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
            
            const auctionsBody = document.getElementById('admin-auctions-body');
            if (auctionsBody) {
                auctionsBody.innerHTML = auctions.map(a => {
                    const isActive = new Date(a.end_time || a.endTime) > new Date();
                    return `
                        <tr>
                            <td>${a.id}</td>
                            <td><strong>${a.title}</strong></td>
                            <td>${a.seller_name || a.sellerName}</td>
                            <td>${formatCurrency(a.current_bid || a.currentBid)}</td>
                            <td>${a.bid_count || 0}</td>
                            <td><span class="status ${isActive ? 'active' : 'ended'}">${isActive ? 'Active' : 'Ended'}</span></td>
                            <td><a href="auction-detail.html?id=${a.id}" class="btn-sm primary">View</a></td>
                        </tr>
                    `;
                }).join('');
            }
            
            document.querySelectorAll('.admin-sidebar a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.admin-sidebar a').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    document.querySelectorAll('.admin-panel-section').forEach(s => s.style.display = 'none');
                    const target = document.getElementById(link.dataset.section);
                    if (target) target.style.display = 'block';
                });
            });
        } catch (error) {
            console.error('Error loading admin:', error);
            Toast.show('Failed to load admin panel', 'error');
        }
    },

    // Auth pages
    async login() {
        UI.renderNav();
        
        if (AppState.isAuthenticated) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            try {
                const result = await Api.login(email, password);
                AppState.currentUser = result.user;
                AppState.isAuthenticated = true;
                Toast.show('Welcome back, ' + result.user.name + '!', 'success');
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get('redirect') || 'dashboard.html';
                setTimeout(() => window.location.href = redirect, 1000);
            } catch (error) {
                Toast.show(error.message, 'error');
            }
        });
    },

    async register() {
        UI.renderNav();
        
        if (AppState.isAuthenticated) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        const form = document.getElementById('register-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password')?.value;
            
            document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
            
            if (!name || name.length < 2) {
                document.getElementById('name')?.closest('.form-group')?.classList.add('error');
                Toast.show('Please enter your full name', 'error');
                return;
            }
            
            if (!email || !email.includes('@')) {
                document.getElementById('email')?.closest('.form-group')?.classList.add('error');
                Toast.show('Please enter a valid email address', 'error');
                return;
            }
            
            if (password.length < 6) {
                document.getElementById('password')?.closest('.form-group')?.classList.add('error');
                Toast.show('Password must be at least 6 characters', 'error');
                return;
            }
            
            if (confirm && password !== confirm) {
                document.getElementById('confirm-password')?.closest('.form-group')?.classList.add('error');
                Toast.show('Passwords do not match', 'error');
                return;
            }
            
            try {
                const result = await Api.register(name, email, password);
                AppState.currentUser = result.user;
                AppState.isAuthenticated = true;
                Toast.show('Account created! Welcome to BidHub!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (error) {
                Toast.show(error.message, 'error');
                document.getElementById('email')?.closest('.form-group')?.classList.add('error');
            }
        });
    },

    // Create Auction Page
    async createAuction() {
        UI.renderNav();
        
        if (!AppState.isAuthenticated) {
            window.location.href = 'login.html?redirect=create-auction.html';
            return;
        }
        
        const form = document.getElementById('create-auction-form');
        if (!form) return;
        
        const categories = ['Electronics', 'Fashion', 'Art', 'Collectibles', 'Jewelry', 'Watches', 'Music', 'Books'];
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const category = document.getElementById('category').value;
            const startingPrice = parseFloat(document.getElementById('starting-price').value);
            const reservePrice = parseFloat(document.getElementById('reserve-price').value) || 0;
            const minIncrement = parseFloat(document.getElementById('min-increment').value) || 10;
            const duration = parseInt(document.getElementById('duration').value) || 72;
            
            if (!title || title.length < 5) {
                Toast.show('Title must be at least 5 characters', 'error');
                return;
            }
            if (!description || description.length < 20) {
                Toast.show('Description must be at least 20 characters', 'error');
                return;
            }
            if (isNaN(startingPrice) || startingPrice < 1) {
                Toast.show('Starting price must be at least $1', 'error');
                return;
            }
            
            try {
                const auction = await Api.createAuction({
                    title,
                    description,
                    category,
                    starting_price: startingPrice,
                    reserve_price: reservePrice,
                    min_increment: minIncrement,
                    duration,
                    image: 'box'
                });
                
                Toast.show('Auction created successfully!', 'success');
                setTimeout(() => window.location.href = `auction-detail.html?id=${auction.id}`, 1500);
            } catch (error) {
                Toast.show(error.message, 'error');
            }
        });
    }
};

// ===== GLOBAL DELETE USER FUNCTION =====
window.deleteUser = async function(userId) {
    if (userId === AppState.currentUser?.id) {
        Toast.show('You cannot delete yourself', 'error');
        return;
    }
    try {
        await Api.deleteUser(userId);
        Toast.show('User deleted', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        Toast.show(error.message, 'error');
    }
};

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    
    // Check for saved session
    const token = localStorage.getItem('auction_token');
    if (token) {
        try {
            const user = await Api.getMe();
            AppState.currentUser = user;
            AppState.isAuthenticated = true;
        } catch (error) {
            localStorage.removeItem('auction_token');
        }
    }
    
    if (path.includes('index') || path.endsWith('/') || path.includes('Auction platform')) {
        await Page.landing();
    } else if (path.includes('auctions.html')) {
        await Page.auctions();
    } else if (path.includes('auction-detail.html')) {
        await Page.auctionDetail();
    } else if (path.includes('dashboard.html')) {
        await Page.dashboard();
    } else if (path.includes('admin.html')) {
        await Page.admin();
    } else if (path.includes('login.html')) {
        await Page.login();
    } else if (path.includes('register.html')) {
        await Page.register();
    } else if (path.includes('create-auction.html')) {
        await Page.createAuction();
    } else if (path.includes('how-it-works.html')) {
        UI.renderNav();
    }
});