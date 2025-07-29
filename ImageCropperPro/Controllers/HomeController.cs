using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ImageCropperPro.Models;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using System.IO;
using System.Threading.Tasks;

namespace ImageCropperPro.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File too large. Max 10MB allowed.");
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest("Invalid file type.");
        // TODO: Anti-malware scan here
        var tempPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/temp");
        if (!Directory.Exists(tempPath))
            Directory.CreateDirectory(tempPath);
        var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(tempPath, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        return Json(new { success = true, file = "/temp/" + fileName });
    }

    [HttpPost]
    public async Task<IActionResult> Crop([FromForm] string file, [FromForm] int x, [FromForm] int y, [FromForm] int width, [FromForm] int height, [FromForm] string format, [FromForm] float quality)
    {
        if (string.IsNullOrEmpty(file))
            return BadRequest("No file specified.");
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", file.TrimStart('/'));
        if (!System.IO.File.Exists(filePath))
            return NotFound();
        using var image = await Image.LoadAsync(filePath);
        image.Mutate(ctx => ctx.Crop(new Rectangle(x, y, width, height)));
        IImageEncoder encoder = format switch
        {
            "jpeg" => new JpegEncoder { Quality = (int)(quality * 100) },
            "png" => new PngEncoder(),
            "webp" => new WebpEncoder { Quality = (int)(quality * 100) },
            _ => new JpegEncoder { Quality = (int)(quality * 100) }
        };
        using var ms = new MemoryStream();
        await image.SaveAsync(ms, encoder);
        ms.Position = 0;
        var contentType = format switch
        {
            "jpeg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            _ => "image/jpeg"
        };
        return File(ms.ToArray(), contentType, $"cropped-image.{format}");
    }
}
