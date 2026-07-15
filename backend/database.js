const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'auction.db');
let db;

function getDatabase() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS auctions (
            id TEXT PRIMARY KEY,
            seller_id TEXT NOT NULL,
            seller_name TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            starting_price REAL NOT NULL,
            current_bid REAL NOT NULL,
            reserve_price REAL DEFAULT 0,
            min_increment REAL DEFAULT 10,
            image TEXT DEFAULT 'box',
            featured INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            views INTEGER DEFAULT 0,
            watchers INTEGER DEFAULT 0,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS bids (
            id TEXT PRIMARY KEY,
            auction_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            amount REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (auction_id) REFERENCES auctions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
        CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category);
        CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
        CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
        CREATE INDEX IF NOT EXISTS idx_bids_user ON bids(user_id);
    `);
}

function seedDatabase() {
    const db = getDatabase();
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (count.count > 0) return;

    const salt = bcrypt.genSaltSync(10);
    const users = [
        { id: 'u1', name: 'John Smith', email: 'john@example.com', password: bcrypt.hashSync('password123', salt), role: 'user' },
        { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com', password: bcrypt.hashSync('password123', salt), role: 'user' },
        { id: 'u3', name: 'Mike Wilson', email: 'mike@example.com', password: bcrypt.hashSync('password123', salt), role: 'user' },
        { id: 'u4', name: 'Emily Davis', email: 'emily@example.com', password: bcrypt.hashSync('password123', salt), role: 'user' },
        { id: 'u5', name: 'Admin User', email: 'admin@example.com', password: bcrypt.hashSync('admin123', salt), role: 'admin' },
        { id: 'u6', name: 'Demo Bidder', email: 'demo@example.com', password: bcrypt.hashSync('demo123', salt), role: 'user' }
    ];

    const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
    for (const user of users) {
        insertUser.run(user.id, user.name, user.email, user.password, user.role);
    }

    const now = new Date();
    const addHours = (h) => new Date(now.getTime() + h * 3600000).toISOString();
    const subHours = (h) => new Date(now.getTime() - h * 3600000).toISOString();

    const auctions = [
        { id: 'a1', seller_id: 'u1', seller_name: 'John Smith', title: 'Vintage Rolex Submariner 16610', description: 'A stunning vintage Rolex Submariner in excellent condition. Comes with original box and papers.', category: 'Watches', starting_price: 5000, current_bid: 8750, reserve_price: 7000, min_increment: 100, image: 'watch', featured: 1, start_time: subHours(48), end_time: addHours(48) },
        { id: 'a2', seller_id: 'u2', seller_name: 'Sarah Johnson', title: 'Original Oil Painting - Abstract Landscape', description: 'A beautiful original oil painting on canvas. Size: 36x48 inches.', category: 'Art', starting_price: 200, current_bid: 680, reserve_price: 500, min_increment: 25, image: 'palette', featured: 1, start_time: subHours(72), end_time: addHours(24) },
        { id: 'a3', seller_id: 'u3', seller_name: 'Mike Wilson', title: 'First Edition Harry Potter Book Collection', description: 'Complete set of first edition Harry Potter books. All seven books in excellent condition.', category: 'Books', starting_price: 1000, current_bid: 3200, reserve_price: 2500, min_increment: 50, image: 'book-open', featured: 1, start_time: subHours(96), end_time: addHours(72) },
        { id: 'a4', seller_id: 'u4', seller_name: 'Emily Davis', title: 'Antique Victorian Diamond Ring', description: 'An exquisite Victorian-era diamond ring in 18k gold.', category: 'Jewelry', starting_price: 3000, current_bid: 5400, reserve_price: 4000, min_increment: 100, image: 'gem', featured: 1, start_time: subHours(60), end_time: addHours(12) },
        { id: 'a5', seller_id: 'u1', seller_name: 'John Smith', title: 'Rare Baseball Card Collection - 1952 Topps', description: 'Incredible collection of 1952 Topps baseball cards.', category: 'Collectibles', starting_price: 2000, current_bid: 2000, reserve_price: 1500, min_increment: 50, image: 'trophy', featured: 0, start_time: subHours(12), end_time: addHours(96) },
        { id: 'a6', seller_id: 'u2', seller_name: 'Sarah Johnson', title: 'Professional DSLR Camera - Canon EOS R5', description: 'Like-new Canon EOS R5 camera body. Only 5000 shutter count.', category: 'Electronics', starting_price: 2500, current_bid: 3200, reserve_price: 2800, min_increment: 50, image: 'camera', featured: 0, start_time: subHours(36), end_time: addHours(60) },
        { id: 'a7', seller_id: 'u3', seller_name: 'Mike Wilson', title: 'Vintage Gibson Les Paul Guitar 1978', description: 'A 1978 Gibson Les Paul Standard in wine red finish.', category: 'Music', starting_price: 3500, current_bid: 4200, reserve_price: 3800, min_increment: 100, image: 'music', featured: 0, start_time: subHours(48), end_time: addHours(36) },
        { id: 'a8', seller_id: 'u4', seller_name: 'Emily Davis', title: 'Louis Vuitton Neverfull MM Damier', description: 'Authentic Louis Vuitton Neverfull MM in Damier Ebene canvas.', category: 'Fashion', starting_price: 800, current_bid: 1250, reserve_price: 1000, min_increment: 25, image: 'tshirt', featured: 0, start_time: subHours(24), end_time: addHours(48) },
        { id: 'a9', seller_id: 'u1', seller_name: 'John Smith', title: 'Bidding Wars Board Game - Rare Edition', description: 'Limited collector\'s edition of the classic bidding game.', category: 'Collectibles', starting_price: 50, current_bid: 50, reserve_price: 75, min_increment: 5, image: 'dice', featured: 0, start_time: subHours(6), end_time: addHours(120) }
    ];

    const insertAuction = db.prepare('INSERT INTO auctions (id, seller_id, seller_name, title, description, category, starting_price, current_bid, reserve_price, min_increment, image, featured, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const a of auctions) {
        insertAuction.run(a.id, a.seller_id, a.seller_name, a.title, a.description, a.category, a.starting_price, a.current_bid, a.reserve_price, a.min_increment, a.image, a.featured, a.start_time, a.end_time);
    }

    const bids = [
        { auction_id: 'a1', user_id: 'u2', user_name: 'Sarah Johnson', amount: 5500, time: subHours(40) },
        { auction_id: 'a1', user_id: 'u3', user_name: 'Mike Wilson', amount: 6200, time: subHours(36) },
        { auction_id: 'a1', user_id: 'u2', user_name: 'Sarah Johnson', amount: 7000, time: subHours(24) },
        { auction_id: 'a1', user_id: 'u4', user_name: 'Emily Davis', amount: 7800, time: subHours(12) },
        { auction_id: 'a1', user_id: 'u3', user_name: 'Mike Wilson', amount: 8500, time: subHours(6) },
        { auction_id: 'a1', user_id: 'u2', user_name: 'Sarah Johnson', amount: 8750, time: subHours(2) },
        { auction_id: 'a2', user_id: 'u1', user_name: 'John Smith', amount: 250, time: subHours(60) },
        { auction_id: 'a2', user_id: 'u4', user_name: 'Emily Davis', amount: 325, time: subHours(48) },
        { auction_id: 'a2', user_id: 'u1', user_name: 'John Smith', amount: 400, time: subHours(36) },
        { auction_id: 'a2', user_id: 'u3', user_name: 'Mike Wilson', amount: 520, time: subHours(24) },
        { auction_id: 'a2', user_id: 'u4', user_name: 'Emily Davis', amount: 600, time: subHours(12) },
        { auction_id: 'a2', user_id: 'u3', user_name: 'Mike Wilson', amount: 680, time: subHours(3) },
        { auction_id: 'a3', user_id: 'u1', user_name: 'John Smith', amount: 1200, time: subHours(84) },
        { auction_id: 'a3', user_id: 'u4', user_name: 'Emily Davis', amount: 1500, time: subHours(72) },
        { auction_id: 'a3', user_id: 'u2', user_name: 'Sarah Johnson', amount: 2000, time: subHours(48) },
        { auction_id: 'a3', user_id: 'u1', user_name: 'John Smith', amount: 2600, time: subHours(24) },
        { auction_id: 'a3', user_id: 'u4', user_name: 'Emily Davis', amount: 3200, time: subHours(8) },
        { auction_id: 'a4', user_id: 'u2', user_name: 'Sarah Johnson', amount: 3500, time: subHours(48) },
        { auction_id: 'a4', user_id: 'u1', user_name: 'John Smith', amount: 4200, time: subHours(36) },
        { auction_id: 'a4', user_id: 'u2', user_name: 'Sarah Johnson', amount: 4800, time: subHours(24) },
        { auction_id: 'a4', user_id: 'u3', user_name: 'Mike Wilson', amount: 5400, time: subHours(6) },
        { auction_id: 'a6', user_id: 'u3', user_name: 'Mike Wilson', amount: 2700, time: subHours(30) },
        { auction_id: 'a6', user_id: 'u4', user_name: 'Emily Davis', amount: 2950, time: subHours(20) },
        { auction_id: 'a6', user_id: 'u1', user_name: 'John Smith', amount: 3200, time: subHours(10) },
        { auction_id: 'a7', user_id: 'u4', user_name: 'Emily Davis', amount: 3700, time: subHours(36) },
        { auction_id: 'a7', user_id: 'u1', user_name: 'John Smith', amount: 3900, time: subHours(24) },
        { auction_id: 'a7', user_id: 'u2', user_name: 'Sarah Johnson', amount: 4200, time: subHours(12) },
        { auction_id: 'a8', user_id: 'u2', user_name: 'Sarah Johnson', amount: 900, time: subHours(18) },
        { auction_id: 'a8', user_id: 'u1', user_name: 'John Smith', amount: 1050, time: subHours(10) },
        { auction_id: 'a8', user_id: 'u2', user_name: 'Sarah Johnson', amount: 1250, time: subHours(4) }
    ];

    const insertBid = db.prepare('INSERT INTO bids (id, auction_id, user_id, user_name, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    for (const b of bids) {
        insertBid.run(uuidv4(), b.auction_id, b.user_id, b.user_name, b.amount, b.time);
    }

    // Update view counts
    for (const a of auctions) {
        const views = Math.floor(Math.random() * 400) + 30;
        const watchers = Math.floor(Math.random() * 25) + 3;
        db.prepare('UPDATE auctions SET views = ?, watchers = ? WHERE id = ?').run(views, watchers, a.id);
    }

    console.log('Database seeded successfully.');
}

module.exports = { getDatabase, seedDatabase };