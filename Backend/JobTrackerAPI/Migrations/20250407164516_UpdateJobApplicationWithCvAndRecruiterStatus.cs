using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJobApplicationWithCvAndRecruiterStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ResumeUrl",
                table: "JobApplications",
                newName: "RecruiterResponseDate");

            migrationBuilder.AddColumn<string>(
                name: "CvFilePath",
                table: "JobApplications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecruiterFeedback",
                table: "JobApplications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecruiterStatus",
                table: "JobApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CvFilePath",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "RecruiterFeedback",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "RecruiterStatus",
                table: "JobApplications");

            migrationBuilder.RenameColumn(
                name: "RecruiterResponseDate",
                table: "JobApplications",
                newName: "ResumeUrl");
        }
    }
}
