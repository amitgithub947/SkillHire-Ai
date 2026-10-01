using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillHireAI.API.Migrations
{
    /// <inheritdoc />
    public partial class EmployerProfileAndJobManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Employers",
                newName: "CompanyDescription");

            migrationBuilder.AddColumn<int>(
                name: "ExperienceRequired",
                table: "Jobs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Jobs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Jobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Jobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Employers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Status",
                table: "Jobs",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Jobs_Status",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ExperienceRequired",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Employers");

            migrationBuilder.RenameColumn(
                name: "CompanyDescription",
                table: "Employers",
                newName: "Description");
        }
    }
}
