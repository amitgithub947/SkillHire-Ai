using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillHireAI.API.Migrations
{
    /// <inheritdoc />
    public partial class ResumeAnalysisDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Model",
                table: "ResumeAnalyses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Projects",
                table: "ResumeAnalyses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResumeFileName",
                table: "ResumeAnalyses",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "ResumeAnalyses",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Technologies",
                table: "ResumeAnalyses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalExperienceYears",
                table: "ResumeAnalyses",
                type: "decimal(4,1)",
                precision: 4,
                scale: 1,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Model",
                table: "ResumeAnalyses");

            migrationBuilder.DropColumn(
                name: "Projects",
                table: "ResumeAnalyses");

            migrationBuilder.DropColumn(
                name: "ResumeFileName",
                table: "ResumeAnalyses");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "ResumeAnalyses");

            migrationBuilder.DropColumn(
                name: "Technologies",
                table: "ResumeAnalyses");

            migrationBuilder.DropColumn(
                name: "TotalExperienceYears",
                table: "ResumeAnalyses");
        }
    }
}
