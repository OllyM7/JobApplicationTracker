using System;

namespace JobTrackerAPI.Models
{
    public class JobApplication
    {
        public int Id { get; set; }
        public required string CompanyName { get; set; } //required - keeps the properties non-nullable but enforces that they must be provided when creating a JobApplication object.
        public required string Position { get; set; }
        public required string Status { get; set; }
        public DateTime DateApplied { get; set; }
        public string Notes { get; set; } = string.Empty;  // Default value to avoid null
    }

}
