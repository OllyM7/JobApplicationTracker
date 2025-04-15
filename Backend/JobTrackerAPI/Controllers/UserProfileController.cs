using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;
using JobTrackerAPI.Models;
using JobTrackerAPI.Services;

namespace JobTrackerAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly JobContext _context;
        private readonly FileService _fileService;
        private readonly EmailService _emailService;
        private readonly ILogger<UserProfileController> _logger;

        public UserProfileController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            JobContext context,
            FileService fileService,
            EmailService emailService,
            ILogger<UserProfileController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _fileService = fileService;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: api/UserProfile - Get current user profile
        [HttpGet]
        public async Task<IActionResult> GetUserProfile()
        {
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var applicationCount = await _context.JobApplications.CountAsync(j => j.UserId == userId);

            var profile = new UserProfileDto
            {
                Email = user.Email,
                UserName = user.UserName,
                Roles = roles.ToList(),
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumber = user.PhoneNumber,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                ApplicationCount = applicationCount
            };

            return Ok(profile);
        }

        // PUT: api/UserProfile - Update user profile
        [HttpPut]
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateUserProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            // Update user properties
            if (!string.IsNullOrEmpty(dto.UserName) && user.UserName != dto.UserName)
            {
                // Check if username is already taken
                var existingUser = await _userManager.FindByNameAsync(dto.UserName);
                if (existingUser != null && existingUser.Id != userId)
                {
                    return BadRequest(new { Message = "Username is already taken" });
                }

                user.UserName = dto.UserName;
                user.NormalizedUserName = _userManager.NormalizeName(dto.UserName);
            }

            if (!string.IsNullOrEmpty(dto.PhoneNumber) && user.PhoneNumber != dto.PhoneNumber)
            {
                user.PhoneNumber = dto.PhoneNumber;
                // Reset the phone number confirmation when changed
                user.PhoneNumberConfirmed = false;
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new { Message = "Failed to update profile", Errors = result.Errors });
            }

            return NoContent();
        }

        // POST: api/UserProfile/change-password - Change user password
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new { Message = "Failed to change password", Errors = result.Errors });
            }

            // Force sign-out after password change for security
            await _signInManager.SignOutAsync();

            return Ok(new { Message = "Password changed successfully. Please log in again with your new password." });
        }

        // POST: api/UserProfile/change-email - Change user email (requires confirmation)
        [HttpPost("change-email")]
        public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            // Check if email is already taken
            var existingUser = await _userManager.FindByEmailAsync(dto.NewEmail);
            if (existingUser != null && existingUser.Id != userId)
            {
                return BadRequest(new { Message = "Email is already in use" });
            }

            // Verify current password
            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return BadRequest(new { Message = "Incorrect password" });
            }

            // Generate email change token
            var token = await _userManager.GenerateChangeEmailTokenAsync(user, dto.NewEmail);

            // Send email verification
            var callbackUrl = "https://localhost:3000/confirm-email-change"; // This should come from configuration
            await _emailService.SendAccountVerificationEmailAsync(dto.NewEmail, token, callbackUrl);

            return Ok(new { Message = "Email change verification sent. Please check your new email to confirm the change." });
        }

        // POST: api/UserProfile/confirm-email - Confirm email change
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            var result = await _userManager.ChangeEmailAsync(user, dto.NewEmail, dto.Token);

            if (!result.Succeeded)
            {
                return BadRequest(new { Message = "Failed to confirm email change", Errors = result.Errors });
            }

            // Update username to match email if they were the same before
            if (user.UserName == dto.Email)
            {
                user.UserName = dto.NewEmail;
                user.NormalizedUserName = _userManager.NormalizeName(dto.NewEmail);
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { Message = "Email changed successfully" });
        }

        // DELETE: api/UserProfile - Delete current user account
        [HttpDelete]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            // Verify password
            if (!await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                return BadRequest(new { Message = "Incorrect password" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Get all job applications and delete CV files
                var applications = await _context.JobApplications
                    .Where(j => j.UserId == userId)
                    .ToListAsync();

                foreach (var application in applications)
                {
                    if (!string.IsNullOrEmpty(application.CvFilePath))
                    {
                        _fileService.DeleteFile(application.CvFilePath);
                    }
                }

                // Remove job applications
                _context.JobApplications.RemoveRange(applications);

                // If user is a recruiter, handle job postings
                if (await _userManager.IsInRoleAsync(user, "Recruiter"))
                {
                    var jobPostings = await _context.JobPostings
                        .Where(jp => jp.RecruiterId == userId)
                        .ToListAsync();

                    // Optional: Delete job postings or reassign them
                    // For now, we'll delete them
                    _context.JobPostings.RemoveRange(jobPostings);
                }

                // Save changes to the database
                await _context.SaveChangesAsync();

                // Delete the user account
                var result = await _userManager.DeleteAsync(user);

                if (!result.Succeeded)
                {
                    // Rollback transaction if user deletion fails
                    await transaction.RollbackAsync();
                    return BadRequest(new { Message = "Failed to delete account", Errors = result.Errors });
                }

                // Commit transaction if everything succeeded
                await transaction.CommitAsync();

                // Send confirmation email
                await _emailService.SendAccountDeletionConfirmationAsync(user.Email);

                return Ok(new { Message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user account {userId}");
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "An error occurred while deleting your account" });
            }
        }
    }
}