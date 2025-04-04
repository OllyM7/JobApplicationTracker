using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Services
{
    public class RecruiterService
    {
        private readonly JobContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RolesService _rolesService;
        private readonly ILogger<RecruiterService> _logger;

        public RecruiterService(
            JobContext context,
            UserManager<IdentityUser> userManager,
            RolesService rolesService,
            ILogger<RecruiterService> logger)
        {
            _context = context;
            _userManager = userManager;
            _rolesService = rolesService;
            _logger = logger;
        }

        // Submit a new recruiter application
        public async Task<RecruiterApplication> SubmitApplicationAsync(RecruiterApplicationDto dto, string userId)
        {
            // Check if user already has a pending application
            var existingApplication = await _context.RecruiterApplications
                .Where(ra => ra.UserId == userId && ra.Status == RecruiterApplicationStatus.Pending)
                .FirstOrDefaultAsync();

            if (existingApplication != null)
            {
                throw new InvalidOperationException("You already have a pending recruiter application");
            }

            // Check if user is already a recruiter
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            var isRecruiter = await _userManager.IsInRoleAsync(user, "Recruiter");
            if (isRecruiter)
            {
                throw new InvalidOperationException("User is already a recruiter");
            }

            // Create and save the new application
            var application = new RecruiterApplication
            {
                UserId = userId,
                CompanyName = dto.CompanyName,
                CompanyWebsite = dto.CompanyWebsite,
                JobTitle = dto.JobTitle,
                Motivation = dto.Motivation,
                ApplicationDate = DateTime.UtcNow,
                Status = RecruiterApplicationStatus.Pending
            };

            _context.RecruiterApplications.Add(application);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User {userId} submitted recruiter application (ID: {application.Id})");
            return application;
        }

        // Get all recruiter applications (for admin)
        public async Task<List<RecruiterApplication>> GetAllApplicationsAsync()
        {
            return await _context.RecruiterApplications
                .Include(ra => ra.User)
                .Include(ra => ra.ReviewedBy)
                .OrderByDescending(ra => ra.ApplicationDate)
                .ToListAsync();
        }

        // Get pending recruiter applications (for admin)
        public async Task<List<RecruiterApplication>> GetPendingApplicationsAsync()
        {
            return await _context.RecruiterApplications
                .Include(ra => ra.User)
                .Where(ra => ra.Status == RecruiterApplicationStatus.Pending)
                .OrderByDescending(ra => ra.ApplicationDate)
                .ToListAsync();
        }

        // Get a specific recruiter application
        public async Task<RecruiterApplication?> GetApplicationByIdAsync(int id)
        {
            return await _context.RecruiterApplications
                .Include(ra => ra.User)
                .Include(ra => ra.ReviewedBy)
                .FirstOrDefaultAsync(ra => ra.Id == id);
        }

        // Get a user's recruiter application
        public async Task<RecruiterApplication?> GetUserApplicationAsync(string userId)
        {
            return await _context.RecruiterApplications
                .Include(ra => ra.User)
                .Include(ra => ra.ReviewedBy)
                .Where(ra => ra.UserId == userId)
                .OrderByDescending(ra => ra.ApplicationDate)
                .FirstOrDefaultAsync();
        }

        // Approve a recruiter application
        public async Task<bool> ApproveApplicationAsync(int applicationId, string adminUserId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var application = await _context.RecruiterApplications
                    .Include(ra => ra.User)
                    .FirstOrDefaultAsync(ra => ra.Id == applicationId);

                if (application == null)
                {
                    _logger.LogWarning($"Recruiter application {applicationId} not found for approval");
                    return false;
                }

                if (application.Status != RecruiterApplicationStatus.Pending)
                {
                    _logger.LogWarning($"Cannot approve recruiter application {applicationId} with status {application.Status}");
                    return false;
                }

                // Update the application status
                application.Status = RecruiterApplicationStatus.Approved;
                application.ReviewedByUserId = adminUserId;
                application.ReviewDate = DateTime.UtcNow;
                
                // Add the user to the Recruiter role
                var user = application.User;
                if (user == null)
                {
                    _logger.LogWarning($"User not found for recruiter application {applicationId}");
                    return false;
                }

                var roleResult = await _rolesService.AssignRoleToUserAsync(user, "Recruiter");
                if (!roleResult.Succeeded)
                {
                    _logger.LogError($"Failed to assign Recruiter role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                    throw new InvalidOperationException("Failed to assign Recruiter role");
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Recruiter application {applicationId} approved by admin {adminUserId}");
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error approving recruiter application {applicationId}");
                throw;
            }
        }

        // Reject a recruiter application
        public async Task<bool> RejectApplicationAsync(int applicationId, string adminUserId, string rejectionReason)
        {
            var application = await _context.RecruiterApplications
                .FirstOrDefaultAsync(ra => ra.Id == applicationId);

            if (application == null)
            {
                _logger.LogWarning($"Recruiter application {applicationId} not found for rejection");
                return false;
            }

            if (application.Status != RecruiterApplicationStatus.Pending)
            {
                _logger.LogWarning($"Cannot reject recruiter application {applicationId} with status {application.Status}");
                return false;
            }

            // Update the application status
            application.Status = RecruiterApplicationStatus.Rejected;
            application.ReviewedByUserId = adminUserId;
            application.ReviewDate = DateTime.UtcNow;
            application.RejectionReason = rejectionReason;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Recruiter application {applicationId} rejected by admin {adminUserId}");
            return true;
        }

        // Check if a user is a recruiter
        public async Task<bool> IsUserRecruiterAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            return await _userManager.IsInRoleAsync(user, "Recruiter");
        }
    }

    // DTO for submitting a recruiter application
    public class RecruiterApplicationDto
    {
        public required string CompanyName { get; set; }
        public required string CompanyWebsite { get; set; }
        public required string JobTitle { get; set; }
        public required string Motivation { get; set; }
    }
}