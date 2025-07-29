# ImageCropperPro Deployment Guide

## Quick Start

### Prerequisites
- .NET 8.0 SDK or later
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Development Setup

1. **Clone and Navigate**:
   ```bash
   git clone <repository-url>
   cd ImageCropperPro
   ```

2. **Restore Dependencies**:
   ```bash
   dotnet restore
   ```

3. **Build Project**:
   ```bash
   dotnet build
   ```

4. **Run Application**:
   ```bash
   dotnet run
   ```

5. **Access Application**:
   - Open browser to `https://localhost:5001` or `http://localhost:5000`

## Production Deployment

### IIS Deployment (Windows)

1. **Publish Application**:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. **Configure IIS**:
   - Install ASP.NET Core Hosting Bundle
   - Create new website in IIS Manager
   - Point to published folder
   - Set application pool to "No Managed Code"

3. **Set Permissions**:
   - Grant IIS_IUSRS read/write access to `wwwroot/uploads` folder

### Linux Deployment (Nginx + Systemd)

1. **Publish Application**:
   ```bash
   dotnet publish -c Release -o /var/www/imagecropper
   ```

2. **Create Service File** (`/etc/systemd/system/imagecropper.service`):
   ```ini
   [Unit]
   Description=ImageCropperPro
   After=network.target

   [Service]
   Type=notify
   ExecStart=/usr/bin/dotnet /var/www/imagecropper/ImageCropperPro.dll
   Restart=always
   RestartSec=5
   User=www-data
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=ASPNETCORE_URLS=http://localhost:5000

   [Install]
   WantedBy=multi-user.target
   ```

3. **Configure Nginx** (`/etc/nginx/sites-available/imagecropper`):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection keep-alive;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 10M;
       }
   }
   ```

4. **Start Services**:
   ```bash
   sudo systemctl enable imagecropper
   sudo systemctl start imagecropper
   sudo systemctl enable nginx
   sudo systemctl start nginx
   ```

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
   WORKDIR /app
   EXPOSE 80

   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["ImageCropperPro.csproj", "."]
   RUN dotnet restore
   COPY . .
   RUN dotnet publish -c Release -o /app/publish

   FROM base AS final
   WORKDIR /app
   COPY --from=build /app/publish .
   ENTRYPOINT ["dotnet", "ImageCropperPro.dll"]
   ```

2. **Build and Run**:
   ```bash
   docker build -t imagecropper .
   docker run -d -p 8080:80 --name imagecropper imagecropper
   ```

## Configuration

### Environment Variables

- `ASPNETCORE_ENVIRONMENT`: Set to "Production" for production
- `ASPNETCORE_URLS`: Configure listening URLs
- `DOTNET_CLI_TELEMETRY_OPTOUT`: Set to "1" to disable telemetry

### Application Settings

Create `appsettings.Production.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ImageSettings": {
    "MaxFileSize": 10485760,
    "AllowedTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "CleanupIntervalHours": 24
  }
}
```

## Security Considerations

### File Upload Security
- File type validation is enforced server-side
- File size limits prevent DoS attacks
- Uploaded files are isolated in temporary directory
- Automatic cleanup prevents disk space issues

### Recommended Security Headers
Add to Nginx configuration:
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
```

## Performance Optimization

### Caching
- Static files are served with appropriate cache headers
- CDN integration recommended for production

### Resource Limits
- Configure appropriate memory limits for container deployments
- Monitor disk usage in uploads directory

### Load Balancing
- Application is stateless and supports horizontal scaling
- Use sticky sessions if storing temporary files locally
- Consider cloud storage for uploads in multi-instance deployments

## Monitoring

### Health Checks
Add to `Program.cs`:
```csharp
builder.Services.AddHealthChecks();
app.MapHealthChecks("/health");
```

### Logging
- Application logs to console by default
- Configure file logging for production
- Monitor error rates and performance metrics

## Troubleshooting

### Common Issues

1. **File Upload Fails**:
   - Check `wwwroot/uploads` directory permissions
   - Verify file size limits in web server configuration
   - Check available disk space

2. **Image Processing Errors**:
   - Ensure ImageSharp dependencies are installed
   - Check for sufficient memory for large images
   - Verify supported image formats

3. **Performance Issues**:
   - Monitor memory usage during image processing
   - Consider implementing image size limits
   - Use async/await patterns for file operations

### Log Locations
- **Development**: Console output
- **IIS**: Windows Event Log and application logs
- **Linux**: systemd journal (`journalctl -u imagecropper`)
- **Docker**: Container logs (`docker logs <container>`)

## Backup and Recovery

### Data to Backup
- Application files (published output)
- Configuration files
- SSL certificates (if applicable)

### Recovery Procedures
1. Restore application files
2. Restore configuration
3. Restart services
4. Verify functionality

## Updates and Maintenance

### Updating the Application
1. Stop the service
2. Backup current version
3. Deploy new version
4. Update configuration if needed
5. Start service
6. Verify functionality

### Regular Maintenance
- Monitor disk usage in uploads directory
- Review and rotate logs
- Update dependencies for security patches
- Monitor performance metrics