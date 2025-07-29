$(function () {
    var cropper = null;
    var cropBoxData = null;
    var canvasData = null;
    var actionStack = [];
    var redoStack = [];
    var originalImageURL = '';
    var aspectRatioLocked = true;
    var lastAspectRatio = 1;
    var presetSizes = {
        a4: { width: 210, height: 297, unit: 'mm' },
        banner: { width: 820, height: 312, unit: 'px' }
    };

    function showError(msg) {
        $('#upload-error').text(msg);
    }
    function clearError() {
        $('#upload-error').text('');
    }
    function toPx(val, unit, dpi) {
        if (unit === 'px') return val;
        if (!dpi) dpi = 96;
        switch (unit) {
            case 'mm': return val * dpi / 25.4;
            case 'cm': return val * dpi / 2.54;
            case 'in': return val * dpi;
            default: return val;
        }
    }
    function fromPx(val, unit, dpi) {
        if (unit === 'px') return val;
        if (!dpi) dpi = 96;
        switch (unit) {
            case 'mm': return val * 25.4 / dpi;
            case 'cm': return val * 2.54 / dpi;
            case 'in': return val / dpi;
            default: return val;
        }
    }
    function updateCropInputs() {
        if (!cropper) return;
        var data = cropper.getData(true);
        var unit = $('#unit-select').val();
        var dpi = 96;
        $('#crop-width').val(Math.round(fromPx(data.width, unit, dpi)));
        $('#crop-height').val(Math.round(fromPx(data.height, unit, dpi)));
    }
    function pushAction() {
        if (!cropper) return;
        actionStack.push({
            cropBoxData: cropper.getCropBoxData(),
            canvasData: cropper.getCanvasData(),
            data: cropper.getData()
        });
        redoStack = [];
    }
    function popAction(stack) {
        if (!cropper || stack.length === 0) return;
        var state = stack.pop();
        cropper.setCropBoxData(state.cropBoxData);
        cropper.setCanvasData(state.canvasData);
        cropper.setData(state.data);
    }
    // Drag & Drop
    $('#upload-area').on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragover');
    });
    $('#upload-area').on('dragleave drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragover');
    });
    $('#upload-area').on('drop', function (e) {
        var files = e.originalEvent.dataTransfer.files;
        handleFiles(files);
    });
    $('#file-input').on('change', function (e) {
        handleFiles(this.files);
    });
    $('#upload-area').on('click', function () {
        $('#file-input').trigger('click');
    });
    function handleFiles(files) {
        clearError();
        if (!files || files.length === 0) return;
        var file = files[0];
        if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
            showError('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showError('File too large. Max 10MB allowed.');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            $('#preview').attr('src', e.target.result);
            $('#preview-container').show();
            $('#cropped-preview-container').hide();
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(document.getElementById('preview'), {
                viewMode: 1,
                autoCropArea: 1,
                aspectRatio: NaN,
                ready: function () {
                    updateCropInputs();
                    pushAction();
                },
                crop: function () {
                    updateCropInputs();
                }
            });
            $('#cropper-controls').show();
            originalImageURL = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    // Crop & Preview
    $('#crop-btn').on('click', function () {
        if (!cropper) return;
        var canvas = cropper.getCroppedCanvas();
        $('#cropped-preview').attr('src', canvas.toDataURL());
        $('#cropped-preview-container').show();
    });
    // Manual input
    $('#crop-width, #crop-height, #unit-select').on('input change', function () {
        if (!cropper) return;
        var unit = $('#unit-select').val();
        var w = parseFloat($('#crop-width').val());
        var h = parseFloat($('#crop-height').val());
        var dpi = 96;
        if (w > 0 && h > 0) {
            var pxW = toPx(w, unit, dpi);
            var pxH = toPx(h, unit, dpi);
            cropper.setData({ width: pxW, height: pxH });
            pushAction();
        }
    });
    $('#lock-aspect').on('change', function () {
        aspectRatioLocked = this.checked;
        if (cropper) {
            var data = cropper.getData();
            var ratio = data.width / data.height;
            cropper.setAspectRatio(aspectRatioLocked ? ratio : NaN);
        }
    });
    // Presets
    $('#preset-select').on('change', function () {
        var val = $(this).val();
        if (presetSizes[val]) {
            var preset = presetSizes[val];
            $('#unit-select').val(preset.unit).trigger('change');
            $('#crop-width').val(preset.width);
            $('#crop-height').val(preset.height);
            $('#crop-width, #crop-height').trigger('input');
        }
    });
    // Undo/Redo
    $('#undo-btn').on('click', function () {
        if (actionStack.length > 1) {
            redoStack.push(actionStack.pop());
            popAction(actionStack);
        }
    });
    $('#redo-btn').on('click', function () {
        if (redoStack.length > 0) {
            actionStack.push(redoStack[redoStack.length - 1]);
            popAction(redoStack);
        }
    });
    // Rotate/Flip
    $('#rotate-btn').on('click', function () {
        if (cropper) {
            cropper.rotate(90);
            pushAction();
        }
    });
    $('#flip-btn').on('click', function () {
        if (cropper) {
            cropper.scaleX(-cropper.getData().scaleX || -1);
            pushAction();
        }
    });
    // Download
    $('#download-btn').on('click', function () {
        if (!cropper) return;
        var format = $('#output-format').val();
        var quality = parseFloat($('#output-quality').val());
        var canvas = cropper.getCroppedCanvas();
        var mimeType = 'image/' + (format === 'jpeg' ? 'jpeg' : format);
        var dataUrl = canvas.toDataURL(mimeType, quality);
        var a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'cropped-image.' + format;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});