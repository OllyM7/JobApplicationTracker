using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace JobTrackerAPI.Services
{
    public class FileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileService> _logger;
        
        // Allowed file extensions for CV uploads
        private readonly string[] _allowedExtensions = { ".pdf", ".doc", ".docx" };
        
        // Maximum file size (5MB)
        private const long MaxFileSize = 5 * 1024 * 1024;

        public FileService(
            IWebHostEnvironment environment,
            ILogger<FileService> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        public async Task<string> SaveCvFileAsync(IFormFile file, string userId)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No file was uploaded");
            }

            // Validate file size
            if (file.Length > MaxFileSize)
            {
                throw new ArgumentException($"File size exceeds the limit of {MaxFileSize / 1024 / 1024}MB");
            }

            // Validate file extension
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(fileExtension))
            {
                throw new ArgumentException($"File type {fileExtension} is not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");
            }

            // Create a unique filename
            var uniqueFileName = $"{userId}_{DateTime.UtcNow.Ticks}{fileExtension}";
            
            // Ensure the uploads directory exists
            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads", "CVs");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"CV file saved for user {userId}: {uniqueFileName}");
            
            // Return the relative path to the file
            return $"/Uploads/CVs/{uniqueFileName}";
        }

        public bool DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return false;
            }

            // Get the full path
            var fullPath = Path.Combine(_environment.ContentRootPath, filePath.TrimStart('/'));

            try
            {
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation($"File deleted: {filePath}");
                    return true;
                }
                else
                {
                    _logger.LogWarning($"File not found for deletion: {filePath}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file: {filePath}");
                return false;
            }
        }
    }
}