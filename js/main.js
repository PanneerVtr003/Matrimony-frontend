// Main JavaScript for Landing Page
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Main.js loaded");
    
    // Initialize storage
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('profiles')) {
        localStorage.setItem('profiles', JSON.stringify([]));
    }
    
    // Auto redirect if already logged in
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        if (user?.isAdmin) {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "user-dashboard.html";
        }
        return;
    }
    
    // Load stats
    loadStats();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            openModal("loginModal");
        });
    }
    
    // Register button
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            openModal("registerModal");
        });
    }
    
    // Get Started button
    const getStartedBtn = document.getElementById("getStartedBtn");
    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", () => {
            openModal("registerModal");
        });
    }
    
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
    
    // Close buttons for modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

// Open modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Clear form on open
        if (modalId === 'loginModal') {
            document.getElementById('loginForm')?.reset();
        } else if (modalId === 'registerModal') {
            document.getElementById('registerForm')?.reset();
        }
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification("Please enter both email and password", "error");
        return;
    }
    
    try {
        showLoading();
        const user = await auth.login(email, password);
        showNotification("Login successful!", "success");
        
        setTimeout(() => {
            closeModal('loginModal');
            if (user.isAdmin) {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "user-dashboard.html";
            }
        }, 800);
        
    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        hideLoading();
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        showNotification("Please fill in all fields", "error");
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
    }
    
    if (password.length < 6) {
        showNotification("Password must be at least 6 characters", "error");
        return;
    }
    
    try {
        showLoading();
        await auth.register(email, password);
        showNotification("Registration successful!", "success");
        
        setTimeout(() => {
            closeModal('registerModal');
            window.location.href = "user-dashboard.html";
        }, 800);
        
    } catch (err) {
        showNotification(err.message, "error");
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStats() {
    try {
        const profiles = auth.getAllProfiles();
        const statsElement = document.getElementById('totalProfilesCount');
        if (statsElement) {
            statsElement.textContent = profiles.length;
        }
    } catch (error) {
        console.warn('Could not load stats:', error);
    }
}

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Show loading
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(overlay);
    }
    document.getElementById('loadingOverlay').classList.add('active');
}

// Hide loading
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}




// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(this.id);
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', function() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            openModal('loginModal');
        });
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            openModal('registerModal');
        });
    }

    // Get Started button
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function() {
            openModal('registerModal');
        });
    }

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) closeModal(modal.id);
        });
    });

    // Form submissions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Call your auth.js login function
            const result = auth.login(email, password);
            
            if (result.success) {
                closeModal('loginModal');
                window.location.href = 'user-dashboard.html';
            } 
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Call your auth.js register function
            const result = auth.register(email, password);
            
            if (result.success) {
                closeModal('registerModal');
                openModal('loginModal');
                alert('Registration successful! Please login.');
            } 
        });
    }

    // Load total profiles count
    updateTotalProfilesCount();
});

// Update total profiles count from localStorage
function updateTotalProfilesCount() {
    const countElement = document.getElementById('totalProfilesCount');
    if (!countElement) return;
    
    try {
        const profiles = JSON.parse(localStorage.getItem('allProfiles') || '[]');
        const activeProfiles = profiles.filter(profile => profile.status === 'active');
        countElement.textContent = activeProfiles.length;
    } catch (error) {
        console.error('Error loading profiles count:', error);
        countElement.textContent = '0';
    }
}


// Initialize demo profiles on first visit
function initializeDemoProfiles() {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
        const demoProfiles = [
            {
                _id: 'demo_1',
                bio: {
                    fullName: 'Alexander Johnson',
                    gender: 'Male',
                    age: 32,
                    religion: 'Christian',
                    education: 'MBA',
                    profession: 'Investment Banker',
                    email: 'alex.j@example.com',
                    phone: '+1 (555) 123-4567',
                    about: 'Ambitious professional seeking a meaningful connection.',
                    hobbies: 'Investing, Golf, Wine Tasting',
                    city: 'New York'
                },
                partner: {
                    ageMin: 28,
                    ageMax: 35,
                    gender: 'Female',
                    religion: ['Christian', 'Any'],
                    education: 'Bachelor\'s or higher',
                    profession: 'Professional',
                    location: 'Northeast USA',
                    income: '100000',
                    values: ['ambition', 'family', 'faith'],
                    additional: 'Looking for someone with strong family values'
                },
                status: 'active',
                views: 145,
                createdAt: '2024-01-10T09:30:00Z',
                updatedAt: '2024-01-15T14:20:00Z',
                user: { userId: 'demo_user_1' }
            },
            // Add other demo profiles here...
        ];
        
        localStorage.setItem('allProfiles', JSON.stringify(demoProfiles));
        localStorage.setItem('hasVisited', 'true');
        console.log('Demo profiles initialized for first-time visitors');
    }
}

// Call this function on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoProfiles();
    updateTotalProfilesCount();
});



// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});
