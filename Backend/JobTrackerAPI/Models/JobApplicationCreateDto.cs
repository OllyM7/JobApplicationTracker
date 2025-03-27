namespace JobTrackerAPI.Models
{
    public class JobApplicationCreateDto
    {
        public string CompanyName { get; set; }
        public string Position { get; set; }
        public int Status { get; set; }
        public DateTime Deadline { get; set; }
        public string Notes { get; set; }
    }
}
