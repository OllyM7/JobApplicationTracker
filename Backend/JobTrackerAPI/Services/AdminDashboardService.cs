using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Services
{
    public class AdminDashboardService
    {
        private readonly JobContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly ILogger<AdminDashboardService> _logger;

        public AdminDashboardService(
            JobContext context,
            UserManager<IdentityUser> userManager,
            ILogger<AdminDashboardService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<List<UserDetailsDto>> GetAllUsersWithDetailsAsync()
        {
            var users = await _userManager.Users.ToListAsync();
            var result = new List<UserDetailsDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var jobCount = await _context.JobApplications.CountAsync(j => j.UserId == user.Id);

                result.Add(new UserDetailsDto
                {
                    Id = user.Id,
                    Email = user.Email ?? "No Email",
                    UserName = user.UserName,
                    Roles = roles.ToList(),
                    JobCount = jobCount,
                    CreatedAt = user.SecurityStamp != null
                        ? new DateTime(2024, 4, 1) // Placeholder when real creation date is not available
                        : DateTime.UtcNow,
                    LastLogin = null // Not tracking this currently
                });
            }

            return result;
        }

        public async Task<AdminStatsDto> GetSystemStatisticsAsync()
        {
            var userCount = await _userManager.Users.CountAsync();
            var jobs = await _context.JobApplications.ToListAsync();
            var jobCount = jobs.Count;

            // Count jobs by status
            var statusCounts = jobs
                .GroupBy(j => j.Status)
                .Select(g => new StatusCountDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToList();

            // Get user job counts with emails
            var userJobCountsQuery = from j in _context.JobApplications
                                   group j by j.UserId into g
                                   select new { UserId = g.Key, Count = g.Count() };

            var userJobCounts = await userJobCountsQuery.ToListAsync();
            var userJobCountDtos = new List<UserJobCountDto>();

            foreach (var count in userJobCounts)
            {
                var user = await _userManager.FindByIdAsync(count.UserId);
                userJobCountDtos.Add(new UserJobCountDto
                {
                    UserId = count.UserId,
                    UserEmail = user?.Email,
                    Count = count.Count
                });
            }

            // Get upcoming deadlines
            var upcomingDeadlines = await _context.JobApplications
                .Where(j => j.Deadline >= DateTime.Today && j.Deadline <= DateTime.Today.AddDays(14))
                .OrderBy(j => j.Deadline)
                .ToListAsync();

            return new AdminStatsDto
            {
                TotalUsers = userCount,
                TotalJobs = jobCount,
                JobsByStatus = statusCounts,
                UserJobCounts = userJobCountDtos,
                UpcomingDeadlines = upcomingDeadlines
            };
        }

        public async Task<List<JobDetailsAdminDto>> GetAllJobsWithUserDetailsAsync()
        {
            var jobs = await _context.JobApplications
                .Include(j => j.User)
                .ToListAsync();

            return jobs.Select(job => new JobDetailsAdminDto
            {
                Id = job.Id,
                CompanyName = job.CompanyName,
                Position = job.Position,
                Status = job.Status,
                Deadline = job.Deadline,
                Notes = job.Notes,
                UserId = job.UserId,
                UserEmail = job.User?.Email
            }).ToList();
        }

        public async Task<bool> DeleteUserAndRelatedDataAsync(string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Get the user
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User with ID {userId} not found for deletion");
                    return false;
                }

                // Check if this is the last admin
                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                if (isAdmin)
                {
                    var admins = await _userManager.GetUsersInRoleAsync("Admin");
                    if (admins.Count == 1 && admins.First().Id == userId)
                    {
                        _logger.LogWarning("Cannot delete the last admin user");
                        return false;
                    }
                }

                // Delete all jobs associated with the user
                var userJobs = await _context.JobApplications
                    .Where(j => j.UserId == userId)
                    .ToListAsync();

                _context.JobApplications.RemoveRange(userJobs);
                await _context.SaveChangesAsync();

                // Delete the user
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    _logger.LogError($"Failed to delete user {userId}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    await transaction.RollbackAsync();
                    return false;
                }

                await transaction.CommitAsync();
                _logger.LogInformation($"Successfully deleted user {user.Email} and {userJobs.Count} related job applications");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user {userId} and related data");
                await transaction.RollbackAsync();
                return false;
            }
        }
    }
}