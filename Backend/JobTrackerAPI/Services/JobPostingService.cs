using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Services
{
    public class JobPostingService
    {
        private readonly JobContext _context;
        private readonly RecruiterService _recruiterService;
        private readonly ILogger<JobPostingService> _logger;

        public JobPostingService(
            JobContext context,
            RecruiterService recruiterService,
            ILogger<JobPostingService> logger)
        {
            _context = context;
            _recruiterService = recruiterService;
            _logger = logger;
        }

        // Create a new job posting
        public async Task<JobPosting> CreateJobPostingAsync(JobPostingDto dto, string recruiterId)
        {
            // Verify the user is a recruiter
            var isRecruiter = await _recruiterService.IsUserRecruiterAsync(recruiterId);
            if (!isRecruiter)
            {
                throw new UnauthorizedAccessException("Only recruiters can create job postings");
            }

            var jobPosting = new JobPosting
            {
                Title = dto.Title,
                CompanyName = dto.CompanyName,
                Description = dto.Description,
                Location = dto.Location,
                IsRemote = dto.IsRemote,
                SalaryRange = dto.SalaryRange,
                Requirements = dto.Requirements,
                PostedDate = DateTime.UtcNow,
                ApplicationDeadline = dto.ApplicationDeadline,
                IsActive = true,
                RecruiterId = recruiterId
            };

            _context.JobPostings.Add(jobPosting);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Recruiter {recruiterId} created job posting (ID: {jobPosting.Id})");
            return jobPosting;
        }

        // Update a job posting
        public async Task<bool> UpdateJobPostingAsync(int id, JobPostingDto dto, string recruiterId)
        {
            var jobPosting = await _context.JobPostings
                .FirstOrDefaultAsync(jp => jp.Id == id);

            if (jobPosting == null)
            {
                _logger.LogWarning($"Job posting {id} not found for update");
                return false;
            }

            // Verify the recruiter owns this job posting
            if (jobPosting.RecruiterId != recruiterId)
            {
                _logger.LogWarning($"Recruiter {recruiterId} attempted to update job posting {id} owned by {jobPosting.RecruiterId}");
                throw new UnauthorizedAccessException("You can only update your own job postings");
            }

            // Update the job posting
            jobPosting.Title = dto.Title;
            jobPosting.CompanyName = dto.CompanyName;
            jobPosting.Description = dto.Description;
            jobPosting.Location = dto.Location;
            jobPosting.IsRemote = dto.IsRemote;
            jobPosting.SalaryRange = dto.SalaryRange;
            jobPosting.Requirements = dto.Requirements;
            jobPosting.ApplicationDeadline = dto.ApplicationDeadline;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Recruiter {recruiterId} updated job posting {id}");
            return true;
        }

        // Delete a job posting
        public async Task<bool> DeleteJobPostingAsync(int id, string recruiterId)
        {
            var jobPosting = await _context.JobPostings
                .FirstOrDefaultAsync(jp => jp.Id == id);

            if (jobPosting == null)
            {
                _logger.LogWarning($"Job posting {id} not found for deletion");
                return false;
            }

            // Verify the recruiter owns this job posting
            if (jobPosting.RecruiterId != recruiterId)
            {
                _logger.LogWarning($"Recruiter {recruiterId} attempted to delete job posting {id} owned by {jobPosting.RecruiterId}");
                throw new UnauthorizedAccessException("You can only delete your own job postings");
            }

            _context.JobPostings.Remove(jobPosting);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Recruiter {recruiterId} deleted job posting {id}");
            return true;
        }

        // Get all job postings
        public async Task<List<JobPosting>> GetAllJobPostingsAsync(bool includeInactive = false)
        {
            var query = _context.JobPostings.AsQueryable();
            
            if (!includeInactive)
            {
                query = query.Where(jp => jp.IsActive);
            }
            
            return await query.OrderByDescending(jp => jp.PostedDate).ToListAsync();
        }

        // Get job postings by recruiter
        public async Task<List<JobPosting>> GetRecruiterJobPostingsAsync(string recruiterId, bool includeInactive = true)
        {
            var query = _context.JobPostings
                .Where(jp => jp.RecruiterId == recruiterId);
                
            if (!includeInactive)
            {
                query = query.Where(jp => jp.IsActive);
            }
            
            return await query.OrderByDescending(jp => jp.PostedDate).ToListAsync();
        }

        // Get a job posting by ID
        public async Task<JobPosting?> GetJobPostingByIdAsync(int id)
        {
            return await _context.JobPostings
                .Include(jp => jp.Recruiter)
                .FirstOrDefaultAsync(jp => jp.Id == id);
        }

        // Toggle job posting active status
        public async Task<bool> ToggleJobPostingStatusAsync(int id, string recruiterId)
        {
            var jobPosting = await _context.JobPostings
                .FirstOrDefaultAsync(jp => jp.Id == id);

            if (jobPosting == null)
            {
                _logger.LogWarning($"Job posting {id} not found for status toggle");
                return false;
            }

            // Verify the recruiter owns this job posting
            if (jobPosting.RecruiterId != recruiterId)
            {
                _logger.LogWarning($"Recruiter {recruiterId} attempted to toggle status of job posting {id} owned by {jobPosting.RecruiterId}");
                throw new UnauthorizedAccessException("You can only update your own job postings");
            }

            // Toggle the status
            jobPosting.IsActive = !jobPosting.IsActive;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Recruiter {recruiterId} toggled job posting {id} status to {(jobPosting.IsActive ? "active" : "inactive")}");
            return true;
        }

        // Get applicants for a job posting
        public async Task<List<JobApplication>> GetJobPostingApplicantsAsync(int jobPostingId, string recruiterId)
        {
            var jobPosting = await _context.JobPostings
                .FirstOrDefaultAsync(jp => jp.Id == jobPostingId);

            if (jobPosting == null)
            {
                _logger.LogWarning($"Job posting {jobPostingId} not found for getting applicants");
                throw new KeyNotFoundException($"Job posting with ID {jobPostingId} not found");
            }

            // Verify the recruiter owns this job posting
            if (jobPosting.RecruiterId != recruiterId)
            {
                _logger.LogWarning($"Recruiter {recruiterId} attempted to view applicants for job posting {jobPostingId} owned by {jobPosting.RecruiterId}");
                throw new UnauthorizedAccessException("You can only view applicants for your own job postings");
            }

            return await _context.JobApplications
                .Include(ja => ja.User)
                .Where(ja => ja.JobPostingId == jobPostingId)
                .ToListAsync();
        }
    }

    // DTO for creating/updating a job posting
    public class JobPostingDto
    {
        public required string Title { get; set; }
        public required string CompanyName { get; set; }
        public required string Description { get; set; }
        public string? Location { get; set; }
        public bool IsRemote { get; set; }
        public string? SalaryRange { get; set; }
        public required string Requirements { get; set; }
        public DateTime ApplicationDeadline { get; set; }
    }
}