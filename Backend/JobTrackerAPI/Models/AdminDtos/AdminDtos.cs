using JobTrackerAPI.Models;

namespace JobTrackerAPI.Models
{
    public class UserDetailsDto
    {
        public string Id { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? UserName { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public int JobCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    public class UserRoleDto
    {
        public required string UserId { get; set; }
        public required string RoleName { get; set; }
    }

    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalJobs { get; set; }
        public List<StatusCountDto> JobsByStatus { get; set; } = new List<StatusCountDto>();
        public List<UserJobCountDto> UserJobCounts { get; set; } = new List<UserJobCountDto>();
        public List<JobApplication> UpcomingDeadlines { get; set; } = new List<JobApplication>();
    }

    public class StatusCountDto
    {
        public string Status { get; set; } = null!;
        public int Count { get; set; }
    }

    public class UserJobCountDto
    {
        public string UserId { get; set; } = null!;
        public string? UserEmail { get; set; }
        public int Count { get; set; }
    }

    public class JobDetailsAdminDto
    {
        public int Id { get; set; }
        public required string CompanyName { get; set; }
        public required string Position { get; set; }
        public JobStatus Status { get; set; }
        public DateTime Deadline { get; set; }
        public required string Notes { get; set; }
        public required string UserId { get; set; }
        public string? UserEmail { get; set; }
    }
}