using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace JobTrackerAPI.Models
{
    public class JobApplication
    {
        public int Id { get; set; }
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public JobStatus Status { get; set; }
        public DateTime Deadline { get; set; }
        public required string Notes { get; set; }
        public required string UserId { get; set; }

        // Navigation property for the user who applied
        public IdentityUser? User { get; set; }
        
        // Foreign key for job posting (optional, can be null for manual applications)
        public int? JobPostingId { get; set; }
        
        // Navigation property for job posting, with relationship configuration
        [ForeignKey("JobPostingId")]
        public JobPosting? JobPosting { get; set; }
        
        // New fields for application tracking
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        public string? CoverLetter { get; set; }
        public string? ResumeUrl { get; set; }
    }
}