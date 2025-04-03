using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace JobTrackerAPI.Services
{
    public class RoleMigrationUtility
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<RoleMigrationUtility> _logger;

        public RoleMigrationUtility(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<RoleMigrationUtility> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        public async Task MigrateExistingUsersToRoles()
        {
            _logger.LogInformation("Starting role migration for existing users...");
            
            // Ensure the "User" role exists
            if (!await _roleManager.RoleExistsAsync("User"))
            {
                _logger.LogInformation("Creating 'User' role as it doesn't exist");
                await _roleManager.CreateAsync(new IdentityRole("User"));
            }

            // Get all users
            var users = _userManager.Users.ToList();
            _logger.LogInformation($"Found {users.Count} users to check for role migration");

            int migratedCount = 0;
            foreach (var user in users)
            {
                // Check if the user has any roles
                var userRoles = await _userManager.GetRolesAsync(user);
                if (userRoles.Count == 0)
                {
                    // User has no roles, assign the "User" role
                    var result = await _userManager.AddToRoleAsync(user, "User");
                    if (result.Succeeded)
                    {
                        migratedCount++;
                        _logger.LogInformation($"Successfully assigned 'User' role to {user.Email}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to assign 'User' role to {user.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }
                }
            }

            _logger.LogInformation($"Role migration complete. {migratedCount} users were assigned the 'User' role");
        }
    }
}