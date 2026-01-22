// Authentication Module
const API_BASE_URL = "https://matrimony-backend-ds7e.onrender.com";


// Check if backend is running
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

// Initialize localStorage data structure
function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('profiles')) {
        localStorage.setItem('profiles', JSON.stringify([]));
    }
    if (!localStorage.getItem('adminProfiles')) {
        localStorage.setItem('adminProfiles', JSON.stringify([]));
    }
}

// Register user
async function register(email, password, name = '') {
    try {
        // For demo purposes, we'll simulate registration
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user already exists
        if (users.some(user => user.email === email)) {
            throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            email: email,
            password: password, // In real app, hash this password
            name: name || email.split('@')[0],
            isAdmin: email === 'admin@everlastingbonds.com', // Special admin email
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto-login after registration
        localStorage.setItem('currentUser', JSON.stringify({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            isAdmin: newUser.isAdmin
        }));
        
        return newUser;
        
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Login user
async function login(email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Save current user
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
        }));
        
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
        };
        
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin;
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Save profile to admin system
function saveProfileToAdminSystem(profileData) {
    try {
        const adminProfiles = JSON.parse(localStorage.getItem('adminProfiles')) || [];
        const user = getCurrentUser();
        
        const profileToSave = {
            _id: 'profile_' + Date.now(),
            ...profileData,
            user: {
                userId: user?.id || 'user_' + Date.now(),
                email: user?.email || profileData.bio.email,
                name: user?.name || profileData.bio.fullName
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: Math.floor(Math.random() * 100)
        };
        
        // Check if profile already exists for this user
        const existingIndex = adminProfiles.findIndex(p => 
            p.user?.userId === profileToSave.user?.userId
        );
        
        if (existingIndex !== -1) {
            // Update existing profile
            adminProfiles[existingIndex] = {
                ...adminProfiles[existingIndex],
                ...profileToSave,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new profile
            adminProfiles.push(profileToSave);
        }
        
        localStorage.setItem('adminProfiles', JSON.stringify(adminProfiles));
        
        // Also save to user's local storage
        localStorage.setItem('userProfile', JSON.stringify(profileToSave));
        
        console.log('Profile saved to admin system:', profileToSave);
        return { success: true, profile: profileToSave };
        
    } catch (error) {
        console.error('Error saving to admin system:', error);
        return { success: false, error: error.message };
    }
}

// Get user profile
function getUserProfile() {
    const profileStr = localStorage.getItem('userProfile');
    return profileStr ? JSON.parse(profileStr) : null;
}

// Delete profile
function deleteProfile(profileId) {
    try {
        const adminProfiles = JSON.parse(localStorage.getItem('adminProfiles') || '[]');
        const filteredProfiles = adminProfiles.filter(p => p._id !== profileId);
        localStorage.setItem('adminProfiles', JSON.stringify(filteredProfiles));
        
        // Also remove from user's local storage if it's their profile
        const userProfile = getUserProfile();
        if (userProfile && userProfile._id === profileId) {
            localStorage.removeItem('userProfile');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting profile:', error);
        return { success: false, error: error.message };
    }
}

// Get all profiles (for admin)
function getAllProfiles() {
    const adminProfiles = JSON.parse(localStorage.getItem('adminProfiles') || '[]');
    return adminProfiles;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeLocalStorage();
});

// Export functions
window.auth = {
    checkBackendConnection,
    register,
    login,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    logout,
    saveProfileToAdminSystem,
    getUserProfile,
    deleteProfile,
    getAllProfiles
};