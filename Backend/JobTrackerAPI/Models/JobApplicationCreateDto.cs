namespace JobTrackerAPI.Models
{
    public class JobApplicationCreateDto
    {
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public int Status { get; set; }
        public DateTime Deadline { get; set; }
        public required string Notes { get; set; }
    }
}