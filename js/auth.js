// Authentication System
const auth = (function() {
    // Admin credentials
    const ADMIN_EMAIL = 'admin@everlastingbonds.com';
    const ADMIN_PASSWORD = 'Admin@123';
    const ADMIN_ID = 'admin_001';
    
    // Current user state
    let currentUser = null;
    let userProfile = null;
    
    // Initialize
    function init() {
        loadUsers();
        loadProfiles();
        
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            userProfile = getUserProfile();
        }
    }
    
    // Simple hash function for demo
    function simpleHash(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    }
    
    // Load users from localStorage
    function loadUsers() {
        if (!localStorage.getItem('users')) {
            const users = [
                {
                    id: 'user_001',
                    email: 'demo1@example.com',
                    name: 'Rajesh Kumar',
                    createdAt: new Date().toISOString(),
                    isAdmin: false
                },
                {
                    id: 'user_002',
                    email: 'demo2@example.com',
                    name: 'Priya Sharma',
                    createdAt: new Date().toISOString(),
                    isAdmin: false
                }
            ];
            localStorage.setItem('users', JSON.stringify(users));
            
            // Create default profiles for demo users
            users.forEach(user => {
                if (!user.isAdmin) {
                    createDefaultProfileForUser(user);
                }
            });
        }
    }
    
    // Load profiles from localStorage - UPDATED: Centralized storage
    function loadProfiles() {
        if (!localStorage.getItem('allProfiles')) {
            localStorage.setItem('allProfiles', JSON.stringify([]));
        }
    }
    
    // Create default profile for new user - UPDATED: Now saves to centralized storage
    function createDefaultProfileForUser(user) {
        try {
            const profileId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const defaultProfile = {
                _id: profileId,
                bio: {
                    fullName: user.name || 'New User',
                    gender: '',
                    age: 25,
                    religion: '',
                    education: '',
                    profession: '',
                    email: user.email,
                    phone: '',
                    city: '',
                    about: 'I\'m new here. Please update your profile information!',
                    hobbies: ''
                },
                partner: {
                    ageMin: 22,
                    ageMax: 30,
                    gender: 'Any',
                    religion: ['Any'],
                    education: 'Any',
                    profession: '',
                    income: '',
                    location: '',
                    values: [],
                    additional: ''
                },
                status: 'active',
                views: 0,
                profileCompleteness: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                user: {
                    userId: user.id,
                    email: user.email,
                    name: user.name
                }
            };
            
            // Save to centralized ALL PROFILES storage
            let allProfiles = JSON.parse(localStorage.getItem('allProfiles') || '[]');
            allProfiles.push(defaultProfile);
            localStorage.setItem('allProfiles', JSON.stringify(allProfiles));
            
            console.log('Default profile created and saved to allProfiles:', user.email);
            
            return defaultProfile;
            
        } catch (error) {
            console.error('Error creating default profile:', error);
            return null;
        }
    }
    
    // Get all users
    function getAllUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }
    
    // Get ALL profiles - UPDATED: Returns ALL profiles for ALL users
    function getAllProfiles() {
        let allProfiles = JSON.parse(localStorage.getItem('allProfiles') || '[]');
        
        // If no profiles in centralized storage, check individual user profiles
        if (allProfiles.length === 0) {
            console.log('No profiles in allProfiles, checking individual user profiles...');
            
            // Get all users
            const users = getAllUsers();
            
            users.forEach(user => {
                // Check for user-specific profile storage
                const userProfileKey = `userProfile_${user.id}`;
                const userProfile = JSON.parse(localStorage.getItem(userProfileKey) || 'null');
                
                if (userProfile) {
                    allProfiles.push(userProfile);
                }
            });
        }
        
        console.log('Total profiles available for matching:', allProfiles.length);
        return allProfiles;
    }
    
    // Get profiles by user ID
    function getProfilesByUserId(userId) {
        const profiles = getAllProfiles();
        return profiles.filter(profile => profile.user?.userId === userId);
    }
    
    // Register new user
    function register(email, password, name) {
        const users = getAllUsers();
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: 'Please enter a valid email address'
            };
        }
        
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
            password: simpleHash(password),
            name: name || email.split('@')[0],
            createdAt: new Date().toISOString(),
            isAdmin: false
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // AUTOMATICALLY CREATE DEFAULT PROFILE
        const defaultProfile = createDefaultProfileForUser(newUser);
        
        // Set as current user
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        // Set user's profile
        if (defaultProfile) {
            userProfile = defaultProfile;
            localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
        }
        
        return {
            success: true,
            user: newUser,
            hasProfile: !!defaultProfile,
            profile: defaultProfile
        };
    }
    
    // Login user
    function login(email, password) {
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
        const passwordHash = simpleHash(password);
        const user = users.find(u => u.email === email && u.password === passwordHash);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Load user profile if exists
            let profile = getUserProfile();
            
            // If no profile exists, create a default one
            if (!profile) {
                profile = createDefaultProfileForUser(user);
                if (profile) {
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                }
            }
            
            userProfile = profile;
            
            return {
                success: true,
                user: user,
                isAdmin: false,
                hasProfile: !!profile
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
    
    // Get user profile
    function getUserProfile() {
        if (!currentUser) return null;
        
        // First check localStorage for userProfile
        let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
        
        if (!profile) {
            // Check allProfiles
            const profiles = getAllProfiles();
            profile = profiles.find(p => p.user?.userId === currentUser.id);
            
            // Save to userProfile for future use
            if (profile) {
                localStorage.setItem('userProfile', JSON.stringify(profile));
            }
        }
        
        userProfile = profile;
        return userProfile;
    }
    
    // Save user profile - UPDATED: Saves to centralized storage
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
            
            // 2. Save to allProfiles (CENTRALIZED STORAGE for ALL users)
            const allProfiles = getAllProfiles();
            
            // Check if profile already exists
            const existingIndex = allProfiles.findIndex(p => 
                p.user && p.user.userId === user.id
            );
            
            if (existingIndex >= 0) {
                // Update existing profile
                allProfiles[existingIndex] = profileData;
                console.log('Updated existing profile in allProfiles');
            } else {
                // Add new profile
                allProfiles.push(profileData);
                console.log('Added new profile to allProfiles');
            }
            
            localStorage.setItem('allProfiles', JSON.stringify(allProfiles));
            
            // Update cache
            userProfile = profileData;
            
            console.log('Profile saved successfully for user:', user.email);
            console.log('Total profiles in allProfiles:', allProfiles.length);
            
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
    
    // Get profile by ID
    function getProfileById(profileId) {
        const profiles = getAllProfiles();
        return profiles.find(p => p._id === profileId);
    }
    
    // Get other users' profiles (for matching) - NEW FUNCTION
    function getOtherUserProfiles() {
        if (!currentUser) return [];
        
        const profiles = getAllProfiles();
        
        // Filter out current user's own profile
        return profiles.filter(profile => 
            profile.user && profile.user.userId !== currentUser.id
        );
    }
    
    // Get profiles for matching (excludes current user)
    function getProfilesForMatching() {
        return getOtherUserProfiles();
    }
    
    // Check if user should complete profile
    function shouldCompleteProfile() {
        if (!currentUser || currentUser.isAdmin) return false;
        
        const profile = getUserProfile();
        if (!profile) return true;
        
        // Check if profile completeness is low
        if (profile.profileCompleteness < 70) {
            return true;
        }
        
        return false;
    }
    
    // Mark profile completion reminder as done
    function markProfileReminderDone() {
        // No specific reminder tracking needed
    }
    
    // Admin functions
    function adminGetAllProfiles() {
        return getAllProfiles();
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
        saveUserProfile,
        getAllProfiles,           // Returns ALL profiles for ALL users
        getProfilesByUserId,
        getProfileById,
        getOtherUserProfiles,     // Returns other users' profiles (for matching)
        getProfilesForMatching,   // Alias for getOtherUserProfiles
        
        // Profile completion helpers
        shouldCompleteProfile,
        markProfileReminderDone,
        
        // Admin functions
        adminGetAllProfiles,
        adminGetProfileById,
        adminDeleteProfile,
        adminUpdateProfileStatus,
        adminGetAllUsersWithProfiles
    };
})();
