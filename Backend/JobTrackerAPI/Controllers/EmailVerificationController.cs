using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class VerifyEmailController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly ILogger<VerifyEmailController> _logger;

        public VerifyEmailController(
            IConfiguration configuration,
            UserManager<IdentityUser> userManager,
            ILogger<VerifyEmailController> logger)
        {
            _configuration = configuration;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string token, [FromQuery] string email)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(email))
            {
                _logger.LogWarning("Verification attempt with missing token or email");
                return BadRequest("Invalid verification link");
            }

            _logger.LogInformation($"Received verification request for {email}");

            try
            {
                // Verify the email directly
                var user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    _logger.LogWarning($"User with email {email} not found during verification");
                    // Don't reveal that the user doesn't exist
                    return BadRequest("Invalid verification link");
                }

                var result = await _userManager.ConfirmEmailAsync(user, token);
                if (result.Succeeded)
                {
                    _logger.LogInformation($"Email verification successful for {email}");
                    
                    // Redirect to login page with success message - use port 3000 explicitly
                    return Redirect("https://localhost:3000/verify-email?verified=true");
                }
                else
                {
                    _logger.LogWarning($"Email verification failed for {email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    
                    // Redirect to frontend with error message - use port 3000 explicitly
                    return Redirect("https://localhost:3000/verify-email?error=true");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception during email verification for {email}");
                return StatusCode(500, "An error occurred during email verification. Please try again or contact support.");
            }
        }
    }
} 