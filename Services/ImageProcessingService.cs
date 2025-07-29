using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using ImageCropperPro.Models;

namespace ImageCropperPro.Services
{
    public class ImageProcessingService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ImageProcessingService> _logger;

        public ImageProcessingService(IWebHostEnvironment environment, ILogger<ImageProcessingService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> SaveUploadedImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Invalid file");

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType?.ToLower()))
                throw new ArgumentException("Unsupported file type");

            // Validate file size (10MB max)
            if (file.Length > 10 * 1024 * 1024)
                throw new ArgumentException("File size exceeds 10MB limit");

            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{fileName}";
        }

        public async Task<Models.ImageInfo> GetImageInfoAsync(string imagePath)
        {
            var fullPath = Path.Combine(_environment.WebRootPath, imagePath.TrimStart('/'));
            
            using var image = await Image.LoadAsync(fullPath);
            var fileInfo = new FileInfo(fullPath);

            return new Models.ImageInfo
            {
                Path = imagePath,
                Width = image.Width,
                Height = image.Height,
                Format = image.Metadata.DecodedImageFormat?.Name ?? "Unknown",
                Size = fileInfo.Length
            };
        }

        public async Task<string> CropImageAsync(CropRequest request)
        {
            var inputPath = Path.Combine(_environment.WebRootPath, request.ImagePath.TrimStart('/'));
            
            // Convert dimensions from specified unit to pixels
            var cropWidth = ConvertToPixels(request.Width, request.Unit, request.DPI);
            var cropHeight = ConvertToPixels(request.Height, request.Unit, request.DPI);

            using var image = await Image.LoadAsync(inputPath);

            // Apply transformations
            image.Mutate(x =>
            {
                // Rotate if needed
                if (request.Rotation != 0)
                {
                    x.Rotate(request.Rotation);
                }

                // Flip if needed
                if (request.FlipHorizontal)
                {
                    x.Flip(FlipMode.Horizontal);
                }

                if (request.FlipVertical)
                {
                    x.Flip(FlipMode.Vertical);
                }

                // Crop the image
                x.Crop(new Rectangle(request.X, request.Y, cropWidth, cropHeight));
            });

            // Generate output filename
            var outputFileName = $"cropped_{Guid.NewGuid()}.{request.OutputFormat.ToLower()}";
            var outputPath = Path.Combine(_environment.WebRootPath, "uploads", outputFileName);

            // Save with appropriate format and quality
            switch (request.OutputFormat.ToLower())
            {
                case "jpeg":
                case "jpg":
                    await image.SaveAsJpegAsync(outputPath, new JpegEncoder { Quality = request.Quality });
                    break;
                case "png":
                    await image.SaveAsPngAsync(outputPath);
                    break;
                case "webp":
                    await image.SaveAsWebpAsync(outputPath, new WebpEncoder { Quality = request.Quality });
                    break;
                default:
                    await image.SaveAsJpegAsync(outputPath, new JpegEncoder { Quality = request.Quality });
                    break;
            }

            return $"/uploads/{outputFileName}";
        }

        public List<CropPreset> GetCropPresets()
        {
            return new List<CropPreset>
            {
                new CropPreset { Name = "A4 Paper", Width = 210, Height = 297, Unit = "mm", Description = "Standard A4 paper size" },
                new CropPreset { Name = "Letter Paper", Width = 8, Height = 11, Unit = "in", Description = "US Letter paper size" },
                new CropPreset { Name = "Instagram Square", Width = 1080, Height = 1080, Unit = "px", Description = "Instagram square post" },
                new CropPreset { Name = "Instagram Story", Width = 1080, Height = 1920, Unit = "px", Description = "Instagram story format" },
                new CropPreset { Name = "Facebook Cover", Width = 1200, Height = 630, Unit = "px", Description = "Facebook cover photo" },
                new CropPreset { Name = "Twitter Header", Width = 1500, Height = 500, Unit = "px", Description = "Twitter header image" },
                new CropPreset { Name = "YouTube Thumbnail", Width = 1280, Height = 720, Unit = "px", Description = "YouTube video thumbnail" },
                new CropPreset { Name = "Business Card", Width = 89, Height = 51, Unit = "mm", Description = "Standard business card" },
                new CropPreset { Name = "Passport Photo", Width = 35, Height = 45, Unit = "mm", Description = "Standard passport photo" }
            };
        }

        private int ConvertToPixels(int value, string unit, int dpi)
        {
            return unit.ToLower() switch
            {
                "px" => value,
                "mm" => (int)(value * dpi / 25.4),
                "cm" => (int)(value * 10 * dpi / 25.4),
                "in" => value * dpi,
                _ => value
            };
        }

        public void CleanupTempFiles()
        {
            try
            {
                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsPath)) return;

                var files = Directory.GetFiles(uploadsPath);
                var cutoffTime = DateTime.Now.AddHours(-24);

                foreach (var file in files)
                {
                    var fileInfo = new FileInfo(file);
                    if (fileInfo.CreationTime < cutoffTime)
                    {
                        File.Delete(file);
                        _logger.LogInformation($"Deleted old temp file: {file}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up temp files");
            }
        }
    }
}