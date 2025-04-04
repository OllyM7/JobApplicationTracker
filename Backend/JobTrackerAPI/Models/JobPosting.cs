using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace JobTrackerAPI.Models
{
    public class JobPosting
    {
        public int Id { get; set; }
        
        [Required]
        public required string Title { get; set; }
        
        [Required]
        public required string CompanyName { get; set; }
        
        [Required]
        public required string Description { get; set; }
        
        public string? Location { get; set; }
        
        public bool IsRemote { get; set; }
        
        public string? SalaryRange { get; set; }
        
        [Required]
        public required string Requirements { get; set; }
        
        public DateTime PostedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime ApplicationDeadline { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        [Required]
        public required string RecruiterId { get; set; }
        
        // Navigation property
        public IdentityUser? Recruiter { get; set; }
        
        // Navigation property for applications to this job posting
        public List<JobApplication>? Applications { get; set; }
    }
}