
// API Configuration
const API_BASE = window.location.origin;
const API_ENDPOINTS = {
REQUESTS: `${API_BASE}/api/requests`,
PREDICT: `${API_BASE}/api/model/predict`,
HEALTH: `${API_BASE}/api/model/health`,
};

// Global variables
let currentPage = 1;
let userLat = null;
let userLng = null;
let currentRequestId = null;
let currentPrediction = null;
let API_AVAILABLE = false;


$(document).ready(function () {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Page navigation
$("[data-page]").on("click", function (e) {
    e.preventDefault();
    const page = $(this).data("page");
    showPage(page);

    // Load data for specific pages
    if (page === "requests") {
    loadRequests();
    }
});

// Initialize fingerprint functionality
initFingerprintUpload();

// Initialize form submission
initForms();

// Initialize location buttons
initLocationButtons();

// Initialize filters
initFilters();

// Initialize donor form
initDonorForm();

// Check API health on load
checkApiHealth();
});

// Page Navigation
function showPage(page) {
    // Stop auto-refresh when leaving requests page
    if ($("#requests-page").hasClass("active")) {
        stopAutoRefresh();
    }

    // Hide all pages
    $(".page-section").removeClass("active");

    // Show selected page
    $(`#${page}-page`).addClass("active");

    // Start auto-refresh if on requests page
    if (page === "requests") {
        startAutoRefresh();
    }

    // Update navigation active state
    $(".nav-link").removeClass("active");
    $(`.nav-link[data-page="${page}"]`).addClass("active");

    // Scroll to top
    window.scrollTo(0, 0);
}

// Show request details page
function showRequestDetails(requestId) {
    currentRequestId = requestId;
    loadRequestDetails(requestId);
    showPage("details");
}

// API Health Check
function checkApiHealth() {
    $.ajax({
        url: API_ENDPOINTS.HEALTH,
        method: "GET",
        timeout: 5000, // 5 second timeout
        success: function (response) {
        console.log("API Health:", response.status);
        API_AVAILABLE = true;
        },
        error: function (xhr, status, error) {
        console.warn("API health check failed:", status, error);
        API_AVAILABLE = false;

        // Show warning to user that some features might not work
        if (status !== "timeout") {
            // Use setTimeout to ensure this runs after page load
            setTimeout(() => {
            $("#flash-messages").append(`
                        <div class="alert alert-warning alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Blood type detection service is currently unavailable. Using demo mode.
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `);
            }, 1000);
        }
        },
    });
}

// Load requests from API
function loadRequests() {
    $("#loadingSpinner").removeClass("d-none");
    $("#requestsList").addClass("d-none");
    $("#noResultsMessage").addClass("d-none");

    const params = new URLSearchParams({
        page: currentPage,
        per_page: 12,
    });

    // Add filters
    const bloodGroup = $("#filterBloodGroup").val();
    if (bloodGroup) params.append("blood_group", bloodGroup);

    if (userLat && userLng) {
        params.append("lat", userLat);
        params.append("lng", userLng);
        params.append("radius_km", $("#radiusKm").val());
    }

    $.ajax({
        url: `${API_ENDPOINTS.REQUESTS}?${params.toString()}`,
        method: "GET",
        success: function (response) {
        displayRequests(response);
        displayPagination(response);
        },
        error: function (xhr) {
        $("#requestsContainer").html(`
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error loading requests. Please try again.
                        </div>
                    </div>
                `);
        },
        complete: function () {
        $("#loadingSpinner").addClass("d-none");
        },
    });
}

// Display requests in the UI
function displayRequests(response) {
    const requests = response.requests;
    const container = $("#requestsContainer");
    container.empty();

    if (requests.length === 0) {
        $("#noResultsMessage").removeClass("d-none");
        return;
    }

    const currentTime = new Date();

    requests.forEach(function (request) {
        const createdDate = new Date(request.created_at).toLocaleDateString();
        const expiresDate = request.expires_at
        ? new Date(request.expires_at)
        : null;
        const distanceText = request.distance_km
        ? `${request.distance_km} km away`
        : "";
        const bloodGroupClass = `blood-${request.blood_group.toLowerCase()}`;

        // Check if request is expired or expiring soon
        let cardClass = "";
        let statusBadge = "";

        if (expiresDate) {
        const timeUntilExpiry = expiresDate - currentTime;
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

        if (timeUntilExpiry <= 0) {
            // Expired - this shouldn't happen with the backend filter, but just in case
            cardClass = "request-expired";
            statusBadge =
            '<span class="expired-badge ms-2"><i class="fas fa-exclamation-circle me-1"></i>Expired</span>';
        } else if (hoursUntilExpiry <= 24) {
            // Expiring in less than 24 hours
            cardClass = "request-expiring-soon";
            const hours = Math.floor(hoursUntilExpiry);
            statusBadge = `<span class="expiring-soon-badge ms-2"><i class="fas fa-clock me-1"></i>Expires in ${hours}h</span>`;
        }
        }

        container.append(`
                <div class="col-lg-6 col-xl-4 mb-4">
                    <div class="card request-card h-100 shadow-sm ${cardClass}">
                        <div class="card-header bg-light d-flex justify-content-between align-items-center">
                            <div>
                                <span class="blood-badge ${bloodGroupClass}">${request.blood_group}</span>
                                ${statusBadge}
                            </div>
                            <small class="text-muted">${createdDate}</small>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${request.title}</h5>
                            <p class="card-text text-truncate" style="max-height: 3em; overflow: hidden;">
                                ${
                                request.description ||
                                "No additional details provided."
                                }
                            </p>
                            
                            <div class="row text-center mb-3">
                                <div class="col-6">
                                    <div class="text-muted small">Units Needed</div>
                                    <div class="fw-bold text-danger">${
                                    request.units_needed
                                    }</div>
                                </div>
                                <div class="col-6">
                                    <div class="text-muted small">Donors</div>
                                    <div class="fw-bold text-success">${
                                    request.donor_count
                                    }</div>
                                </div>
                            </div>

                            <div class="mb-2">
                                <i class="fas fa-map-marker-alt text-muted me-2"></i>
                                <small>${request.address}</small>
                                ${
                                distanceText
                                    ? `<br><small class="text-primary">${distanceText}</small>`
                                    : ""
                                }
                            </div>

                            <div class="mb-3">
                                <i class="fas fa-user text-muted me-2"></i>
                                <small>${request.contact_name}</small>
                            </div>

                            ${
                            request.expires_at
                                ? `
                                <div class="alert alert-warning py-2 mb-3">
                                    <small><i class="fas fa-clock me-1"></i>Expires: ${new Date(
                                    request.expires_at
                                    ).toLocaleDateString()}</small>
                                </div>
                            `
                                : ""
                            }
                        </div>
                        <div class="card-footer bg-transparent">
                            <div class="d-grid">
                                <button class="btn btn-outline-primary btn-sm view-details-btn" data-id="${
                                request.id
                                }">
                                    <i class="fas fa-eye me-2"></i>View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
});

// Add event listeners to view details buttons
$(".view-details-btn").on("click", function () {
    const requestId = $(this).data("id");
    showRequestDetails(requestId);
});

$("#requestsList").removeClass("d-none");
}

let refreshInterval = null;

// Refresh every 5 minutes
function startAutoRefresh() {
refreshInterval = setInterval(() => {
    if ($("#requests-page").hasClass("active")) {
        loadRequests();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Load request details
function loadRequestDetails(requestId) {
    $.ajax({
        url: `${API_ENDPOINTS.REQUESTS}/${requestId}`,
        method: "GET",
        success: function (request) {
        displayRequestDetails(request);
        // Load donors for this request
        loadDonors(requestId);
        },
        error: function () {
        showErrorMessage("Failed to load request details");
        showPage("requests");
        },
    });
}

// Display request details
function displayRequestDetails(request) {

    $("#request-id").text(`BL-${request.id}`);
    $("#request-title").text(request.title);
    $("#request-description").text(
        request.description || "No additional details provided."
    );
    $("#request-blood-group")
        .text(request.blood_group)
        .addClass(`blood-${request.blood_group.toLowerCase()}`);
    $("#request-units").text(request.units_needed);
    $("#request-address").text(request.address);

    // Format dates
    const createdDate = new Date(request.created_at);
    $("#request-created").text(
        createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        })
    );

    if (request.expires_at) {
        const expiresDate = new Date(request.expires_at);
        $("#request-expiry")
        .html(
            `
                <i class="fas fa-hourglass-half me-2"></i>
                <strong>Expires:</strong> ${expiresDate.toLocaleDateString(
                    "en-US",
                    {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    }
                )}
            `
        )
        .removeClass("d-none");
    } else {
        $("#request-expiry").addClass("d-none");
    }

    // Update contact info
    $("#contact-name").text(request.contact_name);
    $("#contact-phone")
        .text(request.contact_phone)
        .attr("href", `tel:${request.contact_phone}`);
    $("#call-btn").attr("href", `tel:${request.contact_phone}`);

    if (request.contact_email) {
        $("#contact-email")
        .text(request.contact_email)
        .attr("href", `mailto:${request.contact_email}`);
        $("#email-btn").attr("href", `mailto:${request.contact_email}`);
        $("#contact-email-container").removeClass("d-none");
    } else {
        $("#contact-email-container").addClass("d-none");
    }

    // Load donors
    loadDonors(request.id);
}

// Handle donor registration form submission
function handleDonorRegistration(e) {
    e.preventDefault();

    if (!currentPrediction || !currentRequestId) {
        showErrorMessage("Please complete fingerprint analysis first");
        return;
    }

    const donorData = {
        donor_name: $("#donorName").val(),
        donor_contact: $("#donorContact").val(),
        donor_blood_group: currentPrediction.predicted_group,
        confidence: currentPrediction.confidence,
    };

    // Show loading state
    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Registering...'
    );
    submitBtn.prop("disabled", true);

    // Submit to API
    $.ajax({
        url: `${API_ENDPOINTS.REQUESTS}/${currentRequestId}/optin`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(donorData),
        success: function (response) {
        showSuccessMessage(
            "Thank you for registering as a donor! The requester will contact you soon."
        );
        $("#donorForm")[0].reset();
        $("#donorForm").addClass("d-none");

        // Reload donors list
        loadDonors(currentRequestId);
        },
        error: function (xhr) {
        let errorMessage = "Failed to register as donor. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
        }
        showErrorMessage(errorMessage);
        },
        complete: function () {
        submitBtn.html(originalText);
        submitBtn.prop("disabled", false);
        },
    });
}

// Load donors for a specific request
function loadDonors(requestId) {
    $.ajax({
        url: `${API_ENDPOINTS.REQUESTS}/${requestId}/donors`,
        method: "GET",
        success: function (response) {
        displayDonors(response.donors);
        },
        error: function (xhr) {
        console.error("Failed to load donors:", xhr);
        // Show empty state
        displayDonors([]);
        },
    });
}

// Display donors in the UI
function displayDonors(donors) {
    const donorsList = $("#donors-list");
    const donorCount = $("#donor-count");

    donorCount.text(donors.length);

    if (donors.length === 0) {
        donorsList.html(`
        <div class="text-center text-muted py-3">
            <i class="fas fa-user-plus fa-2x mb-2"></i>
            <p>No donors registered yet.<br>Be the first to help!</p>
        </div>
    `);
        return;
    }

    let donorsHtml = "";

    donors.forEach(function (donor) {
        const createdDate = new Date(donor.created_at).toLocaleDateString();
        const confidencePercent = (donor.prediction_confidence * 100).toFixed(
        0
        );
        const bloodGroupClass = `blood-${donor.donor_blood_group.toLowerCase()}`;

        donorsHtml += `
        <div class="donor-item mb-3 p-3 border rounded">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">${donor.donor_name}</h6>
                    <div class="d-flex align-items-center mb-1">
                        <span class="blood-badge ${bloodGroupClass} me-2">${donor.donor_blood_group}</span>
                        <small class="text-muted">${confidencePercent}% confidence</small>
                    </div>
                    <div class="contact-info">
                        <small><i class="fas fa-phone text-muted me-1"></i>${donor.donor_contact}</small>
                    </div>
                </div>
                <div class="text-end">
                    <small class="text-muted">${createdDate}</small>
                </div>
            </div>
        </div>
    `;
    });

    donorsList.html(donorsHtml);
}

// Initialize donor form
function initDonorForm() {
    $("#donorForm").on("submit", handleDonorRegistration);
}

// Display pagination
function displayPagination(response) {
    const totalPages = Math.ceil(response.total / response.per_page);
    const container = $("#paginationContainer");
    container.empty();

    if (totalPages <= 1) {
        return;
    }

    let paginationHtml = '<nav><ul class="pagination">';

    // Previous button
    if (currentPage > 1) {
        paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${
                        currentPage - 1
                    }">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
            `;
    }

    // Page numbers
    for (
        let i = Math.max(1, currentPage - 2);
        i <= Math.min(totalPages, currentPage + 2);
        i++
    ) {
        paginationHtml += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${
                        currentPage + 1
                    }">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            `;
    }

    paginationHtml += "</ul></nav>";
    container.html(paginationHtml);

    // Event listeners to pagination buttons
    container.find(".page-link").on("click", function (e) {
        e.preventDefault();
        const page = $(this).data("page");
        if (page) {
        currentPage = page;
        loadRequests();
        $("html, body").animate({ scrollTop: 0 }, 300);
        }
    });
}

// Fingerprint Upload Functionality
function initFingerprintUpload() {
    // Set up file input triggers
    $("#selectModalFile").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        $("#modalFingerprint").click();
    });

    $("#selectDonateFile").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        $("#donateFingerprint").click();
    });

    // Set up clear buttons
    $("#clearModalBtn").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearUploadArea("modal");
    });

    $("#clearDonateBtn").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearUploadArea("donate");
    });

    // Set up predict buttons
    $("#predictModalBtn").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        predictBloodGroup("modal");
    });

    $("#predictDonateBtn").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        predictBloodGroup("donate");
    });

    // File change handlers
    $("#modalFingerprint").on("change", function (e) {
        handleFileSelect(this, "modal");
    });

    $("#donateFingerprint").on("change", function (e) {
        handleFileSelect(this, "donate");
    });

    // Initialize upload areas (without the problematic click handlers)
    initUploadArea("modal");
    initUploadArea("donate");
}

function handleFileSelect(fileInput, prefix) {
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];

        // Validate file type
        if (!file.type.match("image.*")) {
        showErrorMessage("Please select an image file (JPEG, PNG, etc.)");
        return;
        }

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
        showErrorMessage("File size must be less than 5MB");
        return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = function (e) {
        $(`#${prefix}-upload-placeholder`).addClass("d-none");
        $(`#${prefix}-image-preview`).removeClass("d-none");
        $(`#${prefix}-preview-img`).attr("src", e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Initialize an upload area
function initUploadArea(prefix) {
    const uploadArea = $(`#${prefix}-upload-area`);

    // Only handle drag and drop here, not click
    uploadArea.on("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.addClass("dragover");
    });

    uploadArea.on("dragleave", function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.removeClass("dragover");
    });

    uploadArea.on("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.removeClass("dragover");

        const files = e.originalEvent.dataTransfer.files;
        if (files.length) {
        $(`#${prefix}Fingerprint`)[0].files = files;
        handleFileSelect($(`#${prefix}Fingerprint`)[0], prefix);
        }
    });
}

// Clear an upload area
function clearUploadArea(prefix) {
    $(`#${prefix}Fingerprint`).val("");
    $(`#${prefix}-upload-placeholder`).removeClass("d-none");
    $(`#${prefix}-image-preview`).addClass("d-none");

    if (prefix === "modal") {
        $("#modal-result").addClass("d-none");
        $("#modal-no-result").removeClass("d-none");
        $("#saveResultsBtn").addClass("d-none");
    } else {
        $("#donateResult").empty();
        $("#donorForm").addClass("d-none");
    }
}

// Predict blood group from fingerprint
function predictBloodGroup(prefix) {
    const fileInput = $(`#${prefix}Fingerprint`)[0];
    const file = fileInput.files[0];

    if (!file) {
        showErrorMessage("Please select a fingerprint image first");
        return;
    }

    console.log("File selected:", file.name, file.type, file.size);

    const predictBtn = $(
        `#predict${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Btn`
    );
    const originalText = predictBtn.html();
    predictBtn.html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...'
    );
    predictBtn.prop("disabled", true);

    const formData = new FormData();
    formData.append("fingerprint", file);

    console.log("Sending request to:", API_ENDPOINTS.PREDICT);

    $.ajax({
        url: API_ENDPOINTS.PREDICT,
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        timeout: 30000,
        success: function (response) {
        console.log("Prediction success:", response);
        displayPredictionResult(response, prefix);
        },
        error: function (xhr, status, error) {
        console.error("Prediction error:", status, error, xhr.responseText);
        let errorMessage = "Error analyzing fingerprint. Please try again.";
        if (status === "timeout") {
            errorMessage = "Analysis timed out. Please try a smaller image.";
        } else if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
        }
        showErrorMessage(errorMessage);

        // Fall back to simulation if API call fails
        simulatePrediction(prefix);
        },
        complete: function () {
        predictBtn.html(originalText);
        predictBtn.prop("disabled", false);
        },
    });
}

// Display prediction result
function displayPredictionResult(response, prefix) {
    currentPrediction = response;
    const confidencePercent = (response.confidence * 100).toFixed(1);

    if (prefix === "modal") {
        $("#modal-no-result").addClass("d-none");
        $("#modal-result").removeClass("d-none");
        $("#modal-blood-type").text(response.predicted_group);
        $("#modal-confidence").text(`${confidencePercent}% Confidence`);
        $("#modal-progress-bar").css("width", `${confidencePercent}%`);

        // Generate compatibility info
        const compatibility = getBloodCompatibility(response.predicted_group);
        $("#modal-compatibility").empty();
        compatibility.canDonateTo.forEach((group) => {
        $("#modal-compatibility").append(
            `<span class="blood-badge blood-${group.toLowerCase()}">${group}</span>`
        );
        });

        $("#saveResultsBtn").removeClass("d-none");
    } else {
        // For donation page
        const requiredGroup = $("#request-blood-group").text();
        const isCompatible = isBloodCompatible(
        response.predicted_group,
        requiredGroup
        );

        let resultHtml = `
                <div class="alert ${
                    response.allowed_to_donate
                    ? "alert-success"
                    : "alert-warning"
                }">
                    <h6 class="alert-heading">
                        <i class="fas fa-${
                            response.allowed_to_donate
                            ? "check-circle"
                            : "exclamation-triangle"
                        } me-2"></i>
                        Analysis Result
                    </h6>
                    <p><strong>Predicted Blood Group:</strong> ${
                        response.predicted_group
                    }</p>
                    <p><strong>Confidence:</strong> ${confidencePercent}%</p>
            `;

        if (response.allowed_to_donate) {
        if (isCompatible) {
            resultHtml += `<p class="mb-0 text-success"><i class="fas fa-heart me-2"></i><strong>Perfect Match! You can help this patient.</strong></p>`;
        } else {
            resultHtml += `<p class="mb-0 text-warning"><i class="fas fa-info-circle me-2"></i><strong>Blood group mismatch, but you can still register for future compatibility.</strong></p>`;
        }
        } else {
        resultHtml += `<p class="mb-0">Confidence level too low for donation. Please try a clearer image.</p>`;
        }

        resultHtml += `</div>`;

        $("#donateResult").html(resultHtml);

        if (response.allowed_to_donate) {
        $("#donorForm").removeClass("d-none");
        $("#donorName").focus();
        }
    }
}

// Form Initialization
function initForms() {
    // Create request form
    $("#createRequestForm").on("submit", function (e) {
        e.preventDefault();

        // Simple validation
        let isValid = true;
        $(this)
        .find("[required]")
        .each(function () {
            if (!$(this).val()) {
            isValid = false;
            $(this).addClass("is-invalid");
            } else {
            $(this).removeClass("is-invalid");
            }
        });

        if (!isValid) {
        showErrorMessage("Please fill in all required fields");
        return;
        }

        // Prepare form data
        const formData = {
        title: $("#title").val(),
        blood_group: $("#bloodGroup").val(),
        units_needed: parseInt($("#unitsNeeded").val()) || 1,
        description: $("#description").val(),
        expires_at: $("#expiresAt").val() || null,
        contact_name: $("#contactName").val(),
        contact_phone: $("#contactPhone").val(),
        contact_email: $("#contactEmail").val(),
        address: $("#address").val(),
        lat: parseFloat($("#latitude").val()) || null,
        lng: parseFloat($("#longitude").val()) || null,
        };

        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Creating Request...'
        );
        submitBtn.prop("disabled", true);

        // Submit to API
        $.ajax({
        url: API_ENDPOINTS.REQUESTS,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(formData),
        success: function (response) {
            showSuccessMessage("Blood request created successfully!");
            $("#createRequestForm")[0].reset();

            // Redirect to requests page
            setTimeout(() => {
            showPage("requests");
            loadRequests();
            }, 1500);
        },
        error: function (xhr) {
            let errorMessage = "Failed to create request. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
            }
            showErrorMessage(errorMessage);
        },
        complete: function () {
            submitBtn.html(originalText);
            submitBtn.prop("disabled", false);
        },
        });
    });

    // Donor registration form
    $("#donorForm").on("submit", function (e) {
        e.preventDefault();

        if (!currentPrediction || !currentRequestId) {
        showErrorMessage("Please complete fingerprint analysis first");
        return;
        }

        const donorData = {
        donor_name: $("#donorName").val(),
        donor_contact: $("#donorContact").val(),
        donor_blood_group: currentPrediction.predicted_group,
        confidence: currentPrediction.confidence,
        };

        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Registering...'
        );
        submitBtn.prop("disabled", true);

        // Submit to API
        $.ajax({
        url: `${API_ENDPOINTS.REQUESTS}/${currentRequestId}/optin`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(donorData),
        success: function (response) {
            showSuccessMessage(
            "Thank you for registering as a donor! The requester will contact you soon."
            );
            $("#donorForm")[0].reset();
            $("#donorForm").addClass("d-none");

            // Reload donors list
            loadDonors(currentRequestId);
        },
        error: function (xhr) {
            let errorMessage =
            "Failed to register as donor. Please try again.";
            if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
            }
            showErrorMessage(errorMessage);
        },
        complete: function () {
            submitBtn.html(originalText);
            submitBtn.prop("disabled", false);
        },
        });
    });
}

// Initialize location buttons
function initLocationButtons() {
// Get current location for create form
$("#getCurrentLocation").on("click", function () {
    if (navigator.geolocation) {
    $(this).html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Getting Location...'
    );
    navigator.geolocation.getCurrentPosition(
        function (position) {
        $("#latitude").val(position.coords.latitude.toFixed(6));
        $("#longitude").val(position.coords.longitude.toFixed(6));
        $("#getCurrentLocation").html(
            '<i class="fas fa-check me-2"></i>Location Set'
        );
        setTimeout(function () {
            $("#getCurrentLocation").html(
            '<i class="fas fa-crosshairs me-2"></i>Use My Current Location'
            );
        }, 2000);
        },
        function (error) {
        alert("Unable to get your location. Please enter manually.");
        $("#getCurrentLocation").html(
            '<i class="fas fa-crosshairs me-2"></i>Use My Current Location'
        );
        }
    );
    } else {
    alert("Geolocation is not supported by this browser.");
    }
});

// Get current location for filters
$("#getLocationBtn").on("click", function () {
    if (navigator.geolocation) {
    $(this).html(
        '<i class="fas fa-spinner fa-spin me-2"></i>Getting Location...'
    );
    navigator.geolocation.getCurrentPosition(
        function (position) {
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
        $("#locationDisplay").val(
            `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`
        );
        $("#getLocationBtn").html(
            '<i class="fas fa-check me-2"></i>Location Set'
        );
        setTimeout(function () {
            $("#getLocationBtn").html(
            '<i class="fas fa-crosshairs me-2"></i>Use My Location'
            );
        }, 2000);
        },
        function (error) {
        alert("Unable to get your location.");
        $("#getLocationBtn").html(
            '<i class="fas fa-crosshairs me-2"></i>Use My Location'
        );
        }
    );
    }
});
}

//simulate prediction when API is unavailable
function simulatePrediction(prefix) {
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const randomGroup =
        bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
    const confidence = (Math.random() * 0.3 + 0.7).toFixed(2); // 70-100% confidence

    const response = {
        predicted_group: randomGroup,
        confidence: parseFloat(confidence),
        allowed_to_donate: Math.random() > 0.3, // 70% chance of being allowed
    };

    displayPredictionResult(response, prefix);

    // Show info message that this is a demo (only once)
    if (!window.demoMessageShown) {
        window.demoMessageShown = true;
        showInfoMessage(
        "Using demo mode: Displaying simulated blood type results"
        );
    }
}

function showInfoMessage(message) {
    const alertHtml = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <i class="fas fa-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $("#flash-messages").append(alertHtml);
}

// Initialize filters
function initFilters() {
$("#applyFilters").on("click", function () {
    currentPage = 1;
    loadRequests();
});

$("#filterBloodGroup, #radiusKm").on("change", function () {
    currentPage = 1;
    loadRequests();
});
}

// Blood compatibility functions
function getBloodCompatibility(bloodGroup) {
    const compatibility = {
        "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        "O+": ["A+", "B+", "AB+", "O+"],
        "A-": ["A+", "A-", "AB+", "AB-"],
        "A+": ["A+", "AB+"],
        "B-": ["B+", "B-", "AB+", "AB-"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB+", "AB-"],
        "AB+": ["AB+"],
    };

    return {
        canDonateTo: compatibility[bloodGroup] || [],
        canReceiveFrom: Object.keys(compatibility).filter((group) =>
        compatibility[group].includes(bloodGroup)
        ),
    };
}

function isBloodCompatible(donorGroup, recipientGroup) {
    const compatibility = getBloodCompatibility(donorGroup);
    return compatibility.canDonateTo.includes(recipientGroup);
    }

$("#refreshRequests").on("click", function() {
    const btn = $(this);
    const originalHtml = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin me-2"></i>Refreshing...');
    btn.prop('disabled', true);
    
    loadRequests();
    
    setTimeout(() => {
        btn.html(originalHtml);
        btn.prop('disabled', false);
    }, 1000);
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
    $("#flash-messages").html(alertHtml);
    $("html, body").animate({ scrollTop: 0 }, 300);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        $(".alert").alert("close");
    }, 5000);
}

function showErrorMessage(message) {
    const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    $("#flash-messages").html(alertHtml);
    $("html, body").animate({ scrollTop: 0 }, 300);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        $(".alert").alert("close");
    }, 5000);
}