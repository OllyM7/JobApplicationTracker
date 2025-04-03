using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Services;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace JobTrackerAPI.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RolesService _rolesService;
        private readonly AdminDashboardService _dashboardService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            UserManager<IdentityUser> userManager, 
            RolesService rolesService,
            AdminDashboardService dashboardService,
            ILogger<AdminController> logger)
        {
            _userManager = userManager;
            _rolesService = rolesService;
            _dashboardService = dashboardService;
            _logger = logger;
        }

        // GET: api/Admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _dashboardService.GetAllUsersWithDetailsAsync();
            return Ok(users);
        }

        // GET: api/Admin/users/{id}
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUserDetails(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new UserDetailsDto
            {
                Id = user.Id,
                Email = user.Email ?? "No Email",
                UserName = user.UserName,
                Roles = roles.ToList(),
                CreatedAt = user.SecurityStamp != null
                    ? new DateTime(2024, 4, 1) // Placeholder
                    : DateTime.UtcNow,
                LastLogin = null
            });
        }

        // POST: api/Admin/assign-role
        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRole([FromBody] UserRoleDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            try
            {
                _logger.LogInformation($"Admin assigning role {model.RoleName} to user {user.Email} (ID: {model.UserId})");
                var result = await _rolesService.AssignRoleToUserAsync(user, model.RoleName);
                if (result.Succeeded)
                {
                    _logger.LogInformation($"Role assignment successful");
                    return Ok(new { Message = $"Role {model.RoleName} assigned to user successfully" });
                }

                _logger.LogWarning($"Role assignment failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return BadRequest(result.Errors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error assigning role {model.RoleName} to user {user.Email}");
                return BadRequest(new { Message = ex.Message });
            }
        }

        // POST: api/Admin/remove-role
        [HttpPost("remove-role")]
        public async Task<IActionResult> RemoveRole([FromBody] UserRoleDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            // Check if the user is in the role
            var isInRole = await _userManager.IsInRoleAsync(user, model.RoleName);
            if (!isInRole)
                return BadRequest(new { Message = $"User is not in role {model.RoleName}" });

            // Prevent removing the Admin role from the last admin
            if (model.RoleName == "Admin")
            {
                var admins = await _userManager.GetUsersInRoleAsync("Admin");
                if (admins.Count == 1 && admins.First().Id == user.Id)
                {
                    return BadRequest(new { Message = "Cannot remove the Admin role from the last admin" });
                }
            }

            var result = await _userManager.RemoveFromRoleAsync(user, model.RoleName);
            if (result.Succeeded)
                return Ok(new { Message = $"Role {model.RoleName} removed from user successfully" });

            return BadRequest(result.Errors);
        }

        // GET: api/Admin/jobs
        [HttpGet("jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs = await _dashboardService.GetAllJobsWithUserDetailsAsync();
            return Ok(jobs);
        }

        // GET: api/Admin/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _dashboardService.GetSystemStatisticsAsync();
            return Ok(stats);
        }

        // DELETE: api/Admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var success = await _dashboardService.DeleteUserAndRelatedDataAsync(id);
            if (success)
                return Ok(new { Message = "User and all associated data deleted successfully" });
            
            return BadRequest(new { Message = "Failed to delete user. The user may not exist or might be the last admin." });
        }

        // GET: api/Admin/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetAllRoles()
        {
            var roles = await _rolesService.GetAllRolesAsync();
            return Ok(roles);
        }

        // POST: api/Admin/roles
        [HttpPost("roles")]
        public async Task<IActionResult> CreateRole([FromBody] string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
                return BadRequest(new { Message = "Role name cannot be empty" });

            var result = await _rolesService.CreateRoleAsync(roleName);
            if (result.Succeeded)
                return Ok(new { Message = $"Role '{roleName}' created successfully" });

            return BadRequest(result.Errors);
        }
    }
}