using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

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
        
        // Application tracking and document fields
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        
        // Cover letter content (stored as text in the database)
        public string? CoverLetter { get; set; }
        
        // Resume/CV (stored as a file path or URL)
        public string? CvFilePath { get; set; }
        
        // Status of the application from the recruiter's perspective
        public ApplicationStatus RecruiterStatus { get; set; } = ApplicationStatus.Pending;
        
        // Feedback from the recruiter (visible to the applicant)
        public string? RecruiterFeedback { get; set; }
        
        // Date when the recruiter last updated the status
        public DateTime? RecruiterResponseDate { get; set; }
    }
    
    // Enum to track the application status from the recruiter's side
    public enum ApplicationStatus
    {
        Pending = 0,
        Reviewing = 1,
        InterviewRequested = 2,
        Rejected = 3,
        Accepted = 4
    }
}