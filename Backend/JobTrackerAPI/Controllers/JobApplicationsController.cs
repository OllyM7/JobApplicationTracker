using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;
using JobTrackerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace JobTrackerAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class JobApplicationsController : ControllerBase
    {
        private readonly JobContext _context;
        private readonly FileService _fileService;
        private readonly ILogger<JobApplicationsController> _logger;

        public JobApplicationsController(
            JobContext context,
            FileService fileService,
            ILogger<JobApplicationsController> logger)
        {
            _context = context;
            _fileService = fileService;
            _logger = logger;
        }

        // GET: api/jobapplications - Returns only the current user's applications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplication>>> GetJobApplications()
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var userJobs = await _context.JobApplications
                .Where(job => job.UserId == userId)
                .Include(job => job.JobPosting)
                .ToListAsync();

            return Ok(userJobs);
        }

        // GET: api/jobapplications/5 - Returns the application only if it belongs to the current user
        [HttpGet("{id}")]
        public async Task<ActionResult<JobApplication>> GetJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications
                .Include(job => job.JobPosting)
                .FirstOrDefaultAsync(job => job.Id == id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            
            // Allow access if: the user owns the application, or is an admin, or is a recruiter who owns the job posting
            bool isOwner = jobApplication.UserId == userId;
            bool isAdmin = User.IsInRole("Admin");
            bool isRecruiterWithAccess = User.IsInRole("Recruiter") && 
                                         jobApplication.JobPosting != null && 
                                         jobApplication.JobPosting.RecruiterId == userId;
                                         
            if (!isOwner && !isAdmin && !isRecruiterWithAccess)
            {
                return Unauthorized();
            }

            return Ok(jobApplication);
        }

        // POST: api/jobapplications - Creates a new manual job application (using existing DTO)
        [HttpPost]
        public async Task<ActionResult<JobApplication>> CreateJobApplication([FromBody] JobApplicationCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get the current user's ID from the claims
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            // Map the DTO to the JobApplication entity
            var jobApplication = new JobApplication
            {
                CompanyName = dto.CompanyName,
                Position = dto.Position,
                Status = (JobStatus)dto.Status,
                Deadline = dto.Deadline,
                Notes = dto.Notes,
                UserId = userId,
                ApplicationDate = DateTime.UtcNow
            };

            _context.JobApplications.Add(jobApplication);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobApplication), new { id = jobApplication.Id }, jobApplication);
        }

        // POST: api/jobapplications/apply/{jobPostingId} - Apply to a job posting with CV upload
        [HttpPost("apply/{jobPostingId}")]
        [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)] // 10MB limit
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<ActionResult<JobApplication>> ApplyToJobPosting(
            int jobPostingId, 
            [FromForm] JobApplicationApplyDto dto,
            IFormFile cvFile)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get the job posting
            var jobPosting = await _context.JobPostings
                .Include(jp => jp.Recruiter)
                .FirstOrDefaultAsync(jp => jp.Id == jobPostingId);
                
            if (jobPosting == null)
            {
                return NotFound(new { Message = $"Job posting with ID {jobPostingId} not found" });
            }

            // Check if job posting is active
            if (!jobPosting.IsActive)
            {
                return BadRequest(new { Message = "This job posting is no longer accepting applications" });
            }

            // Check if deadline has passed
            if (jobPosting.ApplicationDeadline < DateTime.UtcNow)
            {
                return BadRequest(new { Message = "The application deadline for this job posting has passed" });
            }

            // Get the current user's ID from the claims
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            // Check if user has already applied to this job posting
            var existingApplication = await _context.JobApplications
                .FirstOrDefaultAsync(j => j.UserId == userId && j.JobPostingId == jobPostingId);

            if (existingApplication != null)
            {
                return BadRequest(new { Message = "You have already applied to this job posting" });
            }

            // Process the CV file
            string? cvFilePath = null;
            if (cvFile != null && cvFile.Length > 0)
            {
                try
                {
                    cvFilePath = await _fileService.SaveCvFileAsync(cvFile, userId);
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { Message = ex.Message });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving CV file");
                    return StatusCode(500, new { Message = "An error occurred while saving the CV file" });
                }
            }
            else
            {
                // CV is required for job posting applications
                return BadRequest(new { Message = "A CV file is required when applying to a job posting" });
            }

            // Create the job application
            var jobApplication = new JobApplication
            {
                CompanyName = jobPosting.CompanyName,
                Position = jobPosting.Title,
                Status = JobStatus.Applied, // Automatically set to Applied since it's a direct application
                Deadline = jobPosting.ApplicationDeadline,
                Notes = dto.Notes,
                UserId = userId,
                JobPostingId = jobPostingId,
                ApplicationDate = DateTime.UtcNow,
                CoverLetter = dto.CoverLetter,
                CvFilePath = cvFilePath,
                RecruiterStatus = ApplicationStatus.Pending
            };

            _context.JobApplications.Add(jobApplication);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobApplication), new { id = jobApplication.Id }, jobApplication);
        }

        // PUT: api/jobapplications/5 - Updates an application only if it belongs to the current user
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobApplication(int id, JobApplication jobApplication)
        {
            if (id != jobApplication.Id)
            {
                return BadRequest();
            }

            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Retrieve the existing application to check ownership
            var existingJob = await _context.JobApplications.AsNoTracking().FirstOrDefaultAsync(j => j.Id == id);
            if (existingJob == null)
            {
                return NotFound();
            }
            if (existingJob.UserId != userId && !User.IsInRole("Admin"))
            {
                return Unauthorized();
            }

            // If this is a job posting application, don't allow changing certain fields
            if (existingJob.JobPostingId.HasValue)
            {
                // Preserve the original values for these fields
                jobApplication.JobPostingId = existingJob.JobPostingId;
                jobApplication.RecruiterStatus = existingJob.RecruiterStatus;
                jobApplication.RecruiterFeedback = existingJob.RecruiterFeedback;
                jobApplication.RecruiterResponseDate = existingJob.RecruiterResponseDate;
                jobApplication.ApplicationDate = existingJob.ApplicationDate;
                jobApplication.CvFilePath = existingJob.CvFilePath;
            }

            // Ensure the UserId remains the same
            jobApplication.UserId = existingJob.UserId;

            _context.Entry(jobApplication).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobApplicationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PUT: api/jobapplications/5/recruiter-status - Updates the recruiter status of an application
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPut("{id}/recruiter-status")]
        public async Task<IActionResult> UpdateRecruiterStatus(int id, [FromBody] JobApplicationStatusUpdateDto dto)
        {
            var jobApplication = await _context.JobApplications
                .Include(j => j.JobPosting)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            // Check if this is a job posting application
            if (!jobApplication.JobPostingId.HasValue)
            {
                return BadRequest(new { Message = "This is not a job posting application" });
            }

            // Check if the current user is the recruiter who posted the job
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            if (!User.IsInRole("Admin") && jobApplication.JobPosting?.RecruiterId != userId)
            {
                return Unauthorized();
            }

            // Update the recruiter status
            jobApplication.RecruiterStatus = dto.Status;
            jobApplication.RecruiterFeedback = dto.Feedback;
            jobApplication.RecruiterResponseDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/jobapplications/5 - Deletes an application only if it belongs to the current user
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications.FindAsync(id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            if (jobApplication.UserId != userId && !User.IsInRole("Admin"))
            {
                return Unauthorized();
            }

            // If there's a CV file, attempt to delete it
            if (!string.IsNullOrEmpty(jobApplication.CvFilePath))
            {
                _fileService.DeleteFile(jobApplication.CvFilePath);
            }

            _context.JobApplications.Remove(jobApplication);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool JobApplicationExists(int id)
        {
            return _context.JobApplications.Any(e => e.Id == id);
        }
    }
}