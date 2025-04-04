using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace JobTrackerAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class JobApplicationsController : ControllerBase
    {
        private readonly JobContext _context;

        public JobApplicationsController(JobContext context)
        {
            _context = context;
        }

        // GET: api/jobapplications - Returns user applications or all applications for admins
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplication>>> GetJobApplications()
        {
            // Check if the user is an admin
            bool isAdmin = User.IsInRole("Admin");
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            // If admin, can see all applications, otherwise only their own
            if (isAdmin)
            {
                var allJobs = await _context.JobApplications
                    .Include(j => j.User) // Include user information
                    .ToListAsync();
                return Ok(allJobs);
            }
            else
            {
                var userJobs = await _context.JobApplications
                    .Where(job => job.UserId == userId)
                    .ToListAsync();
                return Ok(userJobs);
            }
        }

        // GET: api/jobapplications/5 - Returns the application if it belongs to the user or if admin
        [HttpGet("{id}")]
        public async Task<ActionResult<JobApplication>> GetJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications.FindAsync(id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            // Check if the user is an admin or the owner of the application
            bool isAdmin = User.IsInRole("Admin");
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            if (!isAdmin && jobApplication.UserId != userId)
            {
                return Unauthorized();
            }

            return Ok(jobApplication);
        }

        // POST: api/jobapplications - Creates a new job application associated with the current user
        [HttpPost]
        public async Task<ActionResult<JobApplication>> CreateJobApplication([FromBody] JobApplicationCreateDto dto)
        {
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

        // POST: api/jobapplications/apply/{jobPostingId} - Apply to a job posting
        [HttpPost("apply/{jobPostingId}")]
        public async Task<ActionResult<JobApplication>> ApplyToJobPosting(int jobPostingId, [FromBody] JobApplicationApplyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get the job posting
            var jobPosting = await _context.JobPostings.FindAsync(jobPostingId);
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
                ResumeUrl = dto.ResumeUrl
            };

            _context.JobApplications.Add(jobApplication);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobApplication), new { id = jobApplication.Id }, jobApplication);
        }

        // PUT: api/jobapplications/5 - Updates an application if the user owns it or is an admin
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobApplication(int id, JobApplication jobApplication)
        {
            if (id != jobApplication.Id)
            {
                return BadRequest();
            }

            bool isAdmin = User.IsInRole("Admin");
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            
            // Retrieve the existing application to check ownership
            var existingJob = await _context.JobApplications.AsNoTracking().FirstOrDefaultAsync(j => j.Id == id);
            
            if (existingJob == null)
            {
                return NotFound();
            }
            
            // If not an admin and not the owner, return unauthorized
            if (!isAdmin && existingJob.UserId != userId)
            {
                return Unauthorized();
            }

            // If not an admin, ensure the UserId remains unchanged
            if (!isAdmin)
            {
                jobApplication.UserId = userId;
            }

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

        // DELETE: api/jobapplications/5 - Deletes an application if the user owns it or is an admin
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications.FindAsync(id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            bool isAdmin = User.IsInRole("Admin");
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            
            // If not an admin and not the owner, return unauthorized
            if (!isAdmin && jobApplication.UserId != userId)
            {
                return Unauthorized();
            }

            _context.JobApplications.Remove(jobApplication);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Admin only: Get all job applications with statistics
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetJobStatistics()
        {
            var allJobs = await _context.JobApplications.ToListAsync();
            
            var stats = new
            {
                TotalApplications = allJobs.Count,
                ByStatus = new
                {
                    ApplicationNeeded = allJobs.Count(j => j.Status == JobStatus.ApplicationNeeded),
                    Applied = allJobs.Count(j => j.Status == JobStatus.Applied),
                    ExamCenter = allJobs.Count(j => j.Status == JobStatus.ExamCenter),
                    Interviewing = allJobs.Count(j => j.Status == JobStatus.Interviewing),
                    AwaitingOffer = allJobs.Count(j => j.Status == JobStatus.AwaitingOffer)
                },
                UpcomingDeadlines = allJobs
                    .Where(j => j.Deadline >= DateTime.Today && j.Deadline <= DateTime.Today.AddDays(7))
                    .OrderBy(j => j.Deadline)
                    .ToList()
            };
            
            return Ok(stats);
        }

        private bool JobApplicationExists(int id)
        {
            return _context.JobApplications.Any(e => e.Id == id);
        }
    }

    public class JobApplicationApplyDto
    {
        public required string Notes { get; set; }
        public string? CoverLetter { get; set; }
        public string? ResumeUrl { get; set; }
    }
}