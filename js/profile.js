// Add this at the beginning of profile.js
console.log('Profile.js loaded');

let currentTab = 0;
let isEditMode = false;
let currentProfileId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in profile.js');
    
    // Check if user is logged in
    if (!isLoggedIn()) {
        console.log('User not logged in, redirecting...');
        window.location.href = 'index.html';
        return;
    }

    const user = getUser();
    console.log('Current user:', user);
    
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && user) {
        userEmailElement.textContent = user.email;
    }

    // Load user profile
    loadUserProfile();
    
    // Load matches
    loadMatches();

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Create Profile button
    const createProfileBtn = document.getElementById('createProfileBtn');
    if (createProfileBtn) {
        createProfileBtn.addEventListener('click', () => {
            isEditMode = false;
            const formTitle = document.getElementById('formTitle');
            if (formTitle) {
                formTitle.textContent = 'Create Your Profile';
            }
            resetProfileForm();
            openModal('profileFormModal');
        });
    }

    // My Profile Link
    const myProfileLink = document.getElementById('myProfileLink');
    if (myProfileLink) {
        myProfileLink.addEventListener('click', (e) => {
            e.preventDefault();
            viewMyProfile();
        });
    }

    // Form tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentTab = this.dataset.tab === 'bio' ? 0 : 1;
            updateFormTabs();
        });
    });

    // Form navigation
    const prevTabBtn = document.getElementById('prevTab');
    if (prevTabBtn) {
        prevTabBtn.addEventListener('click', () => {
            currentTab = 0;
            updateFormTabs();
        });
    }

    const nextTabBtn = document.getElementById('nextTab');
    if (nextTabBtn) {
        nextTabBtn.addEventListener('click', () => {
            if (validateBioForm()) {
                currentTab = 1;
                updateFormTabs();
            }
        });
    }

    // Submit profile
    const submitProfileBtn = document.getElementById('submitProfile');
    if (submitProfileBtn) {
        submitProfileBtn.addEventListener('click', submitProfile);
    }
}

function updateFormTabs() {
    const bioSection = document.getElementById('bioSection');
    const partnerSection = document.getElementById('partnerSection');
    const tabs = document.querySelectorAll('.tab-btn');

    if (bioSection) bioSection.classList.toggle('active', currentTab === 0);
    if (partnerSection) partnerSection.classList.toggle('active', currentTab === 1);

    tabs.forEach((tab, index) => {
        tab.classList.toggle('active', index === currentTab);
    });

    const prevTab = document.getElementById('prevTab');
    const nextTab = document.getElementById('nextTab');
    const submitProfile = document.getElementById('submitProfile');

    if (prevTab) prevTab.style.display = currentTab === 0 ? 'none' : 'flex';
    if (nextTab) nextTab.style.display = currentTab === 1 ? 'none' : 'flex';
    if (submitProfile) submitProfile.style.display = currentTab === 1 ? 'flex' : 'none';
}

function validateBioForm() {
    const requiredFields = [
        'fullName', 'gender', 'age', 'education', 
        'profession', 'profileEmail', 'phone', 'city'
    ];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.focus();
            showNotification(`Please fill in ${field.labels[0]?.textContent || fieldId}`, 'error');
            return false;
        }
    }
    
    const age = document.getElementById('age');
    if (age && (age.value < 18 || age.value > 100)) {
        age.focus();
        showNotification('Age must be between 18 and 100', 'error');
        return false;
    }
    
    return true;
}

async function submitProfile() {
    try {
        const profileData = {
            bio: {
                fullName: document.getElementById('fullName')?.value || '',
                gender: document.getElementById('gender')?.value || '',
                age: parseInt(document.getElementById('age')?.value) || 18,
                religion: document.getElementById('religion')?.value || '',
                education: document.getElementById('education')?.value || '',
                profession: document.getElementById('profession')?.value || '',
                email: document.getElementById('profileEmail')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                city: document.getElementById('city')?.value || '',
                about: document.getElementById('about')?.value || ''
            },
            partner: {
                ageMin: parseInt(document.getElementById('partnerAgeMin')?.value) || 18,
                ageMax: parseInt(document.getElementById('partnerAgeMax')?.value) || 100,
                gender: document.getElementById('partnerGender')?.value || '',
                religion: document.getElementById('partnerReligion')?.value || '',
                education: document.getElementById('partnerEducation')?.value || '',
                location: document.getElementById('partnerLocation')?.value || '',
                additional: document.getElementById('additionalPreferences')?.value || ''
            }
        };

        console.log('Submitting profile data:', profileData);

        const url = isEditMode ? `${API_URL}/profile/me` : `${API_URL}/profile`;
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Profile saved:', data);

        showNotification(`Profile ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
        closeModal('profileFormModal');
        
        // Reload data
        loadUserProfile();
        loadMatches();

    } catch (error) {
        console.error('Profile submission error:', error);
        showNotification(error.message || 'Failed to save profile', 'error');
    }
}

async function loadUserProfile() {
    try {
        console.log('Loading user profile...');
        const response = await fetch(`${API_URL}/profile/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            console.log('Profile loaded:', profile);
            
            currentProfileId = profile._id;
            
            const createProfileBtn = document.getElementById('createProfileBtn');
            const matchesSection = document.getElementById('matchesSection');
            
            if (createProfileBtn) createProfileBtn.style.display = 'none';
            if (matchesSection) matchesSection.style.display = 'block';
        } else {
            console.log('No profile found, showing create button');
            const createProfileBtn = document.getElementById('createProfileBtn');
            const matchesSection = document.getElementById('matchesSection');
            
            if (createProfileBtn) createProfileBtn.style.display = 'block';
            if (matchesSection) matchesSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile', 'error');
    }
}

async function loadMatches() {
    try {
        console.log('Loading matches...');
        const response = await fetch(`${API_URL}/profile/matches`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            console.log('No matches or error:', response.status);
            return;
        }

        const matches = await response.json();
        console.log('Matches loaded:', matches.length);
        displayMatches(matches);
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

function displayMatches(matches) {
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;
    
    if (!matches || matches.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-heart-broken" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem;">No matches found yet</p>
                <p style="font-size: 0.9rem;">Complete your profile to get better matches</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = matches.map(profile => {
        const initials = profile.bio.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        return `
            <div class="profile-card">
                <div class="profile-card-header">
                    <div class="profile-card-avatar">${initials}</div>
                    <div class="profile-card-info">
                        <h3>${profile.bio.fullName}</h3>
                        <p>${profile.bio.age} years • ${profile.bio.city}</p>
                    </div>
                </div>
                <div class="profile-card-details">
                    <div class="detail-row">
                        <span class="detail-label">Education:</span>
                        <span class="detail-value">${profile.bio.education}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Profession:</span>
                        <span class="detail-value">${profile.bio.profession}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Religion:</span>
                        <span class="detail-value">${profile.bio.religion || 'Not specified'}</span>
                    </div>
                </div>
                <div class="profile-card-actions">
                    <button class="btn-primary btn-small" onclick='viewMatchProfile(${JSON.stringify(profile).replace(/'/g, "\\'")})'>
                        <i class="fas fa-eye"></i> View Profile
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function viewMyProfile() {
    try {
        const response = await fetch(`${API_URL}/profile/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Profile not found');
        }

        const profile = await response.json();
        showProfileDetails(profile, true);
    } catch (error) {
        console.error('Error viewing profile:', error);
        showNotification('Profile not found. Please create your profile first.', 'error');
    }
}

function viewMatchProfile(profile) {
    showProfileDetails(profile, false);
}

function showProfileDetails(profile, canEdit) {
    const content = `
        <div class="profile-details-grid">
            <div class="profile-column">
                <h3 class="section-title"><i class="fas fa-user"></i> Bio Data</h3>
                <div class="profile-info">
                    ${createInfoRow('Full Name', profile.bio.fullName)}
                    ${createInfoRow('Gender', profile.bio.gender)}
                    ${createInfoRow('Age', profile.bio.age)}
                    ${createInfoRow('Religion', profile.bio.religion || 'Not specified')}
                    ${createInfoRow('Education', profile.bio.education)}
                    ${createInfoRow('Profession', profile.bio.profession)}
                    ${createInfoRow('City', profile.bio.city)}
                    ${createInfoRow('Email', profile.bio.email)}
                    ${createInfoRow('Phone', profile.bio.phone)}
                    ${profile.bio.about ? `
                        <div class="info-item-full">
                            <span class="info-label">About:</span>
                            <p class="info-value">${profile.bio.about}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="profile-column">
                <h3 class="section-title"><i class="fas fa-heart"></i> Partner Preferences</h3>
                <div class="profile-info">
                    ${createInfoRow('Age Range', `${profile.partner.ageMin} - ${profile.partner.ageMax}`)}
                    ${createInfoRow('Gender', profile.partner.gender)}
                    ${createInfoRow('Religion', profile.partner.religion || 'Any')}
                    ${createInfoRow('Education', profile.partner.education || 'Any')}
                    ${createInfoRow('Location', profile.partner.location || 'Any')}
                    ${profile.partner.additional ? `
                        <div class="info-item-full">
                            <span class="info-label">Additional:</span>
                            <p class="info-value">${profile.partner.additional}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        ${canEdit ? `
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn-primary" onclick="editMyProfile()">
                    <i class="fas fa-edit"></i> Edit Profile
                </button>
            </div>
        ` : ''}
    `;

    const profileDetailsContent = document.getElementById('profileDetailsContent');
    if (profileDetailsContent) {
        profileDetailsContent.innerHTML = content;
        openModal('viewProfileModal');
    }
}

function createInfoRow(label, value) {
    return `
        <div class="info-item">
            <span class="info-label">${label}:</span>
            <span class="info-value">${value}</span>
        </div>
    `;
}

async function editMyProfile() {
    closeModal('viewProfileModal');
    
    try {
        const response = await fetch(`${API_URL}/profile/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const profile = await response.json();

        // Populate form fields
        const fields = {
            'fullName': profile.bio.fullName,
            'gender': profile.bio.gender,
            'age': profile.bio.age,
            'religion': profile.bio.religion || '',
            'education': profile.bio.education,
            'profession': profile.bio.profession,
            'profileEmail': profile.bio.email,
            'phone': profile.bio.phone,
            'city': profile.bio.city,
            'about': profile.bio.about || '',
            'partnerAgeMin': profile.partner.ageMin,
            'partnerAgeMax': profile.partner.ageMax,
            'partnerGender': profile.partner.gender,
            'partnerReligion': profile.partner.religion || '',
            'partnerEducation': profile.partner.education || '',
            'partnerLocation': profile.partner.location || '',
            'additionalPreferences': profile.partner.additional || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        isEditMode = true;
        const formTitle = document.getElementById('formTitle');
        if (formTitle) formTitle.textContent = 'Edit Your Profile';
        currentTab = 0;
        updateFormTabs();
        openModal('profileFormModal');

    } catch (error) {
        console.error('Error loading profile for editing:', error);
        showNotification('Error loading profile', 'error');
    }
}

function resetProfileForm() {
    const form = document.getElementById('profileForm');
    if (form) form.reset();
    currentTab = 0;
    updateFormTabs();
}