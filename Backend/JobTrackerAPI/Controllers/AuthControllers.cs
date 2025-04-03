using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using JobTrackerAPI.Services;

namespace JobTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly RolesService _rolesService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<IdentityUser> userManager, 
            IConfiguration configuration,
            RolesService rolesService,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _rolesService = rolesService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new IdentityUser { UserName = model.Email, Email = model.Email };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Always assign the "User" role by default
                var roleResult = await _rolesService.AssignRoleToUserAsync(user, "User");
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to assign 'User' role to {user.Email} during registration: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
                
                // Generate a token that includes role information
                var token = await GenerateJwtTokenAsync(user);
                
                return Ok(new { 
                    Message = "User registered successfully",
                    Token = token,
                    Roles = await _rolesService.GetUserRolesAsync(user)
                });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(new { Message = "Invalid credentials" });

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
        }

        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties { RedirectUri = Url.Action("GoogleResponse") };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            var result = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
            if (!result.Succeeded)
            {
                return BadRequest("External authentication error");
            }

            var externalClaims = result.Principal.Claims;
            var emailClaim = externalClaims.FirstOrDefault(c => c.Type == ClaimTypes.Email);
            if (emailClaim == null)
            {
                return BadRequest("Email not received from external provider");
            }

            var user = await _userManager.FindByEmailAsync(emailClaim.Value);
            bool isNewUser = false;
            
            if (user == null)
            {
                isNewUser = true;
                user = new IdentityUser { UserName = emailClaim.Value, Email = emailClaim.Value };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    return BadRequest(createResult.Errors);
                }
            }
            
            // Check if the user has any roles
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count == 0)
            {
                // Assign the "User" role if the user has no roles
                _logger.LogInformation($"{(isNewUser ? "New" : "Existing")} Google user {user.Email} has no roles, assigning 'User' role");
                var roleResult = await _rolesService.AssignRoleToUserAsync(user, "User");
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to assign 'User' role to Google user {user.Email}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
            }

            // Generate a token that includes role information
            var token = await GenerateJwtTokenAsync(user);

            // Sign out of the external cookie
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            return Ok(new { 
                Token = token,
                Roles = await _rolesService.GetUserRolesAsync(user)
            });
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