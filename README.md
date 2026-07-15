# BidHub - Online Auction Platform

A fully functional online auction platform with Node.js backend and vanilla JavaScript frontend.

## Features
- Browse and search auctions by category
- User registration and login with JWT
- Place bids with minimum increment validation
- Live countdown timers on auctions
- User dashboard with active bids, auctions, and won items
- Admin panel for managing users and auctions
- Create new auction listings
- Responsive design for all devices
- SQLite database with seeded sample data

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT (jsonwebtoken)
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure
```
Auction platform/
├── index.html              # Landing page
├── auctions.html           # Browse auctions
├── auction-detail.html     # Auction details & bidding
├── login.html              # User login
├── register.html           # User registration
├── dashboard.html          # User dashboard
├── admin.html              # Admin panel
├── create-auction.html     # Create new auction
├── how-it-works.html       # Info page
├── css/
│   └── style.css           # All styles
├── js/
│   ├── api.js              # API service (connects to backend)
│   └── app.js              # Frontend logic
├── backend/
│   ├── server.js           # Express server
│   ├── database.js         # SQLite setup & seeding
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── vercel.json             # Vercel deployment config
└── render.yaml             # Render deployment config
```

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| User | john@example.com | password123 |
| Admin | admin@example.com | admin123 |

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/joe1m2/Auction-Platform.git
cd Auction-Platform
```

2. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

3. **Start the backend server**
```bash
cd backend
node server.js
```
Server runs at `http://localhost:5000`

4. **Open the frontend**
Open `index.html` in your browser, or use a local server:
```bash
# From the Auction platform folder
npx serve .
```

## Deployment

### Deploy Backend to Render (Free Tier)

1. Push this repo to GitHub (already done)
2. Go to [https://render.com](https://render.com)
3. Sign up / Log in
4. Click **"New +"** → **"Web Service"**
5. Connect your GitHub account
6. Select the **Auction-Platform** repository
7. Configure:
   - **Name:** `bidhub-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
   - **Plan:** Free
8. Add environment variable:
   - `JWT_SECRET` → Generate a random secret key
9. Click **"Create Web Service"**
10. Wait for deployment (2-3 minutes)
11. Copy your Render URL (e.g., `https://bidhub-api.onrender.com`)

### Deploy Frontend to Vercel (Free Tier)

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up / Log in
3. Click **"Add New..."** → **"Project"**
4. Import your **Auction-Platform** repository
5. Configure:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** Leave empty
   - **Output Directory:** `.` (dot)
6. Click **"Deploy"**
7. Wait for deployment (1-2 minutes)
8. Copy your Vercel URL (e.g., `https://auction-platform.vercel.app`)

### Connect Frontend to Backend

After both deployments:

1. Update `Auction platform/js/api.js`:
   - Change `const API_BASE = 'http://localhost:5000/api';`
   - To: `const API_BASE = 'https://your-render-url.onrender.com/api';`

2. Commit and push:
```bash
git add js/api.js
git commit -m "Update API URL for production"
git push
```

3. Redeploy both services (Vercel and Render will auto-deploy on push)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user (auth required)

### Auctions
- `GET /api/auctions` - Get all active auctions (with filters)
- `GET /api/auctions/featured` - Get featured auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create auction (auth required)
- `POST /api/auctions/:id/bid` - Place bid (auth required)

### User
- `GET /api/users/me/bids` - Get user's bids (auth required)
- `GET /api/users/me/auctions` - Get user's auctions (auth required)
- `GET /api/users/me/won` - Get won auctions (auth required)

### Admin
- `GET /api/admin/stats` - Get platform statistics (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/auctions` - Get all auctions (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

## Database Schema

### Users
- id, name, email, password (hashed), role, created_at

### Auctions
- id, seller_id, seller_name, title, description, category
- starting_price, current_bid, reserve_price, min_increment
- image, featured, status, views, watchers
- start_time, end_time, created_at

### Bids
- id, auction_id, user_id, user_name, amount, created_at

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
```

## License
MIT

## Author
Created by BidHub Team