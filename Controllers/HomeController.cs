using Microsoft.AspNetCore.Mvc;
using ImageCropperPro.Models;
using ImageCropperPro.Services;

namespace ImageCropperPro.Controllers
{
    public class HomeController : Controller
    {
        private readonly ImageProcessingService _imageProcessingService;
        private readonly ILogger<HomeController> _logger;

        public HomeController(ImageProcessingService imageProcessingService, ILogger<HomeController> logger)
        {
            _imageProcessingService = imageProcessingService;
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
            return View();
        }
    }
}