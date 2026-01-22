 const API_BASE_URL = 'http://localhost:5000/api';



// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});
        
        // Global state
        let currentUser = null;
        let authToken = null;
        let isAdmin = false;
        let currentTab = 0;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
            setupEventListeners();
            
            // Check if user is already logged in
            const token = localStorage.getItem('authToken');
            if (token) {
                authToken = token;
                fetchUserProfile();
            }
        });
        
        function initializeApp() {
            updateUI();
        }
        
        function setupEventListeners() {
            // Auth buttons
            document.getElementById('loginBtn').addEventListener('click', openAuthModal);
            document.getElementById('registerBtn').addEventListener('click', openAuthModal);
            document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);
            
            // Auth forms
            document.getElementById('loginForm').addEventListener('submit', login);
            document.getElementById('registerForm').addEventListener('submit', register);
            
            // Auth tabs
            document.querySelectorAll('.auth-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    if (this.dataset.tab === 'login') {
                        document.getElementById('loginForm').style.display = 'block';
                        document.getElementById('registerForm').style.display = 'none';
                    } else {
                        document.getElementById('loginForm').style.display = 'none';
                        document.getElementById('registerForm').style.display = 'block';
                    }
                });
            });
            
            // Matches button
            document.getElementById('findMatchesBtn').addEventListener('click', showMatches);
            document.getElementById('viewMatches').addEventListener('click', function(e) {
                e.preventDefault();
                showMatches();
                document.getElementById('profileDropdown').classList.remove('active');
            });
            
            // Home button
            document.getElementById('homeLink').addEventListener('click', function(e) {
                e.preventDefault();
                showHomePage();
            });
            
            // Filter button
            document.getElementById('applyFilters').addEventListener('click', loadCompatibleProfiles);
            
            // Close auth modal when clicking outside
            document.getElementById('authModal').addEventListener('click', function(e) {
                if (e.target === this) closeAuthModal();
            });
        }
        
        function openAuthModal() {
            document.getElementById('authModal').style.display = 'flex';
        }
        
        function closeAuthModal() {
            document.getElementById('authModal').style.display = 'none';
        }
        
        async function login(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    authToken = data.token;
                    currentUser = data.user;
                    isAdmin = currentUser.isAdmin;
                    
                    // Store token in localStorage
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    closeAuthModal();
                    showNotification('Login successful!', 'success');
                    updateUI();
                    
                    // Fetch complete profile data
                    await fetchUserProfile();
                } else {
                    showNotification(data.error, 'error');
                }
            } catch (error) {
                showNotification('Login failed. Please try again.', 'error');
            }
        }
        
        async function register(e) {
            e.preventDefault();
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // For registration, we'll open the profile form
            closeAuthModal();
            openProfileForm();
        }
        
        async function fetchUserProfile() {
            try {
                const response = await fetch(`${API_BASE_URL}/profile`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (response.ok) {
                    const userProfile = await response.json();
                    currentUser = { ...currentUser, ...userProfile };
                    updateUI();
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        }
        
        function updateUI() {
            const hasProfile = currentUser !== null;
            const isLoggedIn = authToken !== null;
            
            // Show/Hide elements based on authentication
            document.getElementById('openProfileForm').style.display = 
                (isLoggedIn && !currentUser?.profileComplete) ? 'flex' : 'none';
            document.getElementById('findMatchesBtn').style.display = 
                (isLoggedIn && currentUser?.profileComplete) ? 'flex' : 'none';
            document.getElementById('profileIcon').style.display = 
                isLoggedIn ? 'block' : 'none';
            document.getElementById('authButtons').style.display = 
                !isLoggedIn ? 'flex' : 'none';
            
            // Update avatar
            if (currentUser) {
                const initials = currentUser.fullName 
                    ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'U';
                document.getElementById('profileAvatar').textContent = initials;
            }
            
            // Hide/show sections for admin
            if (isAdmin) {
                // Admin-specific UI changes
                document.getElementById('navbar').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                loadAdminProfiles();
            } else {
                document.getElementById('navbar').style.display = 'flex';
                document.getElementById('adminDashboard').style.display = 'none';
            }
        }
        
        async function loadCompatibleProfiles() {
            try {
                document.getElementById('loadingSpinner').style.display = 'block';
                document.getElementById('noMatches').style.display = 'none';
                
                const response = await fetch(`${API_BASE_URL}/profiles/compatible`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (response.ok) {
                    const profiles = await response.json();
                    displayMatches(profiles);
                }
            } catch (error) {
                console.error('Error loading profiles:', error);
                showNotification('Failed to load matches', 'error');
            } finally {
                document.getElementById('loadingSpinner').style.display = 'none';
            }
        }
        
        function displayMatches(profiles) {
            const matchesGrid = document.getElementById('matchesGrid');
            
            if (profiles.length === 0) {
                document.getElementById('noMatches').style.display = 'block';
                matchesGrid.innerHTML = '';
                return;
            }
            
            matchesGrid.innerHTML = profiles.map(profile => {
                const initials = profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const compatibilityScore = calculateCompatibilityScore(profile);
                
                return `
                    <div class="match-card">
                        <div class="match-image">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="match-content">
                            <div class="match-info">
                                <h3 class="match-name">${profile.fullName}</h3>
                                <p class="match-details">
                                    ${profile.age} years • ${profile.city} • ${profile.profession}
                                </p>
                                <p class="match-details">
                                    ${profile.education} • ${profile.religion || 'Not specified'}
                                </p>
                                <div class="compatibility-badge">
                                    <i class="fas fa-heart"></i> ${compatibilityScore}% Compatible
                                </div>
                            </div>
                            <div class="match-actions">
                                <button class="btn-primary btn-small" onclick="viewMatchProfile('${profile._id}')">
                                    <i class="fas fa-eye"></i> View Profile
                                </button>
                                <button class="btn-secondary btn-small" onclick="sendInterest('${profile._id}')">
                                    <i class="fas fa-heart"></i> Show Interest
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        function calculateCompatibilityScore(profile) {
            // Simple compatibility calculation
            let score = 70; // Base score
            
            // Age compatibility
            if (currentUser.partnerAgeMin <= profile.age && currentUser.partnerAgeMax >= profile.age) {
                score += 10;
            }
            
            // Location compatibility
            if (currentUser.partnerLocation && profile.city.toLowerCase().includes(currentUser.partnerLocation.toLowerCase())) {
                score += 10;
            }
            
            // Education compatibility
            if (currentUser.partnerEducation && profile.education.toLowerCase().includes(currentUser.partnerEducation.toLowerCase())) {
                score += 10;
            }
            
            return Math.min(score, 100);
        }
        
        function showMatches() {
            // Hide all other sections
            document.getElementById('heroSection').style.display = 'none';
            document.getElementById('features').style.display = 'none';
            document.getElementById('howItWorks').style.display = 'none';
            document.getElementById('stories').style.display = 'none';
            
            // Show matches section
            document.getElementById('matchesSection').style.display = 'block';
            
            // Load compatible profiles
            loadCompatibleProfiles();
        }
        
        function showHomePage() {
            // Show all sections
            document.getElementById('heroSection').style.display = 'block';
            document.getElementById('features').style.display = 'block';
            document.getElementById('howItWorks').style.display = 'block';
            document.getElementById('stories').style.display = 'block';
            document.getElementById('matchesSection').style.display = 'none';
        }
        
        async function submitProfile(e) {
            e.preventDefault();
            
            const profileData = {
                fullName: document.getElementById('fullName').value,
                gender: document.getElementById('gender').value,
                age: parseInt(document.getElementById('age').value),
                religion: document.getElementById('religion').value,
                education: document.getElementById('education').value,
                profession: document.getElementById('profession').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                city: document.getElementById('city').value,
                about: document.getElementById('about').value,
                partnerAgeMin: parseInt(document.getElementById('partnerAgeMin').value),
                partnerAgeMax: parseInt(document.getElementById('partnerAgeMax').value),
                partnerGender: document.getElementById('partnerGender').value,
                partnerReligion: document.getElementById('partnerReligion').value,
                partnerEducation: document.getElementById('partnerEducation').value,
                partnerLocation: document.getElementById('partnerLocation').value,
                additionalPreferences: document.getElementById('additionalPreferences').value,
                password: document.getElementById('registerPassword')?.value || 'default123' // In real app, handle this properly
            };
            
            try {
                const endpoint = currentUser ? '/profile' : '/register';
                const method = currentUser ? 'PUT' : 'POST';
                
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                    },
                    body: JSON.stringify(profileData)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (!currentUser) {
                        // New registration
                        authToken = data.token;
                        currentUser = data.user;
                        localStorage.setItem('authToken', authToken);
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                    
                    showNotification('Profile saved successfully!', 'success');
                    closeProfileForm();
                    updateUI();
                } else {
                    const error = await response.json();
                    showNotification(error.error, 'error');
                }
            } catch (error) {
                showNotification('Failed to save profile', 'error');
            }
        }
        
        function viewMatchProfile(profileId) {
            // Fetch and display match profile
            fetch(`${API_BASE_URL}/profiles/${profileId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => response.json())
            .then(profile => {
                showProfileDetails(profile);
            })
            .catch(error => {
                showNotification('Failed to load profile', 'error');
            });
        }
        
        function sendInterest(profileId) {
            // Implement interest sending functionality
            showNotification('Interest sent successfully!', 'success');
        }
        
        function logout() {
            authToken = null;
            currentUser = null;
            isAdmin = false;
            
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            showNotification('Logged out successfully', 'success');
            updateUI();
            showHomePage();
        }

        
        
        // Update the existing logout button event listener
        document.getElementById('logoutBtn').addEventListener('click', logout);
    