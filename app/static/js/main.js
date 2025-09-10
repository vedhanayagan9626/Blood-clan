// BloodClan Main JavaScript
$(document).ready(function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);
});

// Utility Functions
function showSuccessMessage(message) {
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('#flash-messages').html(alertHtml);
    $('html, body').animate({ scrollTop: 0 }, 300);
}

function showErrorMessage(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('#flash-messages').html(alertHtml);
    $('html, body').animate({ scrollTop: 0 }, 300);
}

function showWarningMessage(message) {
    const alertHtml = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $('#flash-messages').html(alertHtml);
    $('html, body').animate({ scrollTop: 0 }, 300);
}

// Blood Group Utilities
function getBloodGroupColor(bloodGroup) {
    const colors = {
        'A+': '#ff6b6b',
        'A-': '#ff8e8e', 
        'B+': '#4ecdc4',
        'B-': '#6dd5db',
        'AB+': '#45b7d1',
        'AB-': '#74c0fc',
        'O+': '#ff9f43',
        'O-': '#feca57'
    };
    return colors[bloodGroup] || '#6c757d';
}

function isCompatibleBloodGroup(donorGroup, recipientGroup) {
    const compatibility = {
        'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        'O+': ['A+', 'B+', 'AB+', 'O+'],
        'A-': ['A+', 'A-', 'AB+', 'AB-'],
        'A+': ['A+', 'AB+'],
        'B-': ['B+', 'B-', 'AB+', 'AB-'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB+', 'AB-'],
        'AB+': ['AB+']
    };
    
    return compatibility[donorGroup] && compatibility[donorGroup].includes(recipientGroup);
}

// Location Utilities
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        } else {
            reject(new Error('Geolocation is not supported'));
        }
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Format Utilities
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateString);
    }
}

// Validation Utilities
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Loading States
function setButtonLoading(button, loadingText = 'Loading...') {
    const $btn = $(button);
    $btn.data('original-html', $btn.html());
    $btn.html(`<i class="fas fa-spinner fa-spin me-2"></i>${loadingText}`);
    $btn.prop('disabled', true);
}

function resetButton(button) {
    const $btn = $(button);
    $btn.html($btn.data('original-html'));
    $btn.prop('disabled', false);
}

// File Upload Utilities
function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    const maxSize = 16 * 1024 * 1024; // 16MB
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, BMP)');
    }
    
    if (file.size > maxSize) {
        throw new Error('File size must be less than 16MB');
    }
    
    return true;
}

function previewImage(input, previewElement) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        try {
            validateImageFile(file);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                $(previewElement).attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
            return true;
        } catch (error) {
            showErrorMessage(error.message);
            return false;
        }
    }
    return false;
}

// API Utilities
function makeApiCall(url, method = 'GET', data = null, contentType = 'application/json') {
    const ajaxConfig = {
        url: url,
        method: method,
        success: function(response) {
            return response;
        },
        error: function(xhr, status, error) {
            console.error('API Error:', error);
            let errorMessage = 'An error occurred. Please try again.';
            
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            }
            
            showErrorMessage(errorMessage);
            throw new Error(errorMessage);
        }
    };
    
    if (data) {
        if (contentType === 'application/json') {
            ajaxConfig.data = JSON.stringify(data);
            ajaxConfig.contentType = contentType;
        } else {
            ajaxConfig.data = data;
            ajaxConfig.processData = false;
            ajaxConfig.contentType = false;
        }
    }
    
    return $.ajax(ajaxConfig);
}

// Notification Utilities (for future web push notifications)
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                showSuccessMessage('Notifications enabled! You\'ll receive alerts for nearby blood requests.');
            }
        });
    }
}

// Local Storage Utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('Could not read from localStorage:', error);
        return null;
    }
}

// Initialize app-wide features
$(document).ready(function() {
    // Add smooth scrolling to all anchor links
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 100
            }, 600);
        }
    });
    
    // Add loading states to form submissions
    $('form').on('submit', function() {
        const submitBtn = $(this).find('button[type="submit"]');
        if (submitBtn.length) {
            setButtonLoading(submitBtn, 'Processing...');
        }
    });
});