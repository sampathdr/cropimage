$(document).ready(function() {
    let cropper = null;
    let currentImagePath = '';
    let currentImageInfo = null;
    let cropHistory = [];
    let currentHistoryIndex = -1;

    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Initialize event handlers
    initializeEventHandlers();
    
    // Load presets
    loadPresets();

    function initializeDragAndDrop() {
        const dropZone = $('#dropZone');
        const fileInput = $('#fileInput');

        // Prevent default drag behaviors
        $(document).on('dragenter dragover drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });

        // Drop zone hover effects
        dropZone.on('dragenter dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('drag-over');
        });

        dropZone.on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
        });

        // Handle file drop
        dropZone.on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
            
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        });

        // Handle file input change
        fileInput.on('change', function(e) {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });

        // Click to browse
        dropZone.on('click', function() {
            fileInput.click();
        });
    }

    function initializeEventHandlers() {
        // Quality slider
        $('#quality').on('input', function() {
            $('#qualityValue').text($(this).val());
        });

        // Preset selection
        $('#presetSelect').on('change', function() {
            const selectedPreset = $(this).val();
            if (selectedPreset) {
                const preset = JSON.parse(selectedPreset);
                $('#cropWidth').val(preset.width);
                $('#cropHeight').val(preset.height);
                $('#unitSelect').val(preset.unit);
                updateCropperFromInputs();
            }
        });

        // Dimension inputs
        $('#cropWidth, #cropHeight').on('input', function() {
            if ($('#lockAspectRatio').is(':checked')) {
                maintainAspectRatio($(this).attr('id'));
            }
            updateCropperFromInputs();
        });

        // Unit change
        $('#unitSelect').on('change', function() {
            updateCropperFromInputs();
        });

        // Transform buttons
        $('#rotateLeft').on('click', function() {
            if (cropper) {
                cropper.rotate(-90);
                saveCropState();
            }
        });

        $('#rotateRight').on('click', function() {
            if (cropper) {
                cropper.rotate(90);
                saveCropState();
            }
        });

        $('#flipHorizontal').on('click', function() {
            if (cropper) {
                const imageData = cropper.getImageData();
                cropper.scaleX(imageData.scaleX === 1 ? -1 : 1);
                saveCropState();
            }
        });

        $('#flipVertical').on('click', function() {
            if (cropper) {
                const imageData = cropper.getImageData();
                cropper.scaleY(imageData.scaleY === 1 ? -1 : 1);
                saveCropState();
            }
        });

        // Action buttons
        $('#cropButton').on('click', cropImage);
        $('#resetButton').on('click', resetCropper);
        $('#newImageButton').on('click', newImage);
        $('#downloadButton').on('click', downloadImage);

        // Lock aspect ratio
        $('#lockAspectRatio').on('change', function() {
            if (cropper) {
                const aspectRatio = $(this).is(':checked') ? 
                    parseFloat($('#cropWidth').val()) / parseFloat($('#cropHeight').val()) : NaN;
                cropper.setAspectRatio(aspectRatio);
            }
        });
    }

    function handleFileSelection(file) {
        // Validate file
        if (!validateFile(file)) {
            return;
        }

        // Show upload progress
        showUploadProgress();

        // Create FormData
        const formData = new FormData();
        formData.append('ImageFile', file);

        // Upload file
        $.ajax({
            url: '/api/image/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        updateUploadProgress(percentComplete);
                    }
                }, false);
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    currentImagePath = response.imagePath;
                    currentImageInfo = response.imageInfo;
                    initializeCropper(response.imagePath);
                    updateImageInfo(response.imageInfo);
                    hideUploadProgress();
                    showCroppingSection();
                } else {
                    showError('Upload failed: ' + response.message);
                    hideUploadProgress();
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showError('Upload failed: ' + (response?.message || 'Unknown error'));
                hideUploadProgress();
            }
        });
    }

    function validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            showError('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
            return false;
        }

        if (file.size > maxSize) {
            showError('File size exceeds 10MB limit.');
            return false;
        }

        return true;
    }

    function initializeCropper(imagePath) {
        const image = $('#cropImage');
        
        // Destroy existing cropper
        if (cropper) {
            cropper.destroy();
        }

        // Set image source
        image.attr('src', imagePath);

        // Initialize cropper
        image.on('load', function() {
            cropper = new Cropper(this, {
                viewMode: 1,
                dragMode: 'move',
                aspectRatio: NaN,
                autoCrop: true,
                autoCropArea: 0.8,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                ready: function() {
                    updateInputsFromCropper();
                    saveCropState();
                },
                cropend: function() {
                    updateInputsFromCropper();
                    saveCropState();
                }
            });
        });
    }

    function updateInputsFromCropper() {
        if (!cropper) return;

        const cropBoxData = cropper.getCropBoxData();
        const unit = $('#unitSelect').val();
        const dpi = parseInt($('#dpiInput').val()) || 96;

        const width = convertFromPixels(Math.round(cropBoxData.width), unit, dpi);
        const height = convertFromPixels(Math.round(cropBoxData.height), unit, dpi);

        $('#cropWidth').val(width);
        $('#cropHeight').val(height);
    }

    function updateCropperFromInputs() {
        if (!cropper) return;

        const width = parseFloat($('#cropWidth').val());
        const height = parseFloat($('#cropHeight').val());
        const unit = $('#unitSelect').val();
        const dpi = parseInt($('#dpiInput').val()) || 96;

        if (width && height) {
            const pixelWidth = convertToPixels(width, unit, dpi);
            const pixelHeight = convertToPixels(height, unit, dpi);

            const cropBoxData = cropper.getCropBoxData();
            cropper.setCropBoxData({
                left: cropBoxData.left,
                top: cropBoxData.top,
                width: pixelWidth,
                height: pixelHeight
            });
        }
    }

    function maintainAspectRatio(changedField) {
        const width = parseFloat($('#cropWidth').val());
        const height = parseFloat($('#cropHeight').val());

        if (!width || !height) return;

        const currentAspectRatio = width / height;

        if (changedField === 'cropWidth') {
            $('#cropHeight').val(Math.round(width / currentAspectRatio));
        } else {
            $('#cropWidth').val(Math.round(height * currentAspectRatio));
        }
    }

    function convertToPixels(value, unit, dpi) {
        switch (unit) {
            case 'px': return value;
            case 'mm': return Math.round(value * dpi / 25.4);
            case 'cm': return Math.round(value * 10 * dpi / 25.4);
            case 'in': return Math.round(value * dpi);
            default: return value;
        }
    }

    function convertFromPixels(pixels, unit, dpi) {
        switch (unit) {
            case 'px': return pixels;
            case 'mm': return Math.round(pixels * 25.4 / dpi);
            case 'cm': return Math.round(pixels * 2.54 / dpi);
            case 'in': return Math.round(pixels / dpi * 100) / 100;
            default: return pixels;
        }
    }

    function cropImage() {
        if (!cropper) return;

        const cropData = cropper.getData();
        const unit = $('#unitSelect').val();
        const dpi = parseInt($('#dpiInput').val()) || 96;
        const outputFormat = $('#outputFormat').val();
        const quality = parseInt($('#quality').val());

        const cropRequest = {
            imagePath: currentImagePath,
            x: Math.round(cropData.x),
            y: Math.round(cropData.y),
            width: convertFromPixels(Math.round(cropData.width), unit, dpi),
            height: convertFromPixels(Math.round(cropData.height), unit, dpi),
            unit: unit,
            dpi: dpi,
            outputFormat: outputFormat,
            quality: quality,
            maintainAspectRatio: $('#lockAspectRatio').is(':checked'),
            rotation: Math.round(cropData.rotate || 0),
            flipHorizontal: cropData.scaleX < 0,
            flipVertical: cropData.scaleY < 0
        };

        // Show loading
        $('#cropButton').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Processing...');

        $.ajax({
            url: '/api/image/crop',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(cropRequest),
            success: function(response) {
                if (response.success) {
                    showPreview(response.imagePath, response.imageInfo);
                } else {
                    showError('Crop failed: ' + response.message);
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                showError('Crop failed: ' + (response?.message || 'Unknown error'));
            },
            complete: function() {
                $('#cropButton').prop('disabled', false).html('<i class="fas fa-crop me-2"></i>Crop Image');
            }
        });
    }

    function showPreview(imagePath, imageInfo) {
        $('#previewImage').attr('src', imagePath);
        $('#downloadFileName').val('cropped_image.' + $('#outputFormat').val());
        
        const sizeKB = Math.round(imageInfo.size / 1024);
        $('#previewInfo').html(`
            <div>Dimensions: ${imageInfo.width} × ${imageInfo.height} px</div>
            <div>Format: ${imageInfo.format}</div>
            <div>Size: ${sizeKB} KB</div>
        `);

        $('#previewSection').show();
        $('html, body').animate({
            scrollTop: $('#previewSection').offset().top
        }, 500);

        // Store cropped image path for download
        $('#downloadButton').data('imagePath', imagePath);
    }

    function downloadImage() {
        const imagePath = $('#downloadButton').data('imagePath');
        const fileName = $('#downloadFileName').val() || 'cropped_image.jpg';
        
        if (imagePath) {
            const downloadUrl = `/api/image/download?imagePath=${encodeURIComponent(imagePath)}&fileName=${encodeURIComponent(fileName)}`;
            window.open(downloadUrl, '_blank');
        }
    }

    function resetCropper() {
        if (cropper) {
            cropper.reset();
            updateInputsFromCropper();
            $('#previewSection').hide();
            saveCropState();
        }
    }

    function newImage() {
        // Reset everything
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        
        currentImagePath = '';
        currentImageInfo = null;
        cropHistory = [];
        currentHistoryIndex = -1;
        
        $('#croppingSection').hide();
        $('#previewSection').hide();
        $('#uploadSection').show();
        $('#fileInput').val('');
        
        $('html, body').animate({
            scrollTop: 0
        }, 500);
    }

    function saveCropState() {
        if (!cropper) return;
        
        const state = {
            cropData: cropper.getData(),
            cropBoxData: cropper.getCropBoxData()
        };
        
        // Remove future history if we're not at the end
        if (currentHistoryIndex < cropHistory.length - 1) {
            cropHistory = cropHistory.slice(0, currentHistoryIndex + 1);
        }
        
        cropHistory.push(state);
        currentHistoryIndex = cropHistory.length - 1;
        
        // Limit history size
        if (cropHistory.length > 20) {
            cropHistory.shift();
            currentHistoryIndex--;
        }
    }

    function loadPresets() {
        $.ajax({
            url: '/api/image/presets',
            type: 'GET',
            success: function(presets) {
                const select = $('#presetSelect');
                presets.forEach(function(preset) {
                    const option = $('<option></option>')
                        .attr('value', JSON.stringify(preset))
                        .text(`${preset.name} (${preset.width}×${preset.height} ${preset.unit})`);
                    select.append(option);
                });
            },
            error: function() {
                console.warn('Failed to load presets');
            }
        });
    }

    function updateImageInfo(imageInfo) {
        const sizeKB = Math.round(imageInfo.size / 1024);
        $('#imageDimensions').text(`${imageInfo.width} × ${imageInfo.height} px`);
        $('#imageFormat').text(imageInfo.format);
        $('#imageSize').text(`${sizeKB} KB`);
    }

    function showUploadProgress() {
        $('#uploadProgress').show();
        $('.progress-bar').css('width', '0%');
        $('#uploadStatus').text('Uploading...');
    }

    function updateUploadProgress(percent) {
        $('.progress-bar').css('width', percent + '%');
        $('#uploadStatus').text(`Uploading... ${Math.round(percent)}%`);
    }

    function hideUploadProgress() {
        $('#uploadProgress').hide();
    }

    function showCroppingSection() {
        $('#uploadSection').hide();
        $('#croppingSection').show();
        $('#previewSection').hide();
    }

    function showError(message) {
        // Create or update error alert
        let errorAlert = $('#errorAlert');
        if (errorAlert.length === 0) {
            errorAlert = $(`
                <div id="errorAlert" class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <span id="errorMessage"></span>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
            $('.container-fluid').prepend(errorAlert);
        }
        
        $('#errorMessage').text(message);
        errorAlert.show();
        
        // Auto-hide after 5 seconds
        setTimeout(function() {
            errorAlert.alert('close');
        }, 5000);
        
        // Scroll to top to show error
        $('html, body').animate({ scrollTop: 0 }, 300);
    }

    // Keyboard shortcuts
    $(document).on('keydown', function(e) {
        if (!cropper) return;
        
        // Ctrl+Z for undo (simplified)
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            resetCropper();
        }
        
        // Arrow keys for fine adjustment
        if (e.target.tagName.toLowerCase() !== 'input') {
            const step = e.shiftKey ? 10 : 1;
            const cropBoxData = cropper.getCropBoxData();
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    cropper.setCropBoxData({ top: cropBoxData.top - step });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    cropper.setCropBoxData({ top: cropBoxData.top + step });
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    cropper.setCropBoxData({ left: cropBoxData.left - step });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    cropper.setCropBoxData({ left: cropBoxData.left + step });
                    break;
            }
        }
    });
});