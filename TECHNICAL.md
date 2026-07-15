# BidHub - Technical Documentation

## Technology Stack

### Frontend
- **HTML5** - Page structure and content
- **CSS3** - Styling with custom properties (CSS variables), Flexbox, Grid
- **JavaScript (ES6+)** - Interactive functionality, API calls, state management
- **Font Awesome 6.5.1** - Icon library for UI elements
- **No frameworks** - Pure vanilla JavaScript for optimal performance

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **SQLite (better-sqlite3 11.0.0)** - Lightweight database
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing
- **CORS** - Cross-origin resource sharing
- **UUID 9.0.0** - Unique ID generation

### Deployment
- **Vercel** - Frontend hosting (static files)
- **Render** - Backend hosting (Node.js server)
- **GitHub** - Version control and CI/CD

---

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼────────────────────────┐
│   Vercel (Frontend)           │
│   - HTML/CSS/JS files          │
│   - Static hosting             │
│   - Global CDN                 │
└──────┬────────────────────────┘
       │
       │ API Calls (fetch)
       │
┌──────▼────────────────────────┐
│   Render (Backend)             │
│   - Node.js + Express          │
│   - REST API                   │
│   - Business logic             │
└──────┬────────────────────────┘
       │
       │ SQL queries
       │
┌──────▼────────────────────────┐
│   SQLite Database              │
│   - Users                      │
│   - Auctions                   │
│   - Bids                       │
└───────────────────────────────┘
```

---

## How It Works

### 1. Frontend Architecture

#### File Structure
```
Auction platform/
├── index.html              # Landing page
├── auctions.html           # Auction listing
├── auction-detail.html     # Single auction view
├── login.html              # Authentication
├── register.html
├── dashboard.html          # User dashboard
├── admin.html              # Admin panel
├── create-auction.html     # Create listing
├── how-it-works.html       # Info page
├── css/
│   └── style.css           # All styles (700+ lines)
├── js/
│   ├── api.js              # API client (fetch wrapper)
│   └── app.js              # Frontend logic (900+ lines)
└── assets/                 # Images, icons
```

#### State Management
```javascript
const AppState = {
    currentUser: null,      // Logged in user object
    isAuthenticated: false,  // Auth status
    auctions: [],           // Cached auctions
    myBids: [],             // User's bids
    myAuctions: [],         // User's listings
    notifications: []       // Toast messages
};
```

#### API Service (api.js)
- **Purpose:** Centralized HTTP client for all backend communication
- **Base URL:** `https://bidhub-api.onrender.com/api`
- **Authentication:** JWT tokens stored in localStorage
- **Methods:**
  - `login(email, password)` - Authenticate user
  - `register(name, email, password)` - Create account
  - `getAuctions(params)` - Fetch auctions with filters
  - `placeBid(auctionId, amount)` - Submit bid
  - `getMyBids()` - Get user's bidding history
  - etc.

**Example API Call:**
```javascript
// Login
const result = await Api.login('john@example.com', 'password123');
// Stores JWT token in localStorage
// Returns user object and token
```

#### UI Rendering (app.js)
- **Dynamic content loading** - All data fetched from API
- **Template literals** - HTML generation
- **Event delegation** - Efficient event handling
- **Timer system** - Live countdown updates every second

**Example:**
```javascript
// Render auction card
renderAuctionCard(auction) {
    return `
        <div class="auction-card">
            <div class="auction-img">
                <i class="fas fa-${auction.image}"></i>
                <span class="auction-timer" data-end="${auction.end_time}">
                    <span class="timer-text">--:--:--</span>
                </span>
            </div>
            <h3>${auction.title}</h3>
            <div class="bid-amount">$${auction.current_bid}</div>
        </div>
    `;
}
```

---

### 2. Backend Architecture

#### File Structure
```
backend/
├── server.js           # Express app & routes (500+ lines)
├── database.js         # SQLite setup & seeding (400+ lines)
├── package.json        # Dependencies
└── .env.example        # Environment variables
```

#### Server Setup (server.js)

**Middleware Stack:**
```javascript
app.use(cors());              // Enable CORS for frontend
app.use(express.json());      // Parse JSON request bodies
app.use(authenticate);        // JWT verification (protected routes)
```

**Route Organization:**
```javascript
// Public routes
POST /api/auth/login
POST /api/auth/register
GET  /api/auctions
GET  /api/auctions/featured
GET  /api/auctions/:id

// Protected routes (require JWT)
POST /api/auctions              (auth required)
POST /api/auctions/:id/bid      (auth required)
GET  /api/users/me/bids         (auth required)
GET  /api/users/me/auctions     (auth required)

// Admin routes (require admin role)
GET  /api/admin/stats           (admin only)
GET  /api/admin/users           (admin only)
DELETE /api/admin/users/:id     (admin only)
```

#### Authentication Flow

**1. User Login:**
```javascript
POST /api/auth/login
Body: { email, password }

→ Validate credentials
→ Generate JWT token (expires in 7 days)
→ Return { token, user }
```

