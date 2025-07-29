using ImageCropperPro.Models;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace ImageCropperPro.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ImageController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly HashSet<string> AllowedExtensions = new() { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public ImageController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");
        if (file.Length > MaxFileSize)
            return BadRequest("File too large. Max 10MB");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest("Unsupported file type");

        var tempDir = Path.Combine(_env.WebRootPath, "temp");
        if (!Directory.Exists(tempDir))
            Directory.CreateDirectory(tempDir);

        var tempFileName = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine(tempDir, tempFileName);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);

        return Ok(new { tempFileName });
    }

    [HttpPost("crop")]
    public async Task<IActionResult> Crop([FromBody] CropRequest request)
    {
        var tempDir = Path.Combine(_env.WebRootPath, "temp");
        var sourcePath = Path.Combine(tempDir, request.TempFileName);
        if (!System.IO.File.Exists(sourcePath))
            return NotFound();

        await using var imageStream = System.IO.File.OpenRead(sourcePath);
        using Image<Rgba32> image = await Image.LoadAsync<Rgba32>(imageStream);

        // Assume units already converted to pixels on client-side
        var cropRectangle = new Rectangle(request.X, request.Y, request.Width, request.Height);
        image.Mutate(i => i.Crop(cropRectangle));

        IImageEncoder encoder = request.OutputFormat.ToLower() switch
        {
            "png" => new PngEncoder(),
            "webp" => new WebpEncoder(),
            _ => new JpegEncoder { Quality = 90 }
        };

        var outputExt = request.OutputFormat.ToLower() == "png" ? ".png" : request.OutputFormat.ToLower() == "webp" ? ".webp" : ".jpg";
        var fileName = $"crop_{Path.GetFileNameWithoutExtension(request.TempFileName)}{outputExt}";
        var outputStream = new MemoryStream();
        await image.SaveAsync(outputStream, encoder);
        outputStream.Position = 0;
        var mime = request.OutputFormat.ToLower() switch
        {
            "png" => "image/png",
            "webp" => "image/webp",
            _ => "image/jpeg"
        };
        return File(outputStream, mime, fileName);
    }
}