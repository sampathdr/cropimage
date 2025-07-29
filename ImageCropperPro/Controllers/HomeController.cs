using Microsoft.AspNetCore.Mvc;

namespace ImageCropperPro.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}