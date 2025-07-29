using System.ComponentModel.DataAnnotations;

namespace ImageCropperPro.Models
{
    public class ImageUploadModel
    {
        [Required]
        public IFormFile ImageFile { get; set; } = null!;
        
        public string? FileName { get; set; }
        public long FileSize { get; set; }
        public string? ContentType { get; set; }
    }

    public class CropRequest
    {
        public string ImagePath { get; set; } = string.Empty;
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string Unit { get; set; } = "px"; // px, mm, cm, in
        public int DPI { get; set; } = 96; // For unit conversion
        public string OutputFormat { get; set; } = "jpeg"; // jpeg, png, webp
        public int Quality { get; set; } = 85; // For JPEG/WEBP
        public bool MaintainAspectRatio { get; set; }
        public int Rotation { get; set; } = 0; // 0, 90, 180, 270
        public bool FlipHorizontal { get; set; }
        public bool FlipVertical { get; set; }
    }

    public class ImageInfo
    {
        public string Path { get; set; } = string.Empty;
        public int Width { get; set; }
        public int Height { get; set; }
        public string Format { get; set; } = string.Empty;
        public long Size { get; set; }
    }

    public class CropPreset
    {
        public string Name { get; set; } = string.Empty;
        public int Width { get; set; }
        public int Height { get; set; }
        public string Unit { get; set; } = "px";
        public string Description { get; set; } = string.Empty;
    }
}