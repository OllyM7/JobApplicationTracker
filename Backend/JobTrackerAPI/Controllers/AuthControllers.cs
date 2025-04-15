using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using JobTrackerAPI.Services;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly RolesService _rolesService;
        private readonly EmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<IdentityUser> userManager, 
            IConfiguration configuration,
            RolesService rolesService,
            EmailService emailService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _rolesService = rolesService;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new IdentityUser { UserName = model.Email, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Assign the "User" role by default
                await _rolesService.AssignRoleToUserAsync(user, "User");
                
                // Generate email verification token
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                
                // Get the callback URL from configuration
                var callbackUrl = _configuration["EmailSettings:EmailVerificationCallbackUrl"];
                
                if (!string.IsNullOrEmpty(callbackUrl))
                {
                    // Send verification email
                    await _emailService.SendAccountVerificationEmailAsync(user.Email, token, callbackUrl);
                }
                
                // Generate a token that includes role information
                var jwtToken = await GenerateJwtTokenAsync(user);
                
                return Ok(new { 
                    Message = "User registered successfully. Please check your email to verify your account.",
                    Token = jwtToken,
                    Roles = await _rolesService.GetUserRolesAsync(user)
                });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(new { Message = "Invalid credentials" });

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                string authtoken= await NewMethod(user);

                // Get the callback URL from configuration
                var callbackUrl = _configuration["EmailSettings:EmailVerificationCallbackUrl"];

                if (!string.IsNullOrEmpty(callbackUrl))
                {
                    // Send verification email
                    await _emailService.SendAccountVerificationEmailAsync(user.Email, authtoken, callbackUrl);
                }

                return BadRequest(new
                {
                    Message = "Email not confirmed. A new verification link has been sent to your email address."
                });
            }

            // Ensure the user has at least the "User" role
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count == 0)
            {
                _logger.LogInformation($"User {user.Email} has no roles, assigning 'User' role during login");
                var roleResult = await _rolesService.AssignRoleToUserAsync(user, "User");
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to assign 'User' role to {user.Email} during login: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
            }

            // Generate a token that includes role information
            var token = await GenerateJwtTokenAsync(user);
            
            return Ok(new { 
                Token = token,
                Roles = await _rolesService.GetUserRolesAsync(user)
            });

            async Task<string> NewMethod(IdentityUser user)
            {
                // Generate a new verification token
                return await _userManager.GenerateEmailConfirmationTokenAsync(user);
            }
        }

        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            // Specify the redirect URI after successful external login
            var properties = new AuthenticationProperties { RedirectUri = Url.Action("GoogleResponse") };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            // Get the login info from the external provider
            var result = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!result.Succeeded)
            {
                return BadRequest("External authentication error");
            }

            // Extract the email claim
            var externalClaims = result.Principal.Claims;
            var emailClaim = externalClaims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return BadRequest("Email not received from external provider");
            }

            // Find or create a user
            var user = await _userManager.FindByEmailAsync(emailClaim.Value);
            var isNewUser = false;
            
            if (user == null)
            {
                isNewUser = true;
                user = new IdentityUser { UserName = emailClaim.Value, Email = emailClaim.Value, EmailConfirmed = true };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    return BadRequest(createResult.Errors);
                }
                
                // Assign the "User" role for new Google users
                await _rolesService.AssignRoleToUserAsync(user, "User");
            }

            // Ensure the user has at least the "User" role
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count == 0)
            {
                var roleResult = await _rolesService.AssignRoleToUserAsync(user, "User");
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to assign User role: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
            }

            // Generate JWT token
            var token = await GenerateJwtTokenAsync(user);

            // Sign out of the external cookie
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            return Ok(new { 
                Token = token, 
                Roles = await _userManager.GetRolesAsync(user),
                IsNewUser = isNewUser
            });
        }
        
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            
            // Don't reveal if the user doesn't exist for security
            if (user == null)
            {
                return Ok(new { Message = "If your email is registered, you will receive a password reset link." });
            }

            // Generate password reset token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            
            // Get the callback URL from configuration
            var callbackUrl = _configuration["EmailSettings:PasswordResetCallbackUrl"];
            
            if (string.IsNullOrEmpty(callbackUrl))
            {
                _logger.LogError("Password reset callback URL is not configured");
                return StatusCode(500, new { Message = "Server configuration error" });
            }
            
            // Send password reset email
            await _emailService.SendPasswordResetEmailAsync(user.Email, token, callbackUrl);
            
            return Ok(new { Message = "If your email is registered, you will receive a password reset link." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return BadRequest(new { Message = "Invalid token or email" });
            }
            
            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            
            if (result.Succeeded)
            {
                return Ok(new { Message = "Password has been reset successfully. You can now log in with your new password." });
            }
            
            return BadRequest(new { Message = "Failed to reset password", Errors = result.Errors });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            
            if (user == null)
            {
                return BadRequest(new { Message = "Invalid token or email" });
            }
            
            var result = await _userManager.ConfirmEmailAsync(user, model.Token);
            
            if (result.Succeeded)
            {
                return Ok(new { Message = "Email verified successfully. You can now log in." });
            }
            
            return BadRequest(new { Message = "Failed to verify email", Errors = result.Errors });
        }

        // New GET endpoint to handle email verification links
        [HttpGet("verify-email")]
        [Route("verify-email")]
        public IActionResult VerifyEmailRedirect([FromQuery] string token, [FromQuery] string email)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(email))
            {
                return BadRequest("Invalid verification link");
            }
            
            // Redirect to the frontend with the token and email
            var frontendUrl = _configuration["EmailSettings:EmailVerificationCallbackUrl"];
            return Redirect($"{frontendUrl}?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}");
        }

        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationEmailDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            
            if (user == null)
            {
                // Don't reveal that the user does not exist
                return Ok(new { Message = "If your email is registered, you will receive a verification link." });
            }
            
            if (user.EmailConfirmed)
            {
                return BadRequest(new { Message = "Email is already verified" });
            }
            
            // Generate email verification token
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // Get the callback URL from configuration
            var callbackUrl = _configuration["EmailSettings:EmailVerificationCallbackUrl"];
            
            if (string.IsNullOrEmpty(callbackUrl))
            {
                _logger.LogError("Email verification callback URL is not configured");
                return StatusCode(500, new { Message = "Server configuration error" });
            }
            
            // Send verification email
            await _emailService.SendAccountVerificationEmailAsync(user.Email, token, callbackUrl);
            
            return Ok(new { Message = "If your email is registered, you will receive a verification link." });
        }

        private async Task<string> GenerateJwtTokenAsync(IdentityUser user)
        {
            // Get the user's roles
            var roles = await _userManager.GetRolesAsync(user);
            
            // Create a list of claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            
            // Add role claims
            foreach (var role in roles)
            {
                if (!string.IsNullOrEmpty(role))
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }
            }

            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT Key is not configured properly.");
            }
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1), // Increased token expiration to 1 hour
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}