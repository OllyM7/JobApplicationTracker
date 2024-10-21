using System;

namespace JobTrackerAPI.Models
{
    public class JobApplication
    {
        public int Id { get; set; }
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public required JobStatus Status { get; set; }  // Use enum for status
        public DateTime Deadline { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}