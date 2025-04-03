using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace JobTrackerAPI.Middleware
{
    public class RoleEnforcementMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RoleEnforcementMiddleware> _logger;

        public RoleEnforcementMiddleware(RequestDelegate next, ILogger<RoleEnforcementMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(
            HttpContext context, 
            UserManager<IdentityUser> userManager, 
            RoleManager<IdentityRole> roleManager)
        {
            // Only process if the user is authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                // Get the user ID from the claims
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userId))
                {
                    // Get the user from the user manager
                    var user = await userManager.FindByIdAsync(userId);
                    if (user != null)
                    {
                        // Check if the user has any roles
                        var userRoles = await userManager.GetRolesAsync(user);
                        if (userRoles.Count == 0)
                        {
                            // Ensure the "User" role exists
                            if (!await roleManager.RoleExistsAsync("User"))
                            {
                                await roleManager.CreateAsync(new IdentityRole("User"));
                                _logger.LogInformation("Created 'User' role as it didn't exist");
                            }

                            // Assign the "User" role
                            var result = await userManager.AddToRoleAsync(user, "User");
                            if (result.Succeeded)
                            {
                                _logger.LogInformation($"Assigned 'User' role to {user.Email} during request processing");
                                
                                // For JWT authentication, we don't need to re-sign in
                                // The new role will be included in future JWT tokens
                                _logger.LogInformation($"Role 'User' assigned to {user.Email} - it will be included in their next token");
                            }
                            else
                            {
                                _logger.LogWarning($"Failed to assign 'User' role to {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                            }
                        }
                    }
                }
            }

            // Continue processing the request
            await _next(context);
        }
    }

    // Extension method to make it easier to add the middleware
    public static class RoleEnforcementMiddlewareExtensions
    {
        public static IApplicationBuilder UseRoleEnforcement(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RoleEnforcementMiddleware>();
        }
    }
}