**2. Protected Route Access:**
```javascript
Client sends: Authorization: Bearer <token>
Server verifies: jwt.verify(token, JWT_SECRET)
Server extracts: req.user = { id, name, email, role }
```

**3. Password Hashing:**
```javascript
// Registration
const hashed = bcrypt.hashSync(password, 10);

// Login
const valid = bcrypt.compareSync(password, user.password);
```

#### Database Schema (database.js)

**Users Table:**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,      -- bcrypt hashed
    role TEXT DEFAULT 'user',    -- 'user' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Auctions Table:**
```sql
CREATE TABLE auctions (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,     -- Foreign key to users
    seller_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    starting_price REAL NOT NULL,
    current_bid REAL NOT NULL,   -- Updated on each bid
    reserve_price REAL DEFAULT 0,
    min_increment REAL DEFAULT 10,
    image TEXT DEFAULT 'box',    -- Font Awesome icon name
    featured INTEGER DEFAULT 0,  -- 0 or 1
    status TEXT DEFAULT 'active',
    views INTEGER DEFAULT 0,
    watchers INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Bids Table:**
```sql
CREATE TABLE bids (
    id TEXT PRIMARY KEY,
    auction_id TEXT NOT NULL,    -- Foreign key to auctions
    user_id TEXT NOT NULL,       -- Foreign key to users
    user_name TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Database Seeding

**Automatic on First Run:**
```javascript
function seedDatabase() {
    // Check if data exists
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (count.count > 0) return;  // Already seeded
    
    // Insert 6 users (hashed passwords)
    // Insert 9 auctions with various categories
    // Insert 30+ bids with timestamps
    // Update view counts
}
```

**Sample Data:**
- 6 users (4 regular, 1 admin, 1 demo)
- 9 auctions across 8 categories
- 30+ bids with realistic timestamps
- Categories: Electronics, Fashion, Art, Collectibles, Jewelry, Watches, Music, Books

---

### 3. Key Features Implementation

#### Live Countdown Timers

**Frontend (app.js):**
```javascript
updateTimers() {
    document.querySelectorAll('.auction-timer').forEach(el => {
        const end = new Date(el.dataset.end);
        const now = new Date();
        const diff = end - now;
        
        if (diff <= 0) {
            timerText.textContent = 'Ended';
            return;
        }
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerText.textContent = `${h}:${m}:${s}`;
    });
}

// Update every second
setInterval(() => this.updateTimers(), 1000);
```

#### Bid Validation

**Backend (server.js):**
```javascript
app.post('/api/auctions/:id/bid', authenticate, (req, res) => {
    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(req.params.id);
    
    // Check if auction ended
    if (new Date(auction.end_time) < new Date()) {
        return res.status(400).json({ error: 'Auction has ended' });
    }
    
    const { amount } = req.body;
    
    // Validate minimum bid
    if (amount <= auction.current_bid) {
        return res.status(400).json({ 
            error: `Bid must be at least $${auction.current_bid + auction.min_increment}` 
        });
    }
    
    // Validate increment
    if (amount < auction.current_bid + auction.min_increment) {
        return res.status(400).json({ 
            error: `Minimum bid increment is $${auction.min_increment}` 
        });
    }
    
    // Save bid and update current_bid
    db.prepare('INSERT INTO bids ...').run(...);
    db.prepare('UPDATE auctions SET current_bid = ? WHERE id = ?').run(amount, auction.id);
});
```

#### Search & Filtering

**Backend (server.js):**
```javascript
app.get('/api/auctions', (req, res) => {
    const { category, search, sort } = req.query;
    
    let query = `SELECT a.*, 
                 (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                 FROM auctions a 
                 WHERE a.status = 'active' AND a.end_time > ?`;
    let params = [now];
    
    // Category filter
    if (category && category !== 'all') {
        query += ' AND a.category = ?';
        params.push(category);
    }
    
    // Search filter
    if (search) {
        query += ' AND (a.title LIKE ? OR a.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    // Sorting
    let orderBy = 'bid_count DESC, a.start_time DESC';
    if (sort === 'price-low') orderBy = 'a.current_bid ASC';
    else if (sort === 'price-high') orderBy = 'a.current_bid DESC';
    else if (sort === 'ending-soon') orderBy = 'a.end_time ASC';
    
    query += ` ORDER BY ${orderBy}`;
    const auctions = db.prepare(query).all(...params);
    res.json(auctions);
});
```

#### Admin Panel

**Protected Routes:**
```javascript
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Usage
app.get('/api/admin/stats', authenticate, requireAdmin, (req, res) => {
    const stats = {
        total_auctions: db.prepare('SELECT COUNT(*) FROM auctions').get().count,
        active_auctions: db.prepare('SELECT COUNT(*) FROM auctions WHERE status = ? AND end_time > ?').get('active', now).count,
        total_users: db.prepare('SELECT COUNT(*) FROM users').get().count,
        total_bids: db.prepare('SELECT COUNT(*) FROM bids').get().count
    };
    res.json(stats);
});
```

---

### 4. Data Flow

#### User Registration Flow
```
1. User fills registration form
   ↓
2. Frontend validates input
   ↓
3. POST /api/auth/register { name, email, password }
   ↓
4. Backend validates and hashes password
   ↓
5. Insert user into database
   ↓
6. Generate JWT token
   ↓
7. Return { token, user }
   ↓
8. Frontend stores token in localStorage
   ↓
9. Redirect to dashboard
```

#### Bidding Flow
```
1. User views auction detail page
   ↓
2. Frontend fetches auction data
   GET /api/auctions/:id
   ↓
3. User enters bid amount
   ↓
4. Frontend validates minimum bid
   ↓
5. POST /api/auctions/:id/bid { amount }
   Authorization: Bearer <token>
   ↓
6. Backend validates:
   - User is authenticated
   - Auction is active
   - Bid amount is valid
   ↓
7. Insert bid into database
   UPDATE auctions SET current_bid = ? WHERE id = ?
   ↓
8. Return new bid object
   ↓
9. Frontend shows success toast
   ↓
10. Reload page to show updated data
```

---

### 5. Security Measures

#### Password Security
- **bcrypt hashing** - One-way encryption with salt
- **Minimum 6 characters** - Enforced on registration
- **Never stored in plain text**

#### JWT Authentication
- **Signed tokens** - Cannot be tampered with
- **7-day expiration** - Automatic logout
- **Stored in localStorage** - Persists across sessions
- **Sent in Authorization header** - Standard practice

#### Input Validation
```javascript
// Backend validation
if (!title || title.length < 5) {
    return res.status(400).json({ error: 'Title too short' });
}

if (starting_price < 1) {
    return res.status(400).json({ error: 'Starting price must be at least $1' });
}

// Frontend validation
if (password.length < 6) {
    Toast.show('Password must be at least 6 characters', 'error');
    return;
}
```

#### CORS Configuration
```javascript
app.use(cors({
    origin: '*',  // Allow all origins (restrict in production)
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 6. Performance Optimizations

#### Frontend
- **No frameworks** - No framework overhead
- **Vanilla JS** - Fast DOM manipulation
- **CSS variables** - Efficient theming
- **Event delegation** - Single event listener for multiple elements
- **Lazy loading** - Data fetched on demand

#### Backend
- **SQLite** - Lightweight, fast for read-heavy workloads
- **Database indexes** - On status, category, end_time, auction_id, user_id
- **Connection pooling** - Single database connection (WAL mode)
- **Efficient queries** - Subqueries for bid counts

#### Deployment
- **Vercel CDN** - Global content delivery
- **Static files** - No server-side rendering overhead
- **Render free tier** - Adequate for small-scale usage

---

### 7. Database Design Patterns

#### Foreign Keys
```sql
FOREIGN KEY (seller_id) REFERENCES users(id)
FOREIGN KEY (auction_id) REFERENCES auctions(id)
FOREIGN KEY (user_id) REFERENCES users(id)
```

#### Indexes for Performance
```sql
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_category ON auctions(category);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_user ON bids(user_id);
```

#### Cascading Operations
```javascript
// When user is deleted, their bids remain (historical record)
// When auction is deleted, related bids are deleted
app.delete('/api/admin/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    // Bids remain for historical purposes
});
```

---

### 8. Error Handling

#### Frontend
```javascript
try {
    const result = await Api.login(email, password);
    Toast.show('Welcome!', 'success');
} catch (error) {
    Toast.show(error.message, 'error');
}
```

#### Backend
```javascript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Route-specific error handling
app.post('/api/auth/login', (req, res) => {
    try {
        // ... logic
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
```

---

### 9. Responsive Design

#### CSS Grid & Flexbox
```css
.auction-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
}

@media (max-width: 768px) {
    .auction-grid {
        grid-template-columns: 1fr;
    }
}
```

#### Mobile Navigation
```css
.mobile-toggle {
    display: none;
}

@media (max-width: 768px) {
    .mobile-toggle {
        display: block;
    }
    .nav-links {
        display: none;
    }
    .nav-links.mobile-open {
        display: flex;
    }
}
```

---

### 10. Testing

#### Test Accounts
| Role | Email | Password | Access |
|------|-------|----------|--------|
| User | john@example.com | password123 | Bidding, dashboard |
| Admin | admin@example.com | admin123 | Full admin panel |

#### Manual Testing Checklist
- [ ] User registration
- [ ] User login/logout
- [ ] Browse auctions
- [ ] Search auctions
- [ ] Filter by category
- [ ] Sort auctions
- [ ] View auction details
- [ ] Place bid
- [ ] View dashboard
- [ ] View bid history
- [ ] Create auction
- [ ] Admin login
- [ ] Admin stats
- [ ] Admin user management
- [ ] Admin auction management

---

## Summary

**BidHub** is a full-stack web application using:
- **Vanilla JavaScript** for lightweight, fast frontend
- **Node.js + Express** for scalable backend API
- **SQLite** for simple, portable database
- **JWT** for secure authentication
- **Vercel + Render** for free, reliable hosting

The platform handles real-time bidding, user authentication, admin management, and provides a responsive experience across all devices.