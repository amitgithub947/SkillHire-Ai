using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkillHireAI.API.Migrations
{
    /// <summary>
    /// Renames the stored role value only. User ids, the Employers table and every
    /// relationship stay as they are, so existing accounts keep their jobs and applicants.
    /// </summary>
    public partial class RenameEmployerRoleToRecruiter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Users] SET [Role] = N'Recruiter' WHERE [Role] = N'Employer';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Users] SET [Role] = N'Employer' WHERE [Role] = N'Recruiter';");
        }
    }
}
