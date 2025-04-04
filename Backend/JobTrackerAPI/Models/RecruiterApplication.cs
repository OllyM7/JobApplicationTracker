using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace JobTrackerAPI.Models
{
    public enum RecruiterApplicationStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    public class RecruiterApplication
    {
        public int Id { get; set; }
        
        [Required]
        public required string UserId { get; set; }
        
        // Navigation property
        public IdentityUser? User { get; set; }
        
        [Required]
        public required string CompanyName { get; set; }
        
        [Required]
        public required string CompanyWebsite { get; set; }
        
        [Required]
        public required string JobTitle { get; set; }
        
        [Required]
        public required string Motivation { get; set; }
        
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        
        public RecruiterApplicationStatus Status { get; set; } = RecruiterApplicationStatus.Pending;
        
        public string? ReviewedByUserId { get; set; }
        
        // Navigation property for the admin who reviewed the application
        public IdentityUser? ReviewedBy { get; set; }
        
        public DateTime? ReviewDate { get; set; }
        
        public string? RejectionReason { get; set; }
    }
}