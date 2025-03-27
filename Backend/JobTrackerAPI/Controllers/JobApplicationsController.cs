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

        // GET: api/jobapplications - Returns only the current user's applications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplication>>> GetJobApplications()
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var userJobs = await _context.JobApplications
                .Where(job => job.UserId == userId)
                .ToListAsync();

            return Ok(userJobs);
        }

        // GET: api/jobapplications/5 - Returns the application only if it belongs to the current user
        [HttpGet("{id}")]
        public async Task<ActionResult<JobApplication>> GetJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications.FindAsync(id);

            if (jobApplication == null)
            {
                return NotFound();
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            if (jobApplication.UserId != userId)
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
                UserId = userId // Automatically assign the authenticated user's ID
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
            if (existingJob.UserId != userId)
            {
                return Unauthorized();
            }

            // Ensure the UserId remains the same as the current user's ID
            jobApplication.UserId = userId;

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
            if (jobApplication.UserId != userId)
            {
                return Unauthorized();
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
