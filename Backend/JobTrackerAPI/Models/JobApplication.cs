using System;
using Microsoft.AspNetCore.Identity;

namespace JobTrackerAPI.Models
{
    public class JobApplication
    {
        public int Id { get; set; }
        public string CompanyName { get; set; }
        public string Position { get; set; }
        public JobStatus Status { get; set; }
        public DateTime Deadline { get; set; }
        public string Notes { get; set; }
        public string UserId { get; set; }

        // Navigation property REMEMBER THIS LATER
        public IdentityUser User { get; set; }
    }
}
