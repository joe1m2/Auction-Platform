// ============================================
// API Service - Connects frontend to backend
// ============================================

const API_BASE = 'https://bidhub-api.onrender.com/api';

const ApiService = {
    // Store token
    getToken() {
        return localStorage.getItem('auction_token');
    },
    setToken(token) {
        localStorage.setItem('auction_token', token);
    },
    removeToken() {
        localStorage.removeItem('auction_token');
    },

    // Generic request helper
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
            }
            throw error;
        }
    },

    // ===== AUTH =====
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    },

    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        this.setToken(data.token);
        return data;
    },

    async getMe() {
        return await this.request('/auth/me');
    },

    logout() {
        this.removeToken();
        localStorage.removeItem('auction_currentUser');
        window.location.href = 'index.html';
    },

    // ===== AUCTIONS =====
    async getAuctions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/auctions${query ? '?' + query : ''}`);
    },

    async getFeaturedAuctions() {
        return await this.request('/auctions/featured');
    },

    async getAuction(id) {
        return await this.request(`/auctions/${id}`);
    },

    async createAuction(data) {
        return await this.request('/auctions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async placeBid(auctionId, amount) {
        return await this.request(`/auctions/${auctionId}/bid`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    },

    // ===== USER =====
    async getMyBids() {
        return await this.request('/users/me/bids');
    },

    async getMyAuctions() {
        return await this.request('/users/me/auctions');
    },

    async getWonAuctions() {
        return await this.request('/users/me/won');
    },

    // ===== ADMIN =====
    async getAdminStats() {
        return await this.request('/admin/stats');
    },

    async getAdminUsers() {
        return await this.request('/admin/users');
    },

    async getAdminAuctions() {
        return await this.request('/admin/auctions');
    },

    async deleteUser(userId) {
        return await this.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },

    async getAllBids() {
        return await this.request('/admin/bids');
    }
};
