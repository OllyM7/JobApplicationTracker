using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JobTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DebugController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<DebugController> _logger;

        public DebugController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<DebugController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        [HttpPost("assign-admin-role")]
        public async Task<IActionResult> AssignAdminRole()
        {
            // Get the current user ID from the claims
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { Message = "User not found or not authenticated" });

            // Get the user
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            try
            {
                // Ensure the Admin role exists
                if (!await _roleManager.RoleExistsAsync("Admin"))
                {
                    await _roleManager.CreateAsync(new IdentityRole("Admin"));
                    _logger.LogInformation("Created Admin role");
                }

                // Check if user already has admin role
                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                if (isAdmin)
                {
                    return Ok(new { Message = "User already has Admin role" });
                }

                // Assign the Admin role to the user
                var result = await _userManager.AddToRoleAsync(user, "Admin");
                if (result.Succeeded)
                {
                    _logger.LogInformation($"Admin role assigned to user {user.Email} (ID: {userId})");
                    return Ok(new { Message = "Admin role assigned successfully" });
                }

                return BadRequest(new { Message = "Failed to assign Admin role", Errors = result.Errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error assigning Admin role to user {user.Email}");
                return StatusCode(500, new { Message = "Internal server error" });
            }
        }
    }
} 