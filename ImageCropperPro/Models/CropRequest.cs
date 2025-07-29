namespace ImageCropperPro.Models;

public class CropRequest
{
    public required string TempFileName { get; set; }
    public int X { get; set; }
    public int Y { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string Unit { get; set; } = "px"; // px, mm, cm, in
    public string OutputFormat { get; set; } = "jpeg"; // jpeg, png, webp
}