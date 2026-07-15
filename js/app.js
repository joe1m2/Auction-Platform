// ============================================
// ONLINE AUCTION PLATFORM - JavaScript
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

// ===== DATABASE (LocalStorage) =====
const DB = {
    get(key, defaultVal = null) {
        const data = localStorage.getItem('auction_' + key);
        return data ? JSON.parse(data) : defaultVal;
    },
    set(key, val) {
        localStorage.setItem('auction_' + key, JSON.stringify(val));
    },
    remove(key) {
        localStorage.removeItem('auction_' + key);
    }
};

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

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

// ===== SEED DATA =====
function seedData() {
    if (DB.get('seeded')) return;

    const users = [
        { id: 'u1', name: 'John Smith', email: 'john@example.com', password: 'password123', role: 'user', joinedAt: '2025-01-15T10:00:00Z' },
        { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com', password: 'password123', role: 'user', joinedAt: '2025-02-20T14:30:00Z' },
        { id: 'u3', name: 'Mike Wilson', email: 'mike@example.com', password: 'password123', role: 'user', joinedAt: '2025-03-10T09:15:00Z' },
        { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', password: 'password123', role: 'user', joinedAt: '2025-04-05T16:45:00Z' },
        { id: 'u5', name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin', joinedAt: '2024-12-01T08:00:00Z' }
    ];

    const now = new Date();
    const addHours = (h) => new Date(now.getTime() + h * 3600000).toISOString();
    const subHours = (h) => new Date(now.getTime() - h * 3600000).toISOString();

    const auctions = [
        {
            id: 'a1', sellerId: 'u1', sellerName: 'John Smith',
            title: 'Vintage Rolex Submariner 16610',
            description: 'A stunning vintage Rolex Submariner in excellent condition. Comes with original box and papers. This 40mm stainless steel dive watch features a black dial and bezel, automatic movement, and is waterproof to 300 meters. A true collector\'s item that has been meticulously maintained.',
            category: 'Watches',
            startingPrice: 5000,
            currentBid: 8750,
            reservePrice: 7000,
            minIncrement: 100,
            startTime: subHours(48),
            endTime: addHours(48),
            status: 'active',
            bids: [
                { id: 'b1', userId: 'u2', userName: 'Sarah Johnson', amount: 5500, time: subHours(40) },
                { id: 'b2', userId: 'u3', userName: 'Mike Wilson', amount: 6200, time: subHours(36) },
                { id: 'b3', userId: 'u2', userName: 'Sarah Johnson', amount: 7000, time: subHours(24) },
                { id: 'b4', userId: 'u4', userName: 'Emily Davis', amount: 7800, time: subHours(12) },
                { id: 'b5', userId: 'u3', userName: 'Mike Wilson', amount: 8500, time: subHours(6) },
                { id: 'b6', userId: 'u2', userName: 'Sarah Johnson', amount: 8750, time: subHours(2) }
            ],
            views: 342,
            watchers: 28,
            image: 'watch',
            featured: true
        },
        {
            id: 'a2', sellerId: 'u2', sellerName: 'Sarah Johnson',
            title: 'Original Oil Painting - Abstract Landscape',
            description: 'A beautiful original oil painting on canvas. Size: 36x48 inches. This vibrant abstract landscape features rich textures and bold colors that will make a statement in any room. Signed by the artist and comes with a certificate of authenticity.',
            category: 'Art',
            startingPrice: 200,
            currentBid: 680,
            reservePrice: 500,
            minIncrement: 25,
            startTime: subHours(72),
            endTime: addHours(24),
            status: 'active',
            bids: [
                { id: 'b7', userId: 'u1', userName: 'John Smith', amount: 250, time: subHours(60) },
                { id: 'b8', userId: 'u4', userName: 'Emily Davis', amount: 325, time: subHours(48) },
                { id: 'b9', userId: 'u1', userName: 'John Smith', amount: 400, time: subHours(36) },
                { id: 'b10', userId: 'u3', userName: 'Mike Wilson', amount: 520, time: subHours(24) },
                { id: 'b11', userId: 'u4', userName: 'Emily Davis', amount: 600, time: subHours(12) },
                { id: 'b12', userId: 'u3', userName: 'Mike Wilson', amount: 680, time: subHours(3) }
            ],
            views: 189,
            watchers: 15,
            image: 'palette',
            featured: true
        },
        {
            id: 'a3', sellerId: 'u3', sellerName: 'Mike Wilson',
            title: 'First Edition Harry Potter Book Collection',
            description: 'Complete set of first edition Harry Potter books. All seven books in excellent condition, including the rare first printing of Philosopher\'s Stone. This collection has been professionally graded and stored in a climate-controlled environment.',
            category: 'Books',
            startingPrice: 1000,
            currentBid: 3200,
            reservePrice: 2500,
            minIncrement: 50,
            startTime: subHours(96),
            endTime: addHours(72),
            status: 'active',
            bids: [
                { id: 'b13', userId: 'u1', userName: 'John Smith', amount: 1200, time: subHours(84) },
                { id: 'b14', userId: 'u4', userName: 'Emily Davis', amount: 1500, time: subHours(72) },
                { id: 'b15', userId: 'u2', userName: 'Sarah Johnson', amount: 2000, time: subHours(48) },
                { id: 'b16', userId: 'u1', userName: 'John Smith', amount: 2600, time: subHours(24) },
                { id: 'b17', userId: 'u4', userName: 'Emily Davis', amount: 3200, time: subHours(8) }
            ],
            views: 256,
            watchers: 22,
            image: 'book-open',
            featured: true
        },
        {
            id: 'a4', sellerId: 'u4', sellerName: 'Emily Davis',
            title: 'Antique Victorian Diamond Ring',
            description: 'An exquisite Victorian-era diamond ring in 18k gold. Features a stunning 1.5-carat old mine cut diamond with intricate filigree work on the band. Circa 1890. This heirloom-quality piece comes with a gemological report.',
            category: 'Jewelry',
            startingPrice: 3000,
            currentBid: 5400,
            reservePrice: 4000,
            minIncrement: 100,
            startTime: subHours(60),
            endTime: addHours(12),
            status: 'active',
            bids: [
                { id: 'b18', userId: 'u2', userName: 'Sarah Johnson', amount: 3500, time: subHours(48) },
                { id: 'b19', userId: 'u1', userName: 'John Smith', amount: 4200, time: subHours(36) },
                { id: 'b20', userId: 'u2', userName: 'Sarah Johnson', amount: 4800, time: subHours(24) },
                { id: 'b21', userId: 'u3', userName: 'Mike Wilson', amount: 5400, time: subHours(6) }
            ],
            views: 210,
            watchers: 18,
            image: 'gem',
            featured: true
        },
        {
            id: 'a5', sellerId: 'u1', sellerName: 'John Smith',
            title: 'Rare Baseball Card Collection - 1952 Topps',
            description: 'An incredible collection of 1952 Topps baseball cards including a Mickey Mantle rookie card. Over 50 cards in the collection, all in good to excellent condition. Professionally graded and authenticated.',
            category: 'Collectibles',
            startingPrice: 2000,
            currentBid: 2000,
            reservePrice: 1500,
            minIncrement: 50,
            startTime: subHours(12),
            endTime: addHours(96),
            status: 'active',
            bids: [],
            views: 89,
            watchers: 12,
            image: 'trophy',
            featured: false
        },
        {
            id: 'a6', sellerId: 'u2', sellerName: 'Sarah Johnson',
            title: 'Professional DSLR Camera - Canon EOS R5',
            description: 'Like-new Canon EOS R5 camera body. Only 5000 shutter count. Includes original box, battery, charger, and strap. This professional-grade mirrorless camera features 45MP sensor, 8K video, and IBIS. Perfect for professionals and serious enthusiasts.',
            category: 'Electronics',
            startingPrice: 2500,
            currentBid: 3200,
            reservePrice: 2800,
            minIncrement: 50,
            startTime: subHours(36),
            endTime: addHours(60),
            status: 'active',
            bids: [
                { id: 'b22', userId: 'u3', userName: 'Mike Wilson', amount: 2700, time: subHours(30) },
                { id: 'b23', userId: 'u4', userName: 'Emily Davis', amount: 2950, time: subHours(20) },
                { id: 'b24', userId: 'u1', userName: 'John Smith', amount: 3200, time: subHours(10) }
            ],
            views: 178,
            watchers: 20,
            image: 'camera',
            featured: false
        },
        {
            id: 'a7', sellerId: 'u3', sellerName: 'Mike Wilson',
            title: 'Vintage Gibson Les Paul Guitar 1978',
            description: 'A 1978 Gibson Les Paul Standard in wine red finish. This iconic guitar has been well-maintained and plays beautifully. Features original pickups and hardware. Includes a hard case. A must-have for serious guitar collectors.',
            category: 'Music',
            startingPrice: 3500,
            currentBid: 4200,
            reservePrice: 3800,
            minIncrement: 100,
            startTime: subHours(48),
            endTime: addHours(36),
            status: 'active',
            bids: [
                { id: 'b25', userId: 'u4', userName: 'Emily Davis', amount: 3700, time: subHours(36) },
                { id: 'b26', userId: 'u1', userName: 'John Smith', amount: 3900, time: subHours(24) },
                { id: 'b27', userId: 'u2', userName: 'Sarah Johnson', amount: 4200, time: subHours(12) }
            ],
            views: 145,
            watchers: 16,
            image: 'music',
            featured: false
        },
        {
            id: 'a8', sellerId: 'u4', sellerName: 'Emily Davis',
            title: 'Louis Vuitton Neverfull MM Damier',
            description: 'Authentic Louis Vuitton Neverfull MM in Damier Ebene canvas. Excellent pre-owned condition with minimal signs of wear. Includes dust bag and authenticity card. A timeless classic that holds its value.',
            category: 'Fashion',
            startingPrice: 800,
            currentBid: 1250,
            reservePrice: 1000,
            minIncrement: 25,
            startTime: subHours(24),
            endTime: addHours(48),
            status: 'active',
            bids: [
                { id: 'b28', userId: 'u2', userName: 'Sarah Johnson', amount: 900, time: subHours(18) },
                { id: 'b29', userId: 'u1', userName: 'John Smith', amount: 1050, time: subHours(10) },
                { id: 'b30', userId: 'u2', userName: 'Sarah Johnson', amount: 1250, time: subHours(4) }
            ],
            views: 167,
            watchers: 14,
            image: 'tshirt',
            featured: false
        },
        {
            id: 'a9', sellerId: 'u1', sellerName: 'John Smith',
            title: 'Bidding Wars Board Game - Rare Edition',
            description: 'Limited collector\'s edition of the classic bidding game. Sealed in original packaging. Only 1000 copies ever printed. This rare find is perfect for board game collectors and enthusiasts.',
            category: 'Collectibles',
            startingPrice: 50,
            currentBid: 50,
            reservePrice: 75,
            minIncrement: 5,
            startTime: subHours(6),
            endTime: addHours(120),
            status: 'active',
            bids: [],
            views: 45,
            watchers: 8,
            image: 'dice',
            featured: false
        }
    ];

    const categories = [
        { name: 'Electronics', icon: 'laptop', count: 1, color: 'blue' },
        { name: 'Fashion', icon: 'tshirt', count: 1, color: 'pink' },
        { name: 'Art', icon: 'palette', count: 1, color: 'purple' },
        { name: 'Collectibles', icon: 'trophy', count: 2, color: 'orange' },
        { name: 'Jewelry', icon: 'gem', count: 1, color: 'green' },
        { name: 'Watches', icon: 'clock', count: 1, color: 'yellow' },
        { name: 'Music', icon: 'music', count: 1, color: 'blue' },
        { name: 'Books', icon: 'book-open', count: 1, color: 'purple' }
    ];

    DB.set('users', users);
    DB.set('auctions', auctions);
    DB.set('categories', categories);
    DB.set('seeded', true);
}

// ===== AUTHENTICATION =====
const Auth = {
    login(email, password) {
        const users = DB.get('users', []);
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return { success: false, error: 'Invalid email or password' };
        
        const { password: _, ...safeUser } = user;
        AppState.currentUser = safeUser;
        AppState.isAuthenticated = true;
        DB.set('currentUser', safeUser);
        
        return { success: true, user: safeUser };
    },

    register(name, email, password) {
        const users = DB.get('users', []);
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already registered' };
        }
        
        const newUser = {
            id: generateId(),
            name,
            email,
            password,
            role: 'user',
            joinedAt: new Date().toISOString()
        };
        
        users.push(newUser);
        DB.set('users', users);
        
        const { password: _, ...safeUser } = newUser;
        AppState.currentUser = safeUser;
        AppState.isAuthenticated = true;
        DB.set('currentUser', safeUser);
        
        return { success: true, user: safeUser };
    },

    logout() {
        AppState.currentUser = null;
        AppState.isAuthenticated = false;
        DB.remove('currentUser');
        window.location.href = 'index.html';
    },

    checkSession() {
        const user = DB.get('currentUser');
        if (user) {
            AppState.currentUser = user;
            AppState.isAuthenticated = true;
        }
    },

    isAdmin() {
        return AppState.currentUser?.role === 'admin';
    }
};

// ===== AUCTIONS =====
const AuctionService = {
    getAll() {
        return DB.get('auctions', []);
    },

    getById(id) {
        return DB.get('auctions', []).find(a => a.id === id) || null;
    },

    getActive() {
        const now = new Date().toISOString();
        return DB.get('auctions', []).filter(a => a.status === 'active' && a.endTime > now);
    },

    filter({ category, search, sort, status }) {
        let auctions = DB.get('auctions', []);
        const now = new Date().toISOString();
        
        // Filter active
        auctions = auctions.filter(a => a.status === 'active' && a.endTime > now);
        
        if (category && category !== 'all') {
            auctions = auctions.filter(a => a.category.toLowerCase() === category.toLowerCase());
        }
        
        if (search) {
            const q = search.toLowerCase();
            auctions = auctions.filter(a => 
                a.title.toLowerCase().includes(q) || 
                a.description.toLowerCase().includes(q) ||
                a.category.toLowerCase().includes(q)
            );
        }
        
        if (sort === 'price-low') {
            auctions.sort((a, b) => a.currentBid - b.currentBid);
        } else if (sort === 'price-high') {
            auctions.sort((a, b) => b.currentBid - a.currentBid);
        } else if (sort === 'ending-soon') {
            auctions.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
        } else if (sort === 'newest') {
            auctions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        } else {
            auctions.sort((a, b) => b.bids.length - a.bids.length || new Date(b.startTime) - new Date(a.startTime));
        }
        
        return auctions;
    },

    getFeatured() {
        return DB.get('auctions', []).filter(a => a.featured && a.status === 'active' && a.endTime > new Date().toISOString());
    },

    placeBid(auctionId, userId, userName, amount) {
        const auctions = DB.get('auctions', []);
        const idx = auctions.findIndex(a => a.id === auctionId);
        if (idx === -1) return { success: false, error: 'Auction not found' };
        
        const auction = auctions[idx];
        const now = new Date();
        
        if (new Date(auction.endTime) < now) {
            return { success: false, error: 'Auction has ended' };
        }
        
        if (amount <= auction.currentBid) {
            return { success: false, error: `Bid must be at least ${formatCurrency(auction.currentBid + auction.minIncrement)}` };
        }
        
        if (amount < auction.currentBid + auction.minIncrement) {
            return { success: false, error: `Minimum bid increment is ${formatCurrency(auction.minIncrement)}` };
        }
        
        const bid = {
            id: generateId(),
            userId,
            userName,
            amount,
            time: now.toISOString()
        };
        
        auction.bids.push(bid);
        auction.currentBid = amount;
        
        DB.set('auctions', auctions);
        return { success: true, bid };
    },

    addAuction(auctionData) {
        const auctions = DB.get('auctions', []);
        const auction = {
            id: generateId(),
            ...auctionData,
            currentBid: auctionData.startingPrice,
            bids: [],
            views: 0,
            watchers: 0,
            featured: false,
            status: 'active',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + auctionData.duration * 3600000).toISOString()
        };
        auctions.unshift(auction);
        DB.set('auctions', auctions);
        return auction;
    },

    getEndedAuctions() {
        const now = new Date().toISOString();
        return DB.get('auctions', []).filter(a => a.endTime <= now || a.status === 'ended');
    },

    getWonAuctions(userId) {
        const ended = this.getEndedAuctions();
        return ended.filter(a => {
            if (!a.bids.length) return false;
            const lastBid = a.bids[a.bids.length - 1];
            return lastBid.userId === userId;
        });
    },

    getUserBids(userId) {
        const auctions = DB.get('auctions', []);
        const bids = [];
        auctions.forEach(a => {
            a.bids.forEach(b => {
                if (b.userId === userId) {
                    bids.push({ ...b, auction: { id: a.id, title: a.title, endTime: a.endTime, status: a.status } });
                }
            });
        });
        return bids.sort((a, b) => new Date(b.time) - new Date(a.time));
    },

    getUserAuctions(userId) {
        return DB.get('auctions', []).filter(a => a.sellerId === userId);
    }
};

// ===== NOTIFICATIONS =====
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
            if (navLinks) {
                nav.removeChild(navLinks);
            }
            
            const authDiv = nav.querySelector('.auth-buttons, .user-menu');
            if (authDiv) {
                nav.removeChild(authDiv);
            }
            
            const mobileToggle = nav.querySelector('.mobile-toggle');
            
            // Insert nav links before the auth section
            const linksHTML = `
                <div class="nav-links" id="nav-links">
                    <a href="index.html" class="${window.location.pathname.includes('index') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('Auction platform') ? 'active' : ''}">Home</a>
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
                    Auth.logout();
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
        const endTime = new Date(auction.endTime);
        const timeLeft = endTime - now;
        const isEndingSoon = timeLeft > 0 && timeLeft < 3600000 * 6; // 6 hours
        const isNew = (now - new Date(auction.startTime)) < 3600000 * 24; // 24 hours
        
        let badge = '';
        if (isEndingSoon) badge = '<span class="auction-badge badge-ending">Ending Soon</span>';
        else if (isNew && !auction.bids.length) badge = '<span class="auction-badge badge-new">New</span>';
        else if (auction.bids.length > 5) badge = '<span class="auction-badge badge-hot">Hot</span>';
        
        return `
            <div class="auction-card" onclick="window.location.href='auction-detail.html?id=${auction.id}'">
                <div class="auction-img">
                    <i class="fas fa-${auction.image || 'box'}"></i>
                    ${badge}
                    <span class="auction-timer" data-end="${auction.endTime}">
                        <i class="far fa-clock"></i> <span class="timer-text">--:--:--</span>
                    </span>
                </div>
                <div class="auction-body">
                    <h3 class="auction-title">${auction.title}</h3>
                    <p class="auction-desc">${auction.description}</p>
                    <div class="auction-meta">
                        <div class="auction-price">
                            <div class="current-bid">Current Bid</div>
                            <div class="bid-amount"><span class="currency">$</span>${Number(auction.currentBid).toLocaleString()}</div>
                        </div>
                        <div class="auction-bids">
                            <i class="fas fa-gavel"></i> ${auction.bids.length} bids
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBidHistoryItem(bid, isLast = false) {
        return `
            <div class="bid-history-item">
                <div class="bidder">
                    <span class="avatar-sm" style="background:${getRandomPastelColor(bid.userName)}">${getInitials(bid.userName)}</span>
                    ${bid.userName}
                </div>
                <div class="bid-amount">${formatCurrency(bid.amount)}</div>
                <div class="bid-time">${timeAgo(bid.time)}</div>
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
    landing() {
        seedData();
        Auth.checkSession();
        UI.renderNav();
        
        // Stats counter animation
        const stats = [
            { el: document.getElementById('stat-auctions'), target: DB.get('auctions', []).filter(a => a.status === 'active').length },
            { el: document.getElementById('stat-users'), target: DB.get('users', []).length },
            { el: document.getElementById('stat-bids'), target: DB.get('auctions', []).reduce((sum, a) => sum + a.bids.length, 0) },
            { el: document.getElementById('stat-value'), target: DB.get('auctions', []).reduce((sum, a) => sum + a.currentBid, 0) }
        ];
        
        stats.forEach(s => {
            if (!s.el) return;
            let current = 0;
            const step = Math.ceil(s.target / 50);
            const interval = setInterval(() => {
                current += step;
                if (current >= s.target) {
                    current = s.target;
                    clearInterval(interval);
                }
                if (s.el.id === 'stat-value') {
                    s.el.textContent = '$' + current.toLocaleString();
                } else {
                    s.el.textContent = current;
                }
            }, 30);
        });
        
        // Featured auctions
        const featured = AuctionService.getFeatured();
        const grid = document.getElementById('featured-grid');
        if (grid) {
            grid.innerHTML = featured.map(a => UI.renderAuctionCard(a)).join('');
        }
        
        UI.initTimers();
    },

    // Auctions Listing Page
    auctions() {
        seedData();
        Auth.checkSession();
        UI.renderNav();
        
        const grid = document.getElementById('auction-grid');
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        const categoryBtns = document.querySelectorAll('.category-filter');
        
        function renderListings() {
            const category = document.querySelector('.category-filter.active')?.dataset.category || 'all';
            const search = searchInput?.value || '';
            const sort = sortSelect?.value || 'popular';
            
            const results = AuctionService.filter({ category, search, sort });
            if (grid) {
                grid.innerHTML = results.length 
                    ? results.map(a => UI.renderAuctionCard(a)).join('')
                    : '<div style="text-align:center;padding:60px 20px;color:var(--gray-500);"><i class="fas fa-search" style="font-size:3rem;margin-bottom:15px;display:block;"></i><p>No auctions found matching your criteria.</p></div>';
            }
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', renderListings);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', renderListings);
        }
        
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderListings();
            });
        });
        
        renderListings();
        UI.initTimers();
    },

    // Auction Detail Page
    auctionDetail() {
        seedData();
        Auth.checkSession();
        UI.renderNav();
        
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const auction = AuctionService.getById(id);
        
        if (!auction) {
            document.querySelector('.auction-detail')?.remove();
            document.body.innerHTML = `
                <header></header>
                <div style="text-align:center;padding:100px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:4rem;color:var(--danger);margin-bottom:20px;display:block;"></i>
                    <h1>Auction Not Found</h1>
                    <p style="color:var(--gray-500);margin:15px 0;">This auction may have been removed or does not exist.</p>
                    <a href="auctions.html" class="btn-primary">Browse Auctions</a>
                </div>
            `;
            UI.renderNav();
            return;
        }
        
        // Render detail
        const detailEl = document.getElementById('auction-detail');
        if (!detailEl) return;
        
        const now = new Date();
        const endTime = new Date(auction.endTime);
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
                                <div class="price">${formatCurrency(auction.currentBid)}</div>
                            </div>
                            <div style="text-align:right;">
                                <div class="label">${auction.bids.length} bid${auction.bids.length !== 1 ? 's' : ''}</div>
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
                                <input type="number" id="bid-amount" value="${auction.currentBid + auction.minIncrement}" step="${auction.minIncrement}" min="${auction.currentBid + auction.minIncrement}" ${!AppState.isAuthenticated ? 'disabled' : ''}>
                                <button class="btn-bid" id="place-bid-btn" ${!AppState.isAuthenticated ? 'disabled' : ''}>
                                    <i class="fas fa-gavel"></i> Place Bid
                                </button>
                            </div>
                            ${!AppState.isAuthenticated ? '<p style="margin-top:10px;font-size:0.85rem;color:var(--gray-500);"><a href="login.html" style="color:var(--primary);font-weight:600;">Login</a> to place a bid</p>' : ''}
                        `}
                        
                        <div style="margin-top:15px;display:flex;justify-content:space-between;font-size:0.85rem;color:var(--gray-500);">
                            <span><i class="fas fa-flag"></i> Starting: ${formatCurrency(auction.startingPrice)}</span>
                            <span><i class="fas fa-arrow-up"></i> Min increment: ${formatCurrency(auction.minIncrement)}</span>
                        </div>
                    </div>
                    
                    <div class="bid-history">
                        <h3><i class="fas fa-history"></i> Bid History (${auction.bids.length})</h3>
                        <div class="bid-history-list" id="bid-history-list">
                            ${auction.bids.length 
                                ? auction.bids.slice().reverse().map(b => UI.renderBidHistoryItem(b)).join('')
                                : '<p style="color:var(--gray-500);text-align:center;padding:20px;">No bids yet. Be the first!</p>'
                            }
                        </div>
                    </div>
                    
                    <div style="margin-top:20px;font-size:0.85rem;color:var(--gray-500);">
                        <p><i class="fas fa-user"></i> Sold by: <strong>${auction.sellerName}</strong></p>
                        <p style="margin-top:5px;"><i class="fas fa-eye"></i> ${auction.views} views</p>
                    </div>
                </div>
            </div>
        `;
        
        // Timer
        if (isActive) {
            const timerInterval = setInterval(() => {
                const now = new Date();
                const end = new Date(auction.endTime);
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
            bidBtn.addEventListener('click', () => {
                if (!AppState.isAuthenticated) return;
                
                const amount = parseFloat(bidInput.value);
                if (isNaN(amount) || amount <= auction.currentBid) {
                    Toast.show(`Bid must be at least ${formatCurrency(auction.currentBid + auction.minIncrement)}`, 'error');
                    return;
                }
                
                if (amount < auction.currentBid + auction.minIncrement) {
                    Toast.show(`Minimum bid increment is ${formatCurrency(auction.minIncrement)}`, 'error');
                    return;
                }
                
                const result = AuctionService.placeBid(
                    auction.id,
                    AppState.currentUser.id,
                    AppState.currentUser.name,
                    amount
                );
                
                if (result.success) {
                    Toast.show(`Bid of ${formatCurrency(amount)} placed successfully!`, 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    Toast.show(result.error, 'error');
                }
            });
            
            // Enter key support
            bidInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') bidBtn.click();
            });
        }
        
        // Increment views
        const auctions = DB.get('auctions', []);
        const aIdx = auctions.findIndex(a => a.id === id);
        if (aIdx !== -1) {
            auctions[aIdx].views++;
            DB.set('auctions', auctions);
        }
    },

    // Dashboard Page
    dashboard() {
        seedData();
        Auth.checkSession();
        if (!AppState.isAuthenticated) {
            window.location.href = 'login.html?redirect=dashboard.html';
            return;
        }
        UI.renderNav();
        
        const user = AppState.currentUser;
        const myBids = AuctionService.getUserBids(user.id);
        const myAuctions = AuctionService.getUserAuctions(user.id);
        const wonAuctions = AuctionService.getWonAuctions(user.id);
        const activeBids = myBids.filter(b => new Date(b.auction.endTime) > new Date());
        
        // Stats
        document.getElementById('dash-active-bids').textContent = activeBids.length;
        document.getElementById('dash-my-auctions').textContent = myAuctions.length;
        document.getElementById('dash-won').textContent = wonAuctions.length;
        document.getElementById('dash-total-spent').textContent = formatCurrency(
            myBids.filter(b => b.auction.status === 'ended').reduce((sum, b) => {
                const auction = AuctionService.getById(b.auction.id);
                if (auction && auction.bids.length) {
                    const lastBid = auction.bids[auction.bids.length - 1];
                    return lastBid.userId === user.id ? sum + b.amount : sum;
                }
                return sum;
            }, 0)
        );
        
        // Tabs
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
                            <thead>
                                <tr><th>Auction</th><th>Your Bid</th><th>Status</th><th>Date</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${myBids.slice(0, 20).map(b => {
                                    const isWon = wonAuctions.find(w => w.id === b.auction.id);
                                    const isActive = new Date(b.auction.endTime) > new Date();
                                    let status = isActive ? 'active' : (isWon ? 'won' : 'ended');
                                    return `
                                        <tr>
                                            <td><strong>${b.auction.title}</strong></td>
                                            <td>${formatCurrency(b.amount)}</td>
                                            <td><span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                                            <td>${timeAgo(b.time)}</td>
                                            <td><a href="auction-detail.html?id=${b.auction.id}" class="btn-sm primary">View</a></td>
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
                            <thead>
                                <tr><th>Title</th><th>Current Bid</th><th>Bids</th><th>Status</th><th>Ends</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${myAuctions.map(a => {
                                    const isActive = new Date(a.endTime) > new Date();
                                    return `
                                        <tr>
                                            <td><strong>${a.title}</strong></td>
                                            <td>${formatCurrency(a.currentBid)}</td>
                                            <td>${a.bids.length}</td>
                                            <td><span class="status ${isActive ? 'active' : 'ended'}">${isActive ? 'Active' : 'Ended'}</span></td>
                                            <td>${isActive ? formatDate(a.endTime) : 'Ended'}</td>
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
                            <thead>
                                <tr><th>Auction</th><th>Winning Bid</th><th>Seller</th><th>Ended</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${wonAuctions.map(a => {
                                    const lastBid = a.bids[a.bids.length - 1];
                                    return `
                                        <tr>
                                            <td><strong>${a.title}</strong></td>
                                            <td>${formatCurrency(lastBid.amount)}</td>
                                            <td>${a.sellerName}</td>
                                            <td>${formatDate(a.endTime)}</td>
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
        
        // Show first tab
        if (tabs.length) tabs[0].click();
    },

    // Admin Page
    admin() {
        seedData();
        Auth.checkSession();
        if (!AppState.isAuthenticated || !Auth.isAdmin()) {
            window.location.href = 'login.html';
            return;
        }
        UI.renderNav();
        
        const users = DB.get('users', []);
        const auctions = DB.get('auctions', []);
        
        // Stats
        document.getElementById('admin-total-auctions').textContent = auctions.length;
        document.getElementById('admin-active-auctions').textContent = auctions.filter(a => a.status === 'active' && new Date(a.endTime) > new Date()).length;
        document.getElementById('admin-total-users').textContent = users.length;
        document.getElementById('admin-total-bids').textContent = auctions.reduce((sum, a) => sum + a.bids.length, 0);
        
        // Users table
        const usersBody = document.getElementById('admin-users-body');
        if (usersBody) {
            usersBody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="status ${u.role === 'admin' ? 'active' : 'pending'}">${u.role}</span></td>
                    <td>${formatDate(u.joinedAt)}</td>
                    <td>
                        <button class="btn-sm danger" onclick="if(confirm('Delete user ${u.name}?')){deleteUser('${u.id}')}">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Auctions table
        const auctionsBody = document.getElementById('admin-auctions-body');
        if (auctionsBody) {
            auctionsBody.innerHTML = auctions.map(a => {
                const isActive = new Date(a.endTime) > new Date();
                return `
                    <tr>
                        <td>${a.id}</td>
                        <td><strong>${a.title}</strong></td>
                        <td>${a.sellerName}</td>
                        <td>${formatCurrency(a.currentBid)}</td>
                        <td>${a.bids.length}</td>
                        <td><span class="status ${isActive ? 'active' : 'ended'}">${isActive ? 'Active' : 'Ended'}</span></td>
                        <td><a href="auction-detail.html?id=${a.id}" class="btn-sm primary">View</a></td>
                    </tr>
                `;
            }).join('');
        }
        
        // Sidebar navigation
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
    },

    // Auth pages
    login() {
        seedData();
        Auth.checkSession();
        if (AppState.isAuthenticated) {
            window.location.href = 'dashboard.html';
            return;
        }
        UI.renderNav();
        
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            const result = Auth.login(email, password);
            
            if (result.success) {
                Toast.show('Welcome back, ' + result.user.name + '!', 'success');
                const params = new URLSearchParams(window.location.search);
                const redirect = params.get('redirect') || 'dashboard.html';
                setTimeout(() => window.location.href = redirect, 1000);
            } else {
                Toast.show(result.error, 'error');
                document.querySelector('.form-group.email')?.classList.add('error');
                document.querySelector('.form-group.password')?.classList.add('error');
            }
        });
    },

    register() {
        seedData();
        Auth.checkSession();
        if (AppState.isAuthenticated) {
            window.location.href = 'dashboard.html';
            return;
        }
        UI.renderNav();
        
        const form = document.getElementById('register-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password')?.value;
            
            // Reset errors
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
            
            const result = Auth.register(name, email, password);
            
            if (result.success) {
                Toast.show('Account created! Welcome to BidHub!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                Toast.show(result.error, 'error');
                document.getElementById('email')?.closest('.form-group')?.classList.add('error');
            }
        });
    },

    // Create Auction Page
    createAuction() {
        seedData();
        Auth.checkSession();
        if (!AppState.isAuthenticated) {
            window.location.href = 'login.html?redirect=create-auction.html';
            return;
        }
        UI.renderNav();
        
        const form = document.getElementById('create-auction-form');
        if (!form) return;
        
        const categories = DB.get('categories', []);
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = categories.map(c => 
                `<option value="${c.name}">${c.name}</option>`
            ).join('');
        }
        
        form.addEventListener('submit', (e) => {
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
            
            const auction = AuctionService.addAuction({
                title,
                description,
                category,
                startingPrice,
                reservePrice,
                minIncrement,
                duration,
                sellerId: AppState.currentUser.id,
                sellerName: AppState.currentUser.name,
                image: 'box'
            });
            
            Toast.show('Auction created successfully!', 'success');
            setTimeout(() => window.location.href = `auction-detail.html?id=${auction.id}`, 1500);
        });
    }
};

// ===== GLOBAL DELETE USER FUNCTION =====
window.deleteUser = function(userId) {
    if (userId === AppState.currentUser?.id) {
        Toast.show('You cannot delete yourself', 'error');
        return;
    }
    let users = DB.get('users', []);
    users = users.filter(u => u.id !== userId);
    DB.set('users', users);
    Toast.show('User deleted', 'success');
    setTimeout(() => location.reload(), 1000);
};

// ===== INIT ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('index') || path.endsWith('/') || path.endsWith('Auction platform') || path.endsWith('Auction platform\\') || path.endsWith('Auction platform/')) {
        Page.landing();
    } else if (path.includes('auctions.html')) {
        Page.auctions();
    } else if (path.includes('auction-detail.html')) {
        Page.auctionDetail();
    } else if (path.includes('dashboard.html')) {
        Page.dashboard();
    } else if (path.includes('admin.html')) {
        Page.admin();
    } else if (path.includes('login.html')) {
        Page.login();
    } else if (path.includes('register.html')) {
        Page.register();
    } else if (path.includes('create-auction.html')) {
        Page.createAuction();
    } else if (path.includes('how-it-works.html')) {
        seedData();
        Auth.checkSession();
        UI.renderNav();
    }
});