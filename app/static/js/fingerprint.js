// BloodClan - Complete Fingerprint Analysis JavaScript
// Handles fingerprint image upload, preprocessing, and AI prediction

$(document).ready(function() {
    // Initialize all fingerprint upload components
    initFingerprintUpload();
    
    // Initialize drag and drop for all upload areas
    initDragAndDrop();
    
    // Initialize image quality checker
    initQualityChecker();
});

// Global variables
let currentPrediction = null;
let uploadAreas = {};

/**
 * Initialize fingerprint upload functionality
 */
function initFingerprintUpload() {
    // Handle file input changes for all fingerprint inputs
    $('input[type="file"][accept*="image"]').on('change', function(e) {
        const uploadAreaId = $(this).closest('[id*="upload"], .upload-area').attr('id');
        handleFingerprintUpload(this, uploadAreaId);
    });
    
    // Handle select file button clicks
    $('[id*="select"][id*="file"], .select-file-btn').on('click', function() {
        const fileInput = $(this).siblings('input[type="file"]').first();
        if (fileInput.length === 0) {
            const uploadArea = $(this).closest('[id*="upload"], .upload-area');
            const input = uploadArea.find('input[type="file"]').first();
            if (input.length > 0) {
                input.click();
            }
        } else {
            fileInput.click();
        }
    });
    
    // Handle clear button clicks
    $('[id*="clear"], .clear-btn').on('click', function() {
        const uploadArea = $(this).closest('[id*="upload"], .upload-area');
        const uploadAreaId = uploadArea.attr('id');
        clearFingerprintUpload(uploadAreaId);
    });
    
    // Handle predict button clicks
    $('[id*="predict"], .predict-btn').on('click', function() {
        const uploadArea = $(this).closest('[id*="upload"], .upload-area').parent();
        const fileInput = uploadArea.find('input[type="file"]').first();
        const resultContainer = uploadArea.find('[id*="result"], .result-container').first();
        
        if (fileInput.length && resultContainer.length) {
            predictBloodGroup(fileInput[0], resultContainer.attr('id') || 'predictionResult');
        }
    });
}

/**
 * Initialize drag and drop functionality
 */
function initDragAndDrop() {
    const uploadAreas = $('.upload-area, [id*="upload-area"]');
    
    uploadAreas.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragover');
        $(this).find('.upload-text').text('Drop fingerprint image here');
    });
    
    uploadAreas.on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragover');
        $(this).find('.upload-text').text('Drag & drop or click to select');
    });
    
    uploadAreas.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragover');
        
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = $(this).find('input[type="file"]')[0];
            if (fileInput) {
                // Create a new FileList-like object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[0]);
                fileInput.files = dataTransfer.files;
                
                const uploadAreaId = $(this).attr('id');
                handleFingerprintUpload(fileInput, uploadAreaId);
            }
        }
    });
    
    // Prevent default drag behaviors on document
    $(document).on('dragover drop', function(e) {
        e.preventDefault();
    });
}

/**
 * Initialize image quality checker
 */
function initQualityChecker() {
    // This will be called after image upload to check quality
    window.checkImageQuality = checkImageQuality;
}

/**
 * Handle fingerprint image upload
 * @param {HTMLInputElement} input - File input element
 * @param {string} uploadAreaId - ID of upload area container
 */
function handleFingerprintUpload(input, uploadAreaId) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        // Validate file
        validateImageFile(file);
        
        // Store upload area reference
        uploadAreas[uploadAreaId] = {
            input: input,
            file: file,
            uploadTime: new Date()
        };
        
        // Show loading state
        const uploadArea = $(`#${uploadAreaId}`);
        showUploadLoading(uploadArea);
        
        // Read and preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewFingerprintImage(e.target.result, uploadAreaId);
            
            // Check image quality
            checkImageQuality(file).then(quality => {
                displayQualityFeedback(quality, uploadAreaId);
            }).catch(error => {
                console.warn('Quality check failed:', error);
            });
        };
        
        reader.onerror = function() {
            showUploadError('Failed to read image file', uploadAreaId);
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        showUploadError(error.message, uploadAreaId);
        input.value = '';
    }
}

/**
 * Preview fingerprint image in upload area
 * @param {string} imageSrc - Image source data URL
 * @param {string} uploadAreaId - Upload area ID
 */
function previewFingerprintImage(imageSrc, uploadAreaId) {
    const uploadArea = $(`#${uploadAreaId}`);
    
    // Hide placeholder, show preview
    uploadArea.find('[id*="placeholder"], .upload-placeholder').addClass('d-none');
    uploadArea.find('[id*="preview"], .image-preview').removeClass('d-none');
    
    // Set image source
    const previewImg = uploadArea.find('img').first();
    if (previewImg.length) {
        previewImg.attr('src', imageSrc);
        previewImg.removeClass('d-none');
    } else {
        // Create image element if doesn't exist
        const imgHtml = `<img src="${imageSrc}" class="image-preview img-fluid mb-3" style="max-height: 200px; border-radius: 10px;" alt="Fingerprint Preview">`;
        uploadArea.find('[id*="preview"], .image-preview').prepend(imgHtml);
    }
    
    // Enable predict button
    uploadArea.find('[id*="predict"], .predict-btn').removeClass('d-none').prop('disabled', false);
    
    // Show clear button
    uploadArea.find('[id*="clear"], .clear-btn').removeClass('d-none');
    
    // Hide loading state
    hideUploadLoading(uploadArea);
}

/**
 * Predict blood group from fingerprint
 * @param {HTMLInputElement} input - File input element or file object
 * @param {string} resultContainerId - ID of result container
 */
function predictBloodGroup(input, resultContainerId) {
    let file;
    
    // Handle both input element and direct file
    if (input instanceof File) {
        file = input;
    } else if (input.files && input.files[0]) {
        file = input.files[0];
    } else {
        showErrorMessage('Please select a fingerprint image first');
        return;
    }
    
    if (!file) {
        showErrorMessage('No file selected for prediction');
        return;
    }
    
    // Find predict button and show loading state
    const predictBtn = $('[id*="predict"], .predict-btn').filter(':visible').first();
    const originalBtnText = predictBtn.html();
    setButtonLoading(predictBtn, 'Analyzing Fingerprint...');
    
    // Prepare form data
    const formData = new FormData();
    formData.append('fingerprint', file);
    
    // Show analysis progress
    showAnalysisProgress(resultContainerId);
    
    $.ajax({
        url: '/api/model/predict',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        timeout: 30000, // 30 second timeout
        success: function(response) {
            // Store prediction globally
            currentPrediction = {
                blood_group: response.predicted_group,
                confidence: response.confidence,
                allowed_to_donate: response.allowed_to_donate,
                timestamp: new Date(),
                threshold: response.threshold
            };
            
            // Display results
            displayPredictionResult(response, resultContainerId);
            
            // Log prediction for debugging
            console.log('Prediction successful:', response);
            
            // Enable donor form if confidence is sufficient
            if (response.allowed_to_donate) {
                enableDonorForm();
            }
            
            // Show success message
            const confidence = (response.confidence * 100).toFixed(1);
            showSuccessMessage(`Blood group predicted: ${response.predicted_group} (${confidence}% confidence)`);
        },
        error: function(xhr, status, error) {
            console.error('Prediction error:', error, xhr.responseText);
            
            let errorMessage = 'Error analyzing fingerprint. Please try again.';
            
            if (status === 'timeout') {
                errorMessage = 'Analysis timed out. Please try with a smaller image.';
            } else if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            } else if (xhr.status === 413) {
                errorMessage = 'Image file is too large. Please use an image smaller than 16MB.';
            } else if (xhr.status === 0) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            displayPredictionError(errorMessage, resultContainerId);
            showErrorMessage(errorMessage);
        },
        complete: function() {
            // Restore predict button
            if (predictBtn.length) {
                resetButton(predictBtn);
            }
            hideAnalysisProgress();
        }
    });
}

/**
 * Display prediction results
 * @param {Object} response - API response
 * @param {string} containerId - Container ID for results
 */
function displayPredictionResult(response, containerId) {
    const container = $(`#${containerId}`);
    const confidence = response.confidence * 100;
    const bloodGroupColor = getBloodGroupColor(response.predicted_group);
    const confidenceClass = getConfidenceClass(response.confidence);
    const confidenceBarClass = getConfidenceBootstrapClass(response.confidence);
    
    const resultHtml = `
        <div class="prediction-result border rounded p-4 ${response.allowed_to_donate ? 'border-success bg-light' : 'border-warning bg-warning bg-opacity-10'}">
            <div class="row">
                <div class="col-md-8">
                    <h5 class="mb-3">
                        <i class="fas fa-${response.allowed_to_donate ? 'check-circle text-success' : 'exclamation-triangle text-warning'} me-2"></i>
                        Analysis Complete
                    </h5>
                    
                    <div class="mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <strong class="me-2">Predicted Blood Group:</strong>
                            <span class="badge fs-6 px-3 py-2" style="background-color: ${bloodGroupColor};">
                                ${response.predicted_group}
                            </span>
                        </div>
                        <small class="text-muted">Based on fingerprint pattern analysis</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong>Confidence Level:</strong>
                            <span class="${confidenceClass} fw-bold">${confidence.toFixed(1)}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-${confidenceBarClass}" 
                                 role="progressbar" 
                                 style="width: ${confidence}%"
                                 aria-valuenow="${confidence}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                        <small class="text-muted">Minimum required: ${(response.threshold * 100).toFixed(0)}%</small>
                    </div>
                    
                    ${generateCompatibilityInfo(response.predicted_group)}
                </div>
                
                <div class="col-md-4 text-center">
                    <div class="prediction-icon mb-3">
                        <i class="fas fa-fingerprint fa-4x mb-2" style="color: ${bloodGroupColor};"></i>
                        <div class="small text-muted">AI Analysis</div>
                    </div>
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-12">
                    ${response.allowed_to_donate 
                        ? generateDonationEligibleMessage(response)
                        : generateLowConfidenceMessage(response)}
                </div>
            </div>
        </div>
    `;
    
    container.html(resultHtml).addClass('fade-in');
    
    // Scroll to results
    $('html, body').animate({
        scrollTop: container.offset().top - 100
    }, 500);
}

/**
 * Generate compatibility information
 * @param {string} bloodGroup - Predicted blood group
 */
function generateCompatibilityInfo(bloodGroup) {
    const compatibility = getBloodCompatibility(bloodGroup);
    
    return `
        <div class="compatibility-info">
            <strong>Can donate to:</strong>
            <div class="mt-1">
                ${compatibility.canDonateTo.map(group => 
                    `<span class="badge me-1 mb-1" style="background-color: ${getBloodGroupColor(group)};">${group}</span>`
                ).join('')}
            </div>
            <small class="text-muted mt-2 d-block">
                ${bloodGroup === 'O-' ? 'Universal donor - can help anyone!' : 
                  bloodGroup === 'AB+' ? 'Can receive from any blood group' : 
                  `Compatible with ${compatibility.canDonateTo.length} blood type(s)`}
            </small>
        </div>
    `;
}

/**
 * Generate donation eligible message
 * @param {Object} response - API response
 */
function generateDonationEligibleMessage(response) {
    return `
        <div class="alert alert-success mb-0">
            <div class="d-flex align-items-center">
                <i class="fas fa-heart fa-2x text-success me-3"></i>
                <div>
                    <h6 class="alert-heading mb-1">Ready to Save Lives!</h6>
                    <p class="mb-0">
                        Your blood group prediction confidence is above the minimum threshold. 
                        You can now register as a donor for compatible blood requests.
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate low confidence message
 * @param {Object} response - API response
 */
function generateLowConfidenceMessage(response) {
    return `
        <div class="alert alert-warning mb-0">
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle fa-2x text-warning me-3"></i>
                <div>
                    <h6 class="alert-heading mb-1">Confidence Too Low</h6>
                    <p class="mb-2">
                        The AI confidence level (${(response.confidence * 100).toFixed(1)}%) is below our safety threshold 
                        of ${(response.threshold * 100).toFixed(0)}% for donation matching.
                    </p>
                    <div class="improvement-tips">
                        <strong>Try:</strong>
                        <ul class="small mb-0 mt-1">
                            <li>Taking a clearer fingerprint image</li>
                            <li>Ensuring good lighting and focus</li>
                            <li>Using a higher resolution camera</li>
                            <li>Getting professional medical blood typing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display prediction error
 * @param {string} errorMessage - Error message
 * @param {string} containerId - Container ID
 */
function displayPredictionError(errorMessage, containerId) {
    const container = $(`#${containerId}`);
    
    const errorHtml = `
        <div class="prediction-error alert alert-danger">
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                <div>
                    <h6 class="alert-heading mb-1">Analysis Failed</h6>
                    <p class="mb-0">${errorMessage}</p>
                </div>
            </div>
            <hr>
            <div class="d-flex justify-content-between align-items-center mb-0">
                <small class="text-muted">Please try again with a different image</small>
                <button class="btn btn-sm btn-outline-danger" onclick="retryPrediction('${containerId}')">
                    <i class="fas fa-redo me-1"></i>Try Again
                </button>
            </div>
        </div>
    `;
    
    container.html(errorHtml);
}

/**
 * Clear fingerprint upload
 * @param {string} uploadAreaId - Upload area ID
 */
function clearFingerprintUpload(uploadAreaId) {
    const uploadArea = $(`#${uploadAreaId}`);
    
    // Clear file input
    uploadArea.find('input[type="file"]').val('');
    
    // Show placeholder, hide preview
    uploadArea.find('[id*="placeholder"], .upload-placeholder').removeClass('d-none');
    uploadArea.find('[id*="preview"], .image-preview').addClass('d-none');
    
    // Hide predict and clear buttons
    uploadArea.find('[id*="predict"], .predict-btn').addClass('d-none').prop('disabled', true);
    uploadArea.find('[id*="clear"], .clear-btn').addClass('d-none');
    
    // Clear results
    const parentContainer = uploadArea.parent();
    parentContainer.find('[id*="result"], .result-container').empty();
    
    // Hide donor form
    $('#donorForm').addClass('d-none');
    
    // Clear stored data
    if (uploadAreas[uploadAreaId]) {
        delete uploadAreas[uploadAreaId];
    }
    
    currentPrediction = null;
    
    // Reset upload area styles
    uploadArea.removeClass('dragover');
}

/**
 * Validate image file
 * @param {File} file - File to validate
 */
function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    const maxSize = 16 * 1024 * 1024; // 16MB
    const minSize = 1024; // 1KB
    
    if (!file) {
        throw new Error('No file selected');
    }
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, BMP, TIFF)');
    }
    
    if (file.size > maxSize) {
        throw new Error('File size must be less than 16MB');
    }
    
    if (file.size < minSize) {
        throw new Error('File is too small. Please select a proper image file');
    }
    
    return true;
}

/**
 * Check image quality
 * @param {File} file - Image file
 * @returns {Promise} Promise resolving to quality metrics
 */
function checkImageQuality(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Calculate image statistics
                let brightness = 0;
                let contrast = 0;
                let sharpness = 0;
                
                // Brightness calculation
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    brightness += gray;
                }
                brightness /= (data.length / 4);
                
                // Simple contrast calculation
                let variance = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    variance += Math.pow(gray - brightness, 2);
                }
                contrast = Math.sqrt(variance / (data.length / 4));
                
                const quality = {
                    width: img.width,
                    height: img.height,
                    brightness: brightness,
                    contrast: contrast,
                    sharpness: sharpness,
                    fileSize: file.size,
                    aspectRatio: img.width / img.height,
                    isGoodQuality: isGoodQuality(img.width, img.height, brightness, contrast),
                    recommendations: getQualityRecommendations(img.width, img.height, brightness, contrast)
                };
                
                resolve(quality);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = function() {
            reject(new Error('Could not load image for quality analysis'));
        };
        
        reader.onerror = function() {
            reject(new Error('Could not read image file'));
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Determine if image quality is good
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} brightness - Image brightness
 * @param {number} contrast - Image contrast
 * @returns {boolean} True if quality is good
 */
function isGoodQuality(width, height, brightness, contrast) {
    return width >= 200 && 
           height >= 200 && 
           brightness >= 30 && 
           brightness <= 220 && 
           contrast >= 20 &&
           width * height >= 40000; // Minimum resolution
}

/**
 * Get quality improvement recommendations
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} brightness - Image brightness
 * @param {number} contrast - Image contrast
 * @returns {Array} Array of recommendation strings
 */
function getQualityRecommendations(width, height, brightness, contrast) {
    const recommendations = [];
    
    if (width < 300 || height < 300) {
        recommendations.push('Use a higher resolution image (at least 300x300 pixels)');
    }
    
    if (brightness < 50) {
        recommendations.push('Image is too dark - ensure good lighting');
    } else if (brightness > 200) {
        recommendations.push('Image is too bright - reduce lighting or exposure');
    }
    
    if (contrast < 20) {
        recommendations.push('Image lacks contrast - ensure clear fingerprint definition');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Image quality looks good for analysis');
    }
    
    return recommendations;
}

/**
 * Display quality feedback
 * @param {Object} quality - Quality metrics
 * @param {string} uploadAreaId - Upload area ID
 */
function displayQualityFeedback(quality, uploadAreaId) {
    const uploadArea = $(`#${uploadAreaId}`);
    let qualityIndicator = uploadArea.find('.quality-indicator');
    
    if (qualityIndicator.length === 0) {
        qualityIndicator = $('<div class="quality-indicator mt-2"></div>');
        uploadArea.find('[id*="preview"], .image-preview').append(qualityIndicator);
    }
    
    const qualityClass = quality.isGoodQuality ? 'text-success' : 'text-warning';
    const qualityIcon = quality.isGoodQuality ? 'check-circle' : 'exclamation-triangle';
    const qualityText = quality.isGoodQuality ? 'Good quality' : 'Quality could be improved';
    
    let feedbackHtml = `
        <div class="quality-feedback ${qualityClass}">
            <small>
                <i class="fas fa-${qualityIcon} me-1"></i>
                ${qualityText} (${quality.width}x${quality.height})
            </small>
    `;
    
    if (!quality.isGoodQuality && quality.recommendations.length > 0) {
        feedbackHtml += `
            <div class="quality-tips mt-1">
                <small class="text-muted d-block">Tips: ${quality.recommendations[0]}</small>
            </div>
        `;
    }
    
    feedbackHtml += '</div>';
    
    qualityIndicator.html(feedbackHtml);
}

/**
 * Show upload loading state
 * @param {jQuery} uploadArea - Upload area element
 */
function showUploadLoading(uploadArea) {
    let loader = uploadArea.find('.upload-loader');
    if (loader.length === 0) {
        loader = $(`
            <div class="upload-loader text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="small text-muted">Processing image...</div>
            </div>
        `);
        uploadArea.append(loader);
    } else {
        loader.removeClass('d-none');
    }
}

/**
 * Hide upload loading state
 * @param {jQuery} uploadArea - Upload area element
 */
function hideUploadLoading(uploadArea) {
    uploadArea.find('.upload-loader').addClass('d-none');
}

/**
 * Show upload error
 * @param {string} message - Error message
 * @param {string} uploadAreaId - Upload area ID
 */
function showUploadError(message, uploadAreaId) {
    const uploadArea = $(`#${uploadAreaId}`);
    
    let errorDiv = uploadArea.find('.upload-error');
    if (errorDiv.length === 0) {
        errorDiv = $('<div class="upload-error alert alert-danger mt-2"></div>');
        uploadArea.append(errorDiv);
    }
    
    errorDiv.html(`
        <small>
            <i class="fas fa-exclamation-triangle me-1"></i>
            ${message}
        </small>
    `).removeClass('d-none');
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.addClass('d-none');
    }, 5000);
}

/**
 * Show analysis progress
 * @param {string} containerId - Container ID
 */
function showAnalysisProgress(containerId) {
    const container = $(`#${containerId}`);
    
    const progressHtml = `
        <div class="analysis-progress text-center py-4">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Analyzing...</span>
            </div>
            <h6>Analyzing Fingerprint Pattern</h6>
            <div class="progress mt-3" style="height: 6px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 100%"></div>
            </div>
            <small class="text-muted mt-2 d-block">This may take a few seconds...</small>
        </div>
    `;
    
    container.html(progressHtml);
}

/**
 * Hide analysis progress
 */
function hideAnalysisProgress() {
    $('.analysis-progress').remove();
}

/**
 * Enable donor form after successful prediction
 */
function enableDonorForm() {
    const donorForm = $('#donorForm');
    if (donorForm.length && currentPrediction && currentPrediction.allowed_to_donate) {
        donorForm.removeClass('d-none');
        
        // Pre-fill blood group if form has that field
        const bloodGroupField = donorForm.find('[name="donor_blood_group"], #donorBloodGroup');
        if (bloodGroupField.length) {
            bloodGroupField.val(currentPrediction.blood_group);
        }
        
        // Focus on first input
        donorForm.find('input:visible:first').focus();
    }
}

/**
 * Retry prediction
 * @param {string} containerId - Container ID
 */
function retryPrediction(containerId) {
    // Find the associated file input
    const container = $(`#${containerId}`);
    const uploadArea = container.siblings('[id*="upload"], .upload-area').first();
    const fileInput = uploadArea.find('input[type="file"]').first();
    
    if (fileInput.length && fileInput[0].files.length > 0) {
        predictBloodGroup(fileInput[0], containerId);
    } else {
        showErrorMessage('Please select an image first');
    }
}

/**
 * Get blood group color
 * @param {string} bloodGroup - Blood group
 * @returns {string} Color hex code
 */
function getBloodGroupColor(bloodGroup) {
    const colors = {
        'A+': '#ff6b6b',
        'A-': '#ff8e8e', 
        'B+': '#4ecdc4',
        'B-': '#6dd5db',
        'AB+': '#45b7d1',
        '