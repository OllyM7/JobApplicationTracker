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
            JobPostings = Set<JobPosting>();
            RecruiterApplications = Set<RecruiterApplication>();
        }
        
        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<JobPosting> JobPostings { get; set; }
        public DbSet<RecruiterApplication> RecruiterApplications { get; set; }
        
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
    
            // Configure relationship between JobPosting and JobApplication
            builder.Entity<JobPosting>()
                .HasMany(jp => jp.Applications)
                .WithOne(ja => ja.JobPosting)
                .HasForeignKey(ja => ja.JobPostingId)
                .OnDelete(DeleteBehavior.Cascade);
    
            // Configure relationships for RecruiterApplication
            builder.Entity<RecruiterApplication>()
                .HasOne(ra => ra.User)
                .WithMany()
                .HasForeignKey(ra => ra.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        
            builder.Entity<RecruiterApplication>()
                .HasOne(ra => ra.ReviewedBy)
                .WithMany()
                .HasForeignKey(ra => ra.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}