using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using JobTrackerAPI.Models;

namespace JobTrackerAPI.Data
{
    public class JobContext : IdentityDbContext<IdentityUser>
    {
        public JobContext(DbContextOptions<JobContext> options) : base(options) 
        {
            JobApplications = Set<JobApplication>();
        }
        public DbSet<JobApplication> JobApplications { get; set; }
    }
}
