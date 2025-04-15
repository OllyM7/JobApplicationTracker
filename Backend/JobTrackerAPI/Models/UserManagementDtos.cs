using System.ComponentModel.DataAnnotations;

namespace JobTrackerAPI.Models
{
    // Authentication DTOs
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        public required string Password { get; set; }
        
        public bool RememberMe { get; set; } = false;
    }

    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public required string Password { get; set; }
    }

    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        public required string Token { get; set; }
        
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public required string NewPassword { get; set; }
    }

    public class VerifyEmailDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        public required string Token { get; set; }
    }

    public class ResendVerificationEmailDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }

    // User Profile DTOs
    public class UserProfileDto
    {
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string>();
        public bool EmailConfirmed { get; set; }
        public string? PhoneNumber { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public int ApplicationCount { get; set; }
    }

    public class UpdateUserProfileDto
    {
        public string? UserName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public required string CurrentPassword { get; set; }
        
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public required string NewPassword { get; set; }
    }

    public class ChangeEmailDto
    {
        [Required]
        [EmailAddress]
        public required string NewEmail { get; set; }
        
        [Required]
        public required string Password { get; set; } // Current password for verification
    }

    public class ConfirmEmailDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; } // Current email
        
        [Required]
        [EmailAddress]
        public required string NewEmail { get; set; }
        
        [Required]
        public required string Token { get; set; }
    }

    public class DeleteAccountDto
    {
        [Required]
        public required string Password { get; set; } // Current password for verification
    }
}