/**
 * header.js - Fix logic nhận diện Admin (Final Ultimate Version)
 */

function headerApp() {
    return {
        sidebarOpen: false,

        // User mặc định
        user: {
            name: '...',
            avatar: '../img/default-avatar.png',
            role: '',
            tenantName: '...',
            email: ''
        },

        isAdmin: false,       // Cờ quyết định hiển thị menu
        userPermissions: [],  // Danh sách quyền
        currentPlan: 'starter',

        plans: {
            starter: { name: 'STARTER', limits: { projects: 1 } },
            professional: { name: 'PROFESSIONAL', limits: { projects: 5 } },
            enterprise: { name: 'ENTERPRISE', limits: { projects: 'unlimited' } }
        },

        initHeader() {
            // Fix lỗi Alpine Store
            if (!window.Alpine.store('globalNotify')) {
                window.Alpine.store('globalNotify', { unreadCount: 0, notificationList: [] });
            }
            this.loadUserData();
        },

        // --- CHECK QUYỀN (QUAN TRỌNG NHẤT) ---
        canAccess(requiredPerms) {
            // 1. NẾU LÀ ADMIN -> HIỆN HẾT
            if (this.isTenantAdmin || this.isSuperAdmin) return true;

            // 2. User thường: Check trong mảng quyền
            if (!this.userPermissions || this.userPermissions.length === 0) return false;

            const requirements = Array.isArray(requiredPerms) ? requiredPerms : [requiredPerms];
            // Trả về true nếu có ít nhất 1 quyền
            return requirements.some(req => this.userPermissions.includes(req));
        },

        // --- LOAD DATA ---
        loadUserData() {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return; // Chưa login

            try {
                const u = JSON.parse(storedUser);

                // === 1. LOGIC CHECK ADMIN MẠNH MẼ ===

                // Check biến boolean hoặc số (SQL Server trả về 1)
                const isTenant = (u.isTenantAdmin === true || u.isTenantAdmin === 'true' || u.isTenantAdmin == 1);
                const isSuper = (u.isSuperAdmin === true || u.isSuperAdmin === 'true' || u.isSuperAdmin == 1);

                // Check tên Role (Nếu tên chứa "Admin", "Quản trị", "CEO"...)
                let roleNameStr = '';
                if (typeof u.role === 'string') roleNameStr = u.role;
                else if (u.role && u.role.name) roleNameStr = u.role.name;

                const isRoleAdmin = roleNameStr.toLowerCase().includes('admin') ||
                    roleNameStr.toLowerCase().includes('quản trị') ||
                    roleNameStr.toLowerCase().includes('system');

                // CHỐT: Là Admin nếu thỏa mãn 1 trong các điều kiện trên
                this.isAdmin = isTenant || isSuper || isRoleAdmin;

                // Debug: F12 để xem dòng này
                console.log(`🔍 DEBUG ADMIN: IsAdmin=${this.isAdmin} | Tenant=${isTenant} | RoleCheck=${isRoleAdmin}`);

                // === 2. MAP DỮ LIỆU HIỂN THỊ ===

                // Nếu là Admin, ép hiển thị Role cho oai, thay vì "Nhân viên"
                let displayRole = roleNameStr || 'Nhân viên';
                if (this.isAdmin) {
                    displayRole = isSuper ? 'Super Admin' : 'Quản trị viên';
                    this.userPermissions = ['ALL']; // Cấp full quyền ảo
                } else {
                    // Lấy quyền user thường
                    let dbPerms = u.permissions || (u.role && u.role.permissions);
                    if (Array.isArray(dbPerms)) {
                        this.userPermissions = dbPerms.map(p => typeof p === 'object' ? p.name : p);
                    } else if (typeof dbPerms === 'string') {
                        this.userPermissions = dbPerms.includes('[') ? JSON.parse(dbPerms) : dbPerms.split(',').map(p => p.trim());
                    }
                }

                this.user = {
                    id: u.id,
                    name: u.fullName || u.name || 'Admin',
                    email: u.email,
                    avatar: this.getHeaderAvatar(u),
                    role: displayRole, // Hiển thị đúng chức danh
                    tenantName: u.tenant ? u.tenant.name : 'Hệ thống'
                };

                if (u.tenant && u.tenant.subscriptionPlan) {
                    this.currentPlan = u.tenant.subscriptionPlan.toLowerCase();
                }

            } catch (e) {
                console.error("Lỗi parse user:", e);
            }
        },

        getHeaderAvatar(user) {
            if (user?.avatar && !user.avatar.includes('ui-avatars')) return user.avatar;
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=2563EB&color=fff`;
        },

        isActive(route) { return window.location.pathname.includes(route); },
        getLimitText(type) {
            let limit = this.plans[this.currentPlan]?.limits[type];
            return limit === 'unlimited' ? '∞' : limit;
        },
        toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; },
        setupClickOutside() { },
        logout() {
            if (confirm('Đăng xuất?')) {
                localStorage.clear();
                window.location.href = '/login.html';
            }
        }
    }
}