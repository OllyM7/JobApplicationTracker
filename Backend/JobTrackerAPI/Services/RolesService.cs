using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace JobTrackerAPI.Services
{
    public class RolesService
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly ILogger<RolesService> _logger;

        public RolesService(
            RoleManager<IdentityRole> roleManager,
            UserManager<IdentityUser> userManager,
            ILogger<RolesService> logger)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task EnsureRolesCreatedAsync()
        {
            string[] roles = { "Admin", "User", "Recruiter" };

            foreach (var roleName in roles)
            {
                // Check if the role already exists
                var roleExists = await _roleManager.RoleExistsAsync(roleName);
                
                if (!roleExists)
                {
                    // Create the role if it doesn't exist
                    _logger.LogInformation($"Creating role: {roleName}");
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }

        public async Task<IdentityResult> AssignRoleToUserAsync(IdentityUser user, string roleName)
        {
            // Check if the role exists
            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                _logger.LogWarning($"Role {roleName} does not exist");
                throw new Exception($"Role {roleName} does not exist.");
            }

            // Check if the user is already in the role
            var isInRole = await _userManager.IsInRoleAsync(user, roleName);
            if (isInRole)
            {
                _logger.LogInformation($"User {user.Email} is already in role {roleName}");
                return IdentityResult.Success;
            }

            // Add the user to the role
            _logger.LogInformation($"Adding user {user.Email} to role {roleName}");
            return await _userManager.AddToRoleAsync(user, roleName);
        }

        public async Task<IdentityResult> RemoveRoleFromUserAsync(IdentityUser user, string roleName)
        {
            // Check if the role exists
            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (!roleExists)
            {
                _logger.LogWarning($"Role {roleName} does not exist");
                throw new Exception($"Role {roleName} does not exist.");
            }

            // Check if the user is in the role
            var isInRole = await _userManager.IsInRoleAsync(user, roleName);
            if (!isInRole)
            {
                _logger.LogInformation($"User {user.Email} is not in role {roleName}");
                return IdentityResult.Success;
            }

            // Special handling for Admin role - ensure we're not removing the last admin
            if (roleName == "Admin")
            {
                var admins = await _userManager.GetUsersInRoleAsync("Admin");
                if (admins.Count == 1 && admins.First().Id == user.Id)
                {
                    _logger.LogWarning("Attempt to remove the Admin role from the last admin user");
                    throw new Exception("Cannot remove the Admin role from the last admin user.");
                }
            }

            // Remove the user from the role
            _logger.LogInformation($"Removing user {user.Email} from role {roleName}");
            return await _userManager.RemoveFromRoleAsync(user, roleName);
        }

        public async Task<IList<string>> GetUserRolesAsync(IdentityUser user)
        {
            return await _userManager.GetRolesAsync(user);
        }

        public async Task<bool> IsUserInRoleAsync(IdentityUser user, string roleName)
        {
            return await _userManager.IsInRoleAsync(user, roleName);
        }

        public async Task<List<string>> GetAllRolesAsync()
        {
            var roles = await _roleManager.Roles.Select(r => r.Name).ToListAsync();
            return roles.Where(r => r != null).Cast<string>().ToList();
        }

        public async Task<IdentityResult> CreateRoleAsync(string roleName)
        {
            // Check if the role already exists
            var roleExists = await _roleManager.RoleExistsAsync(roleName);
            if (roleExists)
            {
                _logger.LogInformation($"Role {roleName} already exists");
                return IdentityResult.Success;
            }

            // Create the role
            _logger.LogInformation($"Creating new role: {roleName}");
            return await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        public async Task<IdentityResult> DeleteRoleAsync(string roleName)
        {
            // Find the role
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                _logger.LogWarning($"Role {roleName} not found");
                return IdentityResult.Failed(new IdentityError { Description = $"Role {roleName} not found" });
            }

            // Check if the role is in use
            var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
            if (usersInRole.Count > 0)
            {
                _logger.LogWarning($"Cannot delete role {roleName} as it has {usersInRole.Count} users");
                return IdentityResult.Failed(new IdentityError 
                { 
                    Description = $"Cannot delete role {roleName} as it has {usersInRole.Count} users" 
                });
            }

            // Delete the role
            _logger.LogInformation($"Deleting role: {roleName}");
            return await _roleManager.DeleteAsync(role);
        }
    }
}