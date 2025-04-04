using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using JobTrackerAPI.Services;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobPostingsController : ControllerBase
    {
        private readonly JobPostingService _jobPostingService;
        private readonly ILogger<JobPostingsController> _logger;

        public JobPostingsController(
            JobPostingService jobPostingService,
            ILogger<JobPostingsController> logger)
        {
            _jobPostingService = jobPostingService;
            _logger = logger;
        }

        // GET: api/JobPostings - Get all active job postings (public)
        [HttpGet]
        public async Task<IActionResult> GetAllJobPostings([FromQuery] bool includeInactive = false)
        {
            // Only admins can see inactive job postings
            if (includeInactive && !User.IsInRole("Admin"))
            {
                includeInactive = false;
            }

            var jobPostings = await _jobPostingService.GetAllJobPostingsAsync(includeInactive);
            return Ok(jobPostings);
        }

        // GET: api/JobPostings/{id} - Get job posting by ID (public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetJobPostingById(int id)
        {
            var jobPosting = await _jobPostingService.GetJobPostingByIdAsync(id);
            
            if (jobPosting == null)
                return NotFound(new { Message = $"Job posting with ID {id} not found" });
                
            // Non-admins should not be able to view inactive job postings
            if (!jobPosting.IsActive && !User.IsInRole("Admin"))
                return NotFound(new { Message = $"Job posting with ID {id} not found" });
                
            return Ok(jobPosting);
        }

        // GET: api/JobPostings/MyPostings - Get job postings by current recruiter
        [Authorize(Roles = "Recruiter")]
        [HttpGet("MyPostings")]
        public async Task<IActionResult> GetRecruiterJobPostings([FromQuery] bool includeInactive = true)
        {
            string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var jobPostings = await _jobPostingService.GetRecruiterJobPostingsAsync(recruiterId, includeInactive);
            return Ok(jobPostings);
        }

        // POST: api/JobPostings - Create a new job posting (recruiter only)
        [Authorize(Roles = "Recruiter")]
        [HttpPost]
        public async Task<IActionResult> CreateJobPosting([FromBody] JobPostingDto jobPostingDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var jobPosting = await _jobPostingService.CreateJobPostingAsync(jobPostingDto, recruiterId);
                
                return CreatedAtAction(nameof(GetJobPostingById), new { id = jobPosting.Id }, jobPosting);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating job posting");
                return StatusCode(500, new { Message = "An error occurred while creating the job posting" });
            }
        }

        // PUT: api/JobPostings/{id} - Update a job posting (recruiter only)
        [Authorize(Roles = "Recruiter")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobPosting(int id, [FromBody] JobPostingDto jobPostingDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var success = await _jobPostingService.UpdateJobPostingAsync(id, jobPostingDto, recruiterId);
                
                if (!success)
                    return NotFound(new { Message = $"Job posting with ID {id} not found" });
                    
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating job posting {id}");
                return StatusCode(500, new { Message = "An error occurred while updating the job posting" });
            }
        }

        // DELETE: api/JobPostings/{id} - Delete a job posting (recruiter only)
        [Authorize(Roles = "Recruiter")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobPosting(int id)
        {
            try
            {
                string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var success = await _jobPostingService.DeleteJobPostingAsync(id, recruiterId);
                
                if (!success)
                    return NotFound(new { Message = $"Job posting with ID {id} not found" });
                    
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting job posting {id}");
                return StatusCode(500, new { Message = "An error occurred while deleting the job posting" });
            }
        }

        // POST: api/JobPostings/{id}/toggle-status - Toggle active status (recruiter only)
        [Authorize(Roles = "Recruiter")]
        [HttpPost("{id}/toggle-status")]
        public async Task<IActionResult> ToggleJobPostingStatus(int id)
        {
            try
            {
                string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var success = await _jobPostingService.ToggleJobPostingStatusAsync(id, recruiterId);
                
                if (!success)
                    return NotFound(new { Message = $"Job posting with ID {id} not found" });
                    
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error toggling status of job posting {id}");
                return StatusCode(500, new { Message = "An error occurred while toggling the job posting status" });
            }
        }

        // GET: api/JobPostings/{id}/applicants - Get applicants for a job posting (recruiter only)
        [Authorize(Roles = "Recruiter")]
        [HttpGet("{id}/applicants")]
        public async Task<IActionResult> GetJobPostingApplicants(int id)
        {
            try
            {
                string recruiterId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var applicants = await _jobPostingService.GetJobPostingApplicantsAsync(id, recruiterId);
                return Ok(applicants);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving applicants for job posting {id}");
                return StatusCode(500, new { Message = "An error occurred while retrieving the applicants" });
            }
        }
    }
}