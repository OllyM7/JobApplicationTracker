using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRecruiterAndJobPostingModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApplicationDate",
                table: "JobApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CoverLetter",
                table: "JobApplications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResumeUrl",
                table: "JobApplications",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApplicationDate",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "CoverLetter",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "ResumeUrl",
                table: "JobApplications");
        }
    }
}
