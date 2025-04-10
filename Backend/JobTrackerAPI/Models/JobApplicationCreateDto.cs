namespace JobTrackerAPI.Models
{
    // Existing DTO for creating a manual job application
    public class JobApplicationCreateDto
    {
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public int Status { get; set; }
        public DateTime Deadline { get; set; }
        public required string Notes { get; set; }
    }
    
    // New DTO for applying to a job posting
    public class JobApplicationApplyDto
    {
        public required string Notes { get; set; }
        public string? CoverLetter { get; set; }
        // The CV file will be handled separately in the controller
    }
    
    // DTO for updating an application's status by a recruiter
    public class JobApplicationStatusUpdateDto
    {
        public required ApplicationStatus Status { get; set; }
        public string? Feedback { get; set; }
    }
}