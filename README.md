# ImageCropperPro

A professional web-based image cropping tool built with ASP.NET Core and modern web technologies. Features drag-and-drop upload, visual cropping with multiple unit support, and various output formats.

## Features

### Core Functionality
- **Drag & Drop Upload**: Intuitive file upload with drag-and-drop support
- **Visual Cropping**: Interactive cropping interface using CropperJS
- **Multiple Units**: Support for pixels (px), millimeters (mm), centimeters (cm), and inches (in)
- **Aspect Ratio Lock**: Maintain proportions during cropping
- **Image Transformations**: Rotate and flip images before cropping

### Preset Templates
- A4 Paper (210×297 mm)
- Letter Paper (8×11 in)
- Instagram Square (1080×1080 px)
- Instagram Story (1080×1920 px)
- Facebook Cover (1200×630 px)
- Twitter Header (1500×500 px)
- YouTube Thumbnail (1280×720 px)
- Business Card (89×51 mm)
- Passport Photo (35×45 mm)

### Output Options
- **Multiple Formats**: JPEG, PNG, WebP
- **Quality Control**: Adjustable compression for JPEG/WebP
- **Custom Filenames**: Specify download filename
- **Instant Preview**: Preview before download

### Technical Features
- **File Validation**: Type and size validation (10MB max)
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Cross-browser Support**: Chrome, Firefox, Edge, Safari
- **Accessibility**: Keyboard navigation and screen reader support
- **Auto Cleanup**: Temporary files deleted after 24 hours

## Technology Stack

- **Backend**: ASP.NET Core 8.0 (C#)
- **Frontend**: HTML5, CSS3, JavaScript with jQuery
- **Image Processing**: ImageSharp library
- **UI Framework**: Bootstrap 5
- **Cropping Library**: CropperJS
- **Icons**: Font Awesome

## Requirements

- .NET 8.0 or later
- Modern web browser with JavaScript enabled

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ImageCropperPro
   ```

2. **Restore NuGet packages**:
   ```bash
   dotnet restore
   ```

3. **Build the project**:
   ```bash
   dotnet build
   ```

4. **Run the application**:
   ```bash
   dotnet run
   ```

5. **Access the application**:
   Open your browser and navigate to `https://localhost:5001` or `http://localhost:5000`

## Project Structure

```
ImageCropperPro/
├── Controllers/
│   ├── HomeController.cs          # Main page controller
│   └── ImageController.cs         # API endpoints for image operations
├── Models/
│   ├── ImageUploadModel.cs        # Upload model
│   ├── CropRequest.cs            # Crop operation model
│   ├── ImageInfo.cs              # Image metadata model
│   ├── CropPreset.cs             # Preset template model
│   └── ErrorViewModel.cs         # Error page model
├── Services/
│   └── ImageProcessingService.cs  # Core image processing logic
├── Views/
│   ├── Home/
│   │   ├── Index.cshtml          # Main application page
│   │   └── Privacy.cshtml        # Privacy policy page
│   ├── Shared/
│   │   ├── _Layout.cshtml        # Main layout template
│   │   └── Error.cshtml          # Error page template
│   ├── _ViewStart.cshtml         # View configuration
│   └── _ViewImports.cshtml       # Global imports
├── wwwroot/
│   ├── css/
│   │   └── site.css              # Custom styles
│   ├── js/
│   │   └── imagecropper.js       # Main JavaScript functionality
│   └── uploads/                  # Temporary upload directory
├── Program.cs                    # Application entry point
├── ImageCropperPro.csproj       # Project configuration
└── README.md                    # This file
```

## API Endpoints

### POST /api/image/upload
Upload an image file.

**Request**: Form data with `ImageFile`
**Response**: 
```json
{
  "success": true,
  "imagePath": "/uploads/image.jpg",
  "imageInfo": {
    "width": 1920,
    "height": 1080,
    "format": "JPEG",
    "size": 245760
  },
  "message": "Image uploaded successfully"
}
```

### POST /api/image/crop
Crop an uploaded image.

**Request**:
```json
{
  "imagePath": "/uploads/image.jpg",
  "x": 100,
  "y": 100,
  "width": 500,
  "height": 300,
  "unit": "px",
  "dpi": 96,
  "outputFormat": "jpeg",
  "quality": 85,
  "maintainAspectRatio": false,
  "rotation": 0,
  "flipHorizontal": false,
  "flipVertical": false
}
```

### GET /api/image/presets
Get available crop presets.

### GET /api/image/download
Download a processed image.

### DELETE /api/image/cleanup
Clean up temporary files (admin function).

## Usage Guide

1. **Upload Image**: 
   - Drag and drop an image onto the upload area, or
   - Click "Browse Files" to select an image

2. **Crop Image**:
   - Use the visual cropping tool to select the desired area
   - Adjust dimensions manually using the input fields
   - Choose units (pixels, mm, cm, inches)
   - Select a preset template if desired
   - Lock aspect ratio if needed

3. **Transform Image** (optional):
   - Rotate left/right by 90 degrees
   - Flip horizontally or vertically

4. **Configure Output**:
   - Choose output format (JPEG, PNG, WebP)
   - Adjust quality for lossy formats
   - Set custom filename

5. **Download**:
   - Click "Crop Image" to process
   - Preview the result
   - Download the final image

## Browser Support

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Security Features

- File type validation (JPEG, PNG, GIF, WebP only)
- File size limits (10MB maximum)
- Automatic cleanup of temporary files
- No permanent storage of user images
- Server-side validation for all operations

## Performance

- Optimized for images up to 10MB
- Load time < 2 seconds for typical images
- Responsive design for all screen sizes
- Efficient memory usage with automatic cleanup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.

## Changelog

### Version 1.0.0
- Initial release
- Core cropping functionality
- Drag & drop upload
- Multiple unit support
- Preset templates
- Responsive design
- Cross-browser compatibility