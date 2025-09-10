// Fingerprint Analysis JavaScript for BloodClan
$(document).ready(function() {
    // Initialize fingerprint upload areas
    initFingerprintUpload();
});

function initFingerprintUpload() {
    // Handle file input changes
    $('input[type="file"][accept="image/*"]').on('change', function(e) {
        handleFingerprintUpload(e.target);
    });
    
    // Handle drag and drop
    $('.upload-area').on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragover');
    });
    
    $('.upload-area').on('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragover');
    });
    
    $('.upload-area').on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragover');
        
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = $(this).find('input[type="file"]')[0];
            fileInput.files = files;
            handleFingerprintUpload(fileInput);
        }
    });
}

function handleFingerprintUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        validateImageFile(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const uploadArea = $(input).closest('.upload-area, [id*="upload-area"]');
            const previewContainer = uploadArea.find('[id*="preview"], .image-preview');
            const previewImg = uploadArea.find('img');
            
            if (previewImg.length) {
                previewImg.attr('src', e.target.result);
            }
            
            // Show preview, hide placeholder
            uploadArea.find('[id*="placeholder"]').addClass('d-none');
            uploadArea.find('[id*="preview"]').removeClass('d-none');
            
            // Enable predict button
            uploadArea.find('[id*="predict"], .predict-btn').prop('disabled', false);
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        showErrorMessage(error.message);
        input.value = '';
    }
}

function predictBloodGroup(inputId, resultContainerId) {
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];
    
    if (!file) {
        showErrorMessage('Please select a fingerprint image first');
        return;
    }
    
    const formData = new FormData();
    formData.append('fingerprint', file);
    
    const predictBtn = $(`#${inputId}`).closest('.upload-area, [id*="upload-area"]').find('[id*="predict"], .predict-btn');
    const originalBtnText = predictBtn.html();
    
    // Show loading state
    predictBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Analyzing fingerprint...');
    predictBtn.prop('disabled', true);
    
    $.ajax({
        url: '/api/model/predict',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            displayPredictionResult(response, resultContainerId);
            
            // Store prediction data for form submission
            window.lastPrediction = {
                blood_group: response.predicted_group,
                confidence: response.confidence,
                allowed_to_donate: response.allowed_to_donate
            };
        },
        error: function(xhr) {
            let errorMessage = 'Error analyzing fingerprint. Please try again.';
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            }
            
            $(`#${resultContainerId}`).html(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${errorMessage}
                </div>
            `);
        },
        complete: function() {
            // Restore button
            predictBtn.html(originalBtnText);
            predictBtn.prop('disabled', false);
        }
    });
}

function displayPredictionResult(response, containerId) {
    const container = $(`#${containerId}`);
    const confidence = response.confidence * 100;
    const confidenceClass = getConfidenceClass(response.confidence);
    const bloodGroupColor = getBloodGroupColor(response.predicted_group);
    
    let resultHtml = `
        <div class="prediction-result ${response.allowed_to_donate ? 'alert-success' : 'alert-warning'}">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h5 class="mb-2">
                        <i class="fas fa-${response.allowed_to_donate ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        Analysis Complete
                    </h5>
                    <div class="mb-2">
                        <strong>Predicted Blood Group:</strong>
                        <span class="badge ms-2" style="background-color: ${bloodGroupColor}; font-size: 1rem;">
                            ${response.predicted_group}
                        </span>
                    </div>
                    <div class="mb-3">
                        <strong>Confidence Level:</strong>
                        <span class="ms-2 ${confidenceClass}">${confidence.toFixed(1)}%</span>
                        <div class="confidence-bar mt-1">
                            <div class="confidence-fill bg-${getConfidenceBootstrapClass(response.confidence)}" 
                                 style="width: ${confidence}%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 text-center">
                    <div class="prediction-icon">
                        <i class="fas fa-fingerprint fa-3x" style="color: ${bloodGroupColor}"></i>
                    </div>
                </div>
            </div>
    `;
    
    if (response.allowed_to_donate) {
        resultHtml += `
            <div class="alert alert-info mt-3 mb-0">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Confidence level is sufficient for donation matching.</strong>
                You can proceed to register as a donor.
            </div>
        `;
    } else {
        resultHtml += `
            <div class="alert alert-warning mt-3 mb-0">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Confidence level too low for reliable matching.</strong>
                Try uploading a clearer fingerprint image or consult medical testing.
            </div>
        `;
    }
    
    resultHtml += '</div>';
    
    container.html(resultHtml).addClass('fade-in');
}

function getConfidenceClass(confidence) {
    if (confidence >= 0.8) return 'text-success fw-bold';
    if (confidence >= 0.65) return 'text-warning fw-bold';
    return 'text-danger';
}

function getConfidenceBootstrapClass(confidence) {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.65) return 'warning';
    return 'danger';
}

function clearFingerprintUpload(uploadAreaId) {
    const uploadArea = $(`#${uploadAreaId}`);
    
    // Clear file input
    uploadArea.find('input[type="file"]').val('');
    
    // Hide preview, show placeholder
    uploadArea.find('[id*="preview"]').addClass('d-none');
    uploadArea.find('[id*="placeholder"]').removeClass('d-none');
    
    // Clear results
    uploadArea.siblings('[id*="result"], .prediction-result').empty();
    
    // Disable predict button
    uploadArea.find('[id*="predict"], .predict-btn').prop('disabled', true);
    
    // Clear stored prediction
    if (window.lastPrediction) {
        delete window.lastPrediction;
    }
}

// Quality check for fingerprint images
function checkImageQuality(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Calculate basic image statistics
            let brightness = 0;
            let contrast = 0;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                brightness += gray;
            }
            
            brightness /= (data.length / 4);
            
            // Check if image meets basic quality requirements
            const quality = {
                width: img.width,
                height: img.height,
                brightness: brightness,
                fileSize: file.size,
                isGoodQuality: img.width >= 200 && img.height >= 200 && brightness > 30 && brightness < 220
            };
            
            resolve(quality);
        };
        
        img.onerror = function() {
            reject(new Error('Could not process image'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Advanced fingerprint preprocessing (for future enhancement)
function preprocessFingerprint(imageData) {
    // This function could be enhanced with more sophisticated
    // image preprocessing techniques for better accuracy
    
    // Basic enhancement: normalize contrast
    const data = imageData.data;
    const factor = (259 * (255 + 255)) / (255 * (259 - 255));
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;     // Red
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
    }
               