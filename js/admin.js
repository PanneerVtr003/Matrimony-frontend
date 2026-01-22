// Admin Dashboard Functionality

// Check if admin is logged in
function checkAdminAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (!isLoggedIn || !loginTime) {
        window.location.href = 'admin.html';
        return false;
    }
    
    // Check if session is expired (24 hours)
    const currentTime = new Date().getTime();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (currentTime - loginTime > sessionDuration) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = 'admin.html';
        return false;
    }
    
    return true;
}

// Logout function
function adminLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'admin.html';
}

// Load all user profiles
async function loadAllProfiles() {
    try {
        // Get users and profiles from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
        
        // Update stats
        updateStats(profiles, users);
        
        // Display profiles
        displayProfiles(profiles);
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}

// Update statistics
function updateStats(profiles, users) {
    const totalProfiles = profiles.length;
    const maleProfiles = profiles.filter(p => p.gender === 'Male').length;
    const femaleProfiles = profiles.filter(p => p.gender === 'Female').length;
    const totalUsers = users.length;
    
    document.getElementById('totalProfilesStat').textContent = totalProfiles;
    document.getElementById('maleProfilesStat').textContent = maleProfiles;
    document.getElementById('femaleProfilesStat').textContent = femaleProfiles;
    document.getElementById('totalUsersStat').textContent = totalUsers;
}

// Display profiles in grid
function displayProfiles(profiles) {
    const profilesGrid = document.getElementById('adminProfilesGrid');
    
    if (profiles.length === 0) {
        profilesGrid.innerHTML = `
            <div class="no-profiles">
                <i class="fas fa-user-slash"></i>
                <h3>No profiles found</h3>
                <p>No user profiles have been created yet.</p>
            </div>
        `;
        return;
    }
    
    profilesGrid.innerHTML = profiles.map((profile, index) => `
        <div class="profile-card" onclick="viewProfile(${index})">
            <div class="profile-img" style="background: ${profile.gender === 'Male' ? '#2196F3' : '#ff4081'}">
                ${profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="profile-info">
                <h4>${profile.name || 'No Name'}</h4>
                <p><i class="fas ${profile.gender === 'Male' ? 'fa-mars' : 'fa-venus'}"></i> ${profile.gender || 'Not specified'}</p>
                <p><i class="fas fa-birthday-cake"></i> ${profile.age || 'Not specified'} years</p>
                <p><i class="fas fa-map-marker-alt"></i> ${profile.location || 'Not specified'}</p>
                <div class="profile-status ${profile.status || 'single'}">
                    <i class="fas fa-heart"></i> ${profile.relationshipStatus || 'Single'}
                </div>
            </div>
        </div>
    `).join('');
}

// View profile details
function viewProfile(index) {
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    const profile = profiles[index];
    
    if (!profile) return;
    
    const content = `
        <div class="profile-details">
            <div class="detail-header">
                <div class="detail-avatar" style="background: ${profile.gender === 'Male' ? '#2196F3' : '#ff4081'}">
                    ${profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <h3>${profile.name || 'No Name'}</h3>
                    <p class="detail-gender">
                        <i class="fas ${profile.gender === 'Male' ? 'fa-mars' : 'fa-venus'}"></i>
                        ${profile.gender || 'Not specified'}
                    </p>
                </div>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <label><i class="fas fa-birthday-cake"></i> Age</label>
                    <p>${profile.age || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-map-marker-alt"></i> Location</label>
                    <p>${profile.location || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-heart"></i> Relationship Status</label>
                    <p>${profile.relationshipStatus || 'Single'}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-user-graduate"></i> Education</label>
                    <p>${profile.education || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-briefcase"></i> Occupation</label>
                    <p>${profile.occupation || 'Not specified'}</p>
                </div>
                <div class="detail-item">
                    <label><i class="fas fa-heartbeat"></i> Interests</label>
                    <p>${profile.interests ? profile.interests.join(', ') : 'Not specified'}</p>
                </div>
            </div>
            
            ${profile.about ? `
                <div class="detail-item full-width">
                    <label><i class="fas fa-info-circle"></i> About</label>
                    <p>${profile.about}</p>
                </div>
            ` : ''}
            
            <div class="detail-item full-width">
                <label><i class="fas fa-calendar-alt"></i> Profile Created</label>
                <p>${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Not available'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('adminProfileDetailsContent').innerHTML = content;
    document.getElementById('adminViewProfileModal').style.display = 'block';
    
    // Set up delete button with current profile index
    const deleteBtn = document.getElementById('deleteProfileBtn');
    deleteBtn.onclick = () => deleteProfile(index);
}

// Delete profile
function deleteProfile(index) {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
        return;
    }
    
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    
    if (index >= 0 && index < profiles.length) {
        // Remove profile from array
        profiles.splice(index, 1);
        
        // Save updated profiles
        localStorage.setItem('profiles', JSON.stringify(profiles));
        
        // Close modal
        closeModal('adminViewProfileModal');
        
        // Reload profiles
        loadAllProfiles();
        
        // Show success message
        alert('Profile deleted successfully!');
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAdminAuth()) return;
    
    // Load profiles
    loadAllProfiles();
    
    // Set up logout button
    document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('adminViewProfileModal');
        if (event.target === modal) {
            closeModal('adminViewProfileModal');
        }
    });
});