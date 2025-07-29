using Microsoft.AspNetCore.Mvc;
using ImageCropperPro.Models;
using ImageCropperPro.Services;

namespace ImageCropperPro.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly ImageProcessingService _imageProcessingService;
        private readonly ILogger<ImageController> _logger;

        public ImageController(ImageProcessingService imageProcessingService, ILogger<ImageController> logger)
        {
            _imageProcessingService = imageProcessingService;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] ImageUploadModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var imagePath = await _imageProcessingService.SaveUploadedImageAsync(model.ImageFile);
                var imageInfo = await _imageProcessingService.GetImageInfoAsync(imagePath);

                return Ok(new { 
                    success = true, 
                    imagePath = imagePath,
                    imageInfo = imageInfo,
                    message = "Image uploaded successfully" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("info")]
        public async Task<IActionResult> GetImageInfo([FromQuery] string imagePath)
        {
            try
            {
                var imageInfo = await _imageProcessingService.GetImageInfoAsync(imagePath);
                return Ok(imageInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting image info");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("crop")]
        public async Task<IActionResult> Crop([FromBody] CropRequest request)
        {
            try
            {
                var croppedImagePath = await _imageProcessingService.CropImageAsync(request);
                var imageInfo = await _imageProcessingService.GetImageInfoAsync(croppedImagePath);

                return Ok(new { 
                    success = true, 
                    imagePath = croppedImagePath,
                    imageInfo = imageInfo,
                    message = "Image cropped successfully" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cropping image");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("presets")]
        public IActionResult GetPresets()
        {
            try
            {
                var presets = _imageProcessingService.GetCropPresets();
                return Ok(presets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting presets");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("download")]
        public IActionResult Download([FromQuery] string imagePath, [FromQuery] string? fileName = null)
        {
            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", imagePath.TrimStart('/'));
                
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound("Image not found");
                }

                var fileBytes = System.IO.File.ReadAllBytes(fullPath);
                var contentType = GetContentType(Path.GetExtension(fullPath));
                var downloadFileName = fileName ?? Path.GetFileName(fullPath);

                return File(fileBytes, contentType, downloadFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading image");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("cleanup")]
        public IActionResult CleanupTempFiles()
        {
            try
            {
                _imageProcessingService.CleanupTempFiles();
                return Ok(new { success = true, message = "Cleanup completed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cleanup");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private string GetContentType(string extension)
        {
            return extension.ToLower() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }
    }
}