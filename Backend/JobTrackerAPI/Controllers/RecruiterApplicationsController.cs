using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using JobTrackerAPI.Services;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecruiterApplicationsController : ControllerBase
    {
        private readonly RecruiterService _recruiterService;
        private readonly ILogger<RecruiterApplicationsController> _logger;

        public RecruiterApplicationsController(
            RecruiterService recruiterService,
            ILogger<RecruiterApplicationsController> logger)
        {
            _recruiterService = recruiterService;
            _logger = logger;
        }

        // POST: api/RecruiterApplications - Submit an application to become a recruiter
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> SubmitApplication([FromBody] RecruiterApplicationDto applicationDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var application = await _recruiterService.SubmitApplicationAsync(applicationDto, userId);
                
                return CreatedAtAction(nameof(GetUserApplication), new { }, application);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting recruiter application");
                return StatusCode(500, new { Message = "An error occurred while submitting your application" });
            }
        }

        // GET: api/RecruiterApplications/MyApplication - Get current user's application
        [Authorize]
        [HttpGet("MyApplication")]
        public async Task<IActionResult> GetUserApplication()
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var application = await _recruiterService.GetUserApplicationAsync(userId);
            
            if (application == null)
                return NotFound(new { Message = "You have not submitted a recruiter application" });
                
            return Ok(application);
        }

        // GET: api/RecruiterApplications - Get all applications (admin only)
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllApplications([FromQuery] bool pendingOnly = false)
        {
            if (pendingOnly)
            {
                var pendingApplications = await _recruiterService.GetPendingApplicationsAsync();
                return Ok(pendingApplications);
            }
            else
            {
                var allApplications = await _recruiterService.GetAllApplicationsAsync();
                return Ok(allApplications);
            }
        }

        // GET: api/RecruiterApplications/{id} - Get application by ID (admin only)
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetApplicationById(int id)
        {
            var application = await _recruiterService.GetApplicationByIdAsync(id);
            
            if (application == null)
                return NotFound(new { Message = $"Recruiter application with ID {id} not found" });
                
            return Ok(application);
        }

        // POST: api/RecruiterApplications/{id}/approve - Approve an application (admin only)
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveApplication(int id)
        {
            try
            {
                string adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var success = await _recruiterService.ApproveApplicationAsync(id, adminUserId);
                
                if (!success)
                    return BadRequest(new { Message = "Unable to approve the application" });
                    
                return Ok(new { Message = "Recruiter application approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving recruiter application {id}");
                return StatusCode(500, new { Message = "An error occurred while approving the application" });
            }
        }

        // POST: api/RecruiterApplications/{id}/reject - Reject an application (admin only)
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectApplication(int id, [FromBody] RejectApplicationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest(new { Message = "Rejection reason is required" });
                
            try
            {
                string adminUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var success = await _recruiterService.RejectApplicationAsync(id, adminUserId, dto.Reason);
                
                if (!success)
                    return BadRequest(new { Message = "Unable to reject the application" });
                    
                return Ok(new { Message = "Recruiter application rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting recruiter application {id}");
                return StatusCode(500, new { Message = "An error occurred while rejecting the application" });
            }
        }
    }

    public class RejectApplicationDto
    {
        public required string Reason { get; set; }
    }
}