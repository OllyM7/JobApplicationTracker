using System;
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

        // Navigation property - marked as nullable because it might not be loaded in all queries
        public IdentityUser? User { get; set; }
    }
}