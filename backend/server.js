const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, seedDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bidhub-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json());

// Seed database on startup
seedDatabase();

// ===== AUTH MIDDLEWARE =====
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// ===== AUTH ROUTES =====
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }
    });
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)').run(id, name, email, hashed);

    const token = jwt.sign({ id, name, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
        token,
        user: { id, name, email, role: 'user', created_at: new Date().toISOString() }
    });
});

app.get('/api/auth/me', authenticate, (req, res) => {
    const db = getDatabase();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

// ===== AUCTION ROUTES =====
app.get('/api/auctions', (req, res) => {
    const db = getDatabase();
    const { category, search, sort } = req.query;
    const now = new Date().toISOString();

    let query = `SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
                 FROM auctions a WHERE a.status = 'active' AND a.end_time > ?`;
    let params = [now];

    if (category && category !== 'all') {
        query += ' AND a.category = ?';
        params.push(category);
    }

    if (search) {
        query += ' AND (a.title LIKE ? OR a.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    let orderBy = 'bid_count DESC, a.start_time DESC';
    if (sort === 'price-low') orderBy = 'a.current_bid ASC';
    else if (sort === 'price-high') orderBy = 'a.current_bid DESC';
    else if (sort === 'ending-soon') orderBy = 'a.end_time ASC';
    else if (sort === 'newest') orderBy = 'a.start_time DESC';
    else orderBy = 'a.featured DESC, bid_count DESC, a.start_time DESC';

    query += ` ORDER BY ${orderBy}`;
    const auctions = db.prepare(query).all(...params);
    res.json(auctions);
});

app.get('/api/auctions/featured', (req, res) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const auctions = db.prepare(`
        SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a WHERE a.featured = 1 AND a.status = 'active' AND a.end_time > ?
        ORDER BY bid_count DESC, a.start_time DESC
    `).all(now);
    res.json(auctions);
});

app.get('/api/auctions/:id', (req, res) => {
    const db = getDatabase();
    const auction = db.prepare(`
        SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a WHERE a.id = ?
    `).get(req.params.id);

    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    const bids = db.prepare('SELECT * FROM bids WHERE auction_id = ? ORDER BY created_at DESC').all(req.params.id);
    
    // Increment views
    db.prepare('UPDATE auctions SET views = views + 1 WHERE id = ?').run(req.params.id);
    auction.views += 1;

    res.json({ ...auction, bids });
});

app.post('/api/auctions', authenticate, (req, res) => {
    const { title, description, category, starting_price, reserve_price, min_increment, duration, image } = req.body;

    if (!title || !description || !category || !starting_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (title.length < 5) return res.status(400).json({ error: 'Title too short' });
    if (starting_price < 1) return res.status(400).json({ error: 'Starting price must be at least $1' });

    const id = uuidv4();
    const end_time = new Date(Date.now() + (duration || 72) * 3600000).toISOString();
    const db = getDatabase();

    db.prepare(`INSERT INTO auctions (id, seller_id, seller_name, title, description, category, starting_price, current_bid, reserve_price, min_increment, image, end_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, req.user.id, req.user.name, title, description, category, starting_price, starting_price,
        reserve_price || 0, min_increment || 10, image || 'box', end_time
    );

    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
    res.status(201).json(auction);
});

app.post('/api/auctions/:id/bid', authenticate, (req, res) => {
    const db = getDatabase();
    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(req.params.id);
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    const now = new Date();
    if (new Date(auction.end_time) < now) {
        return res.status(400).json({ error: 'Auction has ended' });
    }

    const { amount } = req.body;
    if (!amount || amount <= auction.current_bid) {
        return res.status(400).json({ error: `Bid must be at least $${(auction.current_bid + auction.min_increment).toFixed(2)}` });
    }
    if (amount < auction.current_bid + auction.min_increment) {
        return res.status(400).json({ error: `Minimum bid increment is $${auction.min_increment.toFixed(2)}` });
    }

    const bidId = uuidv4();
    db.prepare('INSERT INTO bids (id, auction_id, user_id, user_name, amount) VALUES (?, ?, ?, ?, ?)')
        .run(bidId, auction.id, req.user.id, req.user.name, amount);
    db.prepare('UPDATE auctions SET current_bid = ? WHERE id = ?').run(amount, auction.id);

    const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);
    res.status(201).json(bid);
});

// ===== USER ROUTES =====
app.get('/api/users/me/bids', authenticate, (req, res) => {
    const db = getDatabase();
    const bids = db.prepare(`
        SELECT b.*, a.title as auction_title, a.end_time as auction_end, a.status as auction_status
        FROM bids b JOIN auctions a ON b.auction_id = a.id
        WHERE b.user_id = ? ORDER BY b.created_at DESC
    `).all(req.user.id);
    res.json(bids);
});

app.get('/api/users/me/auctions', authenticate, (req, res) => {
    const db = getDatabase();
    const auctions = db.prepare(`
        SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a WHERE a.seller_id = ? ORDER BY a.created_at DESC
    `).all(req.user.id);
    res.json(auctions);
});

app.get('/api/users/me/won', authenticate, (req, res) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const won = db.prepare(`
        SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a 
        WHERE a.end_time < ? AND a.id IN (
            SELECT b.auction_id FROM bids b 
            WHERE b.user_id = ? AND b.amount = (
                SELECT MAX(amount) FROM bids WHERE auction_id = b.auction_id
            )
        )
        ORDER BY a.end_time DESC
    `).all(now, req.user.id);
    res.json(won);
});

// ===== ADMIN ROUTES =====
app.get('/api/admin/stats', authenticate, requireAdmin, (req, res) => {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stats = {
        total_auctions: db.prepare('SELECT COUNT(*) as count FROM auctions').get().count,
        active_auctions: db.prepare('SELECT COUNT(*) as count FROM auctions WHERE status = ? AND end_time > ?').get('active', now).count,
        total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        total_bids: db.prepare('SELECT COUNT(*) as count FROM bids').get().count
    };
    res.json(stats);
});

app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
    const db = getDatabase();
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
});

app.get('/api/admin/auctions', authenticate, requireAdmin, (req, res) => {
    const db = getDatabase();
    const auctions = db.prepare(`
        SELECT a.*, (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
        FROM auctions a ORDER BY a.created_at DESC
    `).all();
    res.json(auctions);
});

app.delete('/api/admin/users/:id', authenticate, requireAdmin, (req, res) => {
    const db = getDatabase();
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
});

app.get('/api/admin/bids', authenticate, requireAdmin, (req, res) => {
    const db = getDatabase();
    const bids = db.prepare(`
        SELECT b.*, 
               a.title as auction_title,
               a.category as auction_category,
               u.email as user_email,
               u.name as user_name
        FROM bids b
        JOIN auctions a ON b.auction_id = a.id
        JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
    `).all();
    res.json(bids);
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`BidHub API server running on http://localhost:${PORT}`);
    console.log(`Test accounts:`);
    console.log(`  User:  john@example.com / password123`);
    console.log(`  Admin: admin@example.com / admin123`);
});