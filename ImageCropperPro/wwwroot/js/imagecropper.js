$(function () {
    const dropZone = $('#drop-zone');
    const fileInput = $('#file-input');
    const cropContainer = $('#crop-container');
    const imagePreview = $('#image-preview');
    let cropper;
    let tempFileName;

    function showAlert(message, type = 'danger') {
        const alert = $(`<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`);
        $('.container').prepend(alert);
    }

    dropZone.on('click', function () {
        fileInput.trigger('click');
    });

    dropZone.on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('bg-light');
    });

    dropZone.on('dragleave dragend drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('bg-light');
    });

    dropZone.on('drop', function (e) {
        const files = e.originalEvent.dataTransfer.files;
        if (files && files.length) {
            uploadFile(files[0]);
        }
    });

    fileInput.on('change', function () {
        if (this.files && this.files.length) {
            uploadFile(this.files[0]);
        }
    });

    function uploadFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            showAlert('File too large. Max 10MB');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        $.ajax({
            url: '/api/image/upload',
            method: 'POST',
            processData: false,
            contentType: false,
            data: formData,
            success: function (resp) {
                tempFileName = resp.tempFileName;
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.attr('src', e.target.result);
                    cropContainer.show();
                    if (cropper) {
                        cropper.destroy();
                    }
                    cropper = new Cropper(imagePreview[0], {
                        viewMode: 1,
                        autoCropArea: 1,
                    });
                };
                reader.readAsDataURL(file);
            },
            error: function (xhr) {
                showAlert(xhr.responseText || 'Upload failed');
            }
        });
    }

    $('#download-btn').on('click', function () {
        if (!cropper) return;
        const unit = $('#unit-select').val();
        const cropData = cropper.getData(true); // get rounded values
        const payload = {
            tempFileName: tempFileName,
            x: Math.round(cropData.x),
            y: Math.round(cropData.y),
            width: Math.round(cropData.width),
            height: Math.round(cropData.height),
            unit: unit,
            outputFormat: 'jpeg'
        };
        $.ajax({
            url: '/api/image/crop',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            xhrFields: {
                responseType: 'blob'
            },
            success: function (blob, status, xhr) {
                const disposition = xhr.getResponseHeader('Content-Disposition');
                let fileName = 'cropped-image.jpg';
                if (disposition && disposition.indexOf('filename=') !== -1) {
                    fileName = disposition.split('filename=')[1].replaceAll('"', '');
                }
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            },
            error: function (xhr) {
                showAlert('Crop failed');
            }
        });
    });
});