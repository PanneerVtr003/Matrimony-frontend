// Authentication System
const auth = (function() {
    // Admin credentials (for demo - in production use proper authentication)
    const ADMIN_EMAIL = 'admin@everlastingbonds.com';
    const ADMIN_PASSWORD = 'Admin@123';
    const ADMIN_ID = 'admin_001';
    
    // Current user state
    let currentUser = null;
    let userProfile = null;
    
    // Initialize
    function init() {
        // Load saved data
        loadUsers();
        loadProfiles();
        
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            // Load current user's profile
            userProfile = getUserProfile();
        }
    }
    
    // Load users from localStorage
    function loadUsers() {
        if (!localStorage.getItem('users')) {
            // Create default users
            const users = [
                {
                    id: 'user_001',
                    email: 'demo1@example.com',
                    password: 'Demo@123',
                    name: 'Demo User 1',
                    createdAt: new Date().toISOString(),
                    isAdmin: false
                },
                {
                    id: 'user_002',
                    email: 'demo2@example.com',
                    password: 'Demo@123',
                    name: 'Demo User 2',
                    createdAt: new Date().toISOString(),
                    isAdmin: false
                }
            ];
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Load profiles from localStorage
    function loadProfiles() {
        if (!localStorage.getItem('allProfiles')) {
            localStorage.setItem('allProfiles', JSON.stringify([]));
        }
    }
    
    // Get all users
    function getAllUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }
    
    // Get all profiles - FIXED: Return ALL profiles from ALL users
    function getAllProfiles() {
        const profiles = JSON.parse(localStorage.getItem('allProfiles') || '[]');
        console.log('All profiles retrieved:', profiles.length);
        console.log('Profile details:', profiles.map(p => ({
            id: p._id,
            email: p.user?.email,
            name: p.bio?.fullName
        })));
        return profiles;
    }
    
    // Get profiles by user ID
    function getProfilesByUserId(userId) {
        const profiles = getAllProfiles();
        return profiles.filter(profile => profile.user?.userId === userId);
    }
    
    // Register new user
    function register(email, password, name) {
        const users = getAllUsers();
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return {
                success: false,
                error: 'User with this email already exists'
            };
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            email: email,
            password: password, // In production, this should be hashed
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString(),
            isAdmin: false
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        return {
            success: true,
            user: newUser
        };
    }
    
    // Login user
    function login(email, password) {
        console.log('Login attempt for:', email);
        
        // Check if admin login
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminUser = {
                id: ADMIN_ID,
                email: ADMIN_EMAIL,
                name: 'Administrator',
                isAdmin: true,
                createdAt: new Date().toISOString()
            };
            
            currentUser = adminUser;
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            localStorage.setItem('adminToken', 'admin_token_' + Date.now());
            
            return {
                success: true,
                user: adminUser,
                isAdmin: true
            };
        }
        
        // Regular user login
        const users = getAllUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Load user profile if exists
            userProfile = getUserProfile();
            
            console.log('User logged in:', user.email);
            console.log('User profile loaded:', userProfile ? 'Yes' : 'No');
            
            return {
                success: true,
                user: user,
                isAdmin: false
            };
        }
        
        return {
            success: false,
            error: 'Invalid email or password'
        };
    }
    
    // Logout
    function logout() {
        currentUser = null;
        userProfile = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminToken');
        window.location.href = 'index.html';
    }
    
    // Check if user is logged in
    function isLoggedIn() {
        return currentUser !== null;
    }
    
    // Check if user is admin
    function isAdmin() {
        return currentUser?.isAdmin === true;
    }
    
    // Get current user
    function getCurrentUser() {
        return currentUser;
    }
    
    // Get user profile - FIXED: Return current user's profile
    function getUserProfile() {
        if (!currentUser) return null;
        
        // First check localStorage for userProfile
        let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
        
        if (!profile) {
            // Check allProfiles
            const profiles = getAllProfiles();
            console.log('Looking for profile for user:', currentUser.id);
            console.log('Available profiles:', profiles.length);
            
            profile = profiles.find(p => p.user?.userId === currentUser.id);
            console.log('Found profile:', profile ? 'Yes' : 'No');
            
            // Save to userProfile for future use
            if (profile) {
                localStorage.setItem('userProfile', JSON.stringify(profile));
            }
        }
        
        userProfile = profile;
        return userProfile;
    }
    
    // Save user profile - FIXED VERSION
    function saveUserProfile(profileData) {
        try {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'User not logged in' };
            }
            
            console.log('Saving profile for user:', user.email);
            
            // Ensure profile has user data
            profileData.user = profileData.user || {
                userId: user.id,
                email: user.email,
                name: user.name || user.email.split('@')[0]
            };
            
            // Set default values if not present
            if (!profileData._id) {
                profileData._id = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            if (!profileData.status) {
                profileData.status = 'active';
            }
            
            if (!profileData.createdAt) {
                profileData.createdAt = new Date().toISOString();
            }
            
            profileData.updatedAt = new Date().toISOString();
            
            // Calculate profile completeness
            if (!profileData.profileCompleteness) {
                profileData.profileCompleteness = calculateProfileCompleteness(profileData);
            }
            
            // 1. Save to userProfile (for easy access)
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            
            // 2. Save to allProfiles (for matching)
            const allProfiles = getAllProfiles();
            const existingIndex = allProfiles.findIndex(p => 
                p.user && p.user.userId === user.id
            );
            
            if (existingIndex >= 0) {
                allProfiles[existingIndex] = profileData;
            } else {
                allProfiles.push(profileData);
            }
            
            localStorage.setItem('allProfiles', JSON.stringify(allProfiles));
            
            // 3. Also update adminProfiles for admin panel
            const adminProfiles = JSON.parse(localStorage.getItem('adminProfiles') || '[]');
            const adminProfilesFiltered = adminProfiles.filter(p => 
                !p.user || p.user.userId !== user.id
            );
            adminProfilesFiltered.push(profileData);
            localStorage.setItem('adminProfiles', JSON.stringify(adminProfilesFiltered));
            
            // Update cache
            userProfile = profileData;
            
            console.log('Profile saved successfully for user:', user.email);
            console.log('Total profiles now:', allProfiles.length);
            
            return {
                success: true,
                profile: profileData,
                message: 'Profile saved successfully'
            };
            
        } catch (error) {
            console.error('Error saving profile:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Helper function to calculate profile completeness
    function calculateProfileCompleteness(profile) {
        const requiredFields = [
            'fullName', 'gender', 'age', 'education', 'profession', 'email', 'phone', 'city'
        ];
        
        let completedFields = 0;
        requiredFields.forEach(field => {
            if (profile.bio && profile.bio[field] && profile.bio[field].toString().trim()) {
                completedFields++;
            }
        });
        
        const totalRequired = requiredFields.length;
        const completeness = Math.round((completedFields / totalRequired) * 100);
        
        return Math.min(completeness, 100);
    }
    
    // Save profile to admin system (alias for compatibility)
    function saveProfileToAdminSystem(profileData) {
        return saveUserProfile(profileData);
    }
    
    // Get profile by ID
    function getProfileById(profileId) {
        const profiles = getAllProfiles();
        return profiles.find(p => p._id === profileId);
    }
    
    // Admin functions
    function adminGetAllProfiles() {
        const profiles = getAllProfiles();
        console.log('Admin fetching all profiles:', profiles.length);
        return profiles;
    }
    
    function adminGetProfileById(profileId) {
        return getProfileById(profileId);
    }
    
    function adminDeleteProfile(profileId) {
        const profiles = getAllProfiles();
        const profileIndex = profiles.findIndex(p => p._id === profileId);
        
        if (profileIndex === -1) {
            return {
                success: false,
                error: 'Profile not found'
            };
        }
        
        const deletedProfile = profiles[profileIndex];
        profiles.splice(profileIndex, 1);
        localStorage.setItem('allProfiles', JSON.stringify(profiles));
        
        // If deleted profile belongs to current user, clear cache
        if (userProfile && userProfile._id === profileId) {
            userProfile = null;
            localStorage.removeItem('userProfile');
        }
        
        console.log('Profile deleted:', profileId);
        console.log('Remaining profiles:', profiles.length);
        
        return {
            success: true,
            message: 'Profile deleted successfully',
            deletedProfile: deletedProfile
        };
    }
    
    function adminUpdateProfileStatus(profileId, status) {
        const profiles = getAllProfiles();
        const profileIndex = profiles.findIndex(p => p._id === profileId);
        
        if (profileIndex === -1) {
            return {
                success: false,
                error: 'Profile not found'
            };
        }
        
        const profile = profiles[profileIndex];
        profile.status = status;
        profile.updatedAt = new Date().toISOString();
        
        localStorage.setItem('allProfiles', JSON.stringify(profiles));
        
        // Update cache if it's current user's profile
        if (userProfile && userProfile._id === profileId) {
            userProfile.status = status;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
        
        return {
            success: true,
            profile: profile
        };
    }
    
    // Get all users with their profiles
    function adminGetAllUsersWithProfiles() {
        const users = getAllUsers();
        const profiles = getAllProfiles();
        
        return users.map(user => {
            const userProfiles = profiles.filter(p => p.user?.userId === user.id);
            return {
                ...user,
                profiles: userProfiles,
                profileCount: userProfiles.length
            };
        });
    }
    
    // Initialize on load
    init();
    
    // Public API
    return {
        // Auth functions
        register,
        login,
        logout,
        isLoggedIn,
        isAdmin,
        getCurrentUser,
        
        // Profile functions
        getUserProfile,
        saveUserProfile, // Use this instead of saveProfileToAdminSystem
        saveProfileToAdminSystem, // Keep for backward compatibility
        getAllProfiles,
        getProfilesByUserId,
        getProfileById,
        
        // Admin functions
        adminGetAllProfiles,
        adminGetProfileById,
        adminDeleteProfile,
        adminUpdateProfileStatus,
        adminGetAllUsersWithProfiles
    };
})();
