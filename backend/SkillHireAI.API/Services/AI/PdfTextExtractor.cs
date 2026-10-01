using System.Text;
using SkillHireAI.API.Middleware;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;
using UglyToad.PdfPig.Exceptions;

namespace SkillHireAI.API.Services.AI;

/// <summary>Reads the text out of a PDF with PdfPig.</summary>
public static class PdfTextExtractor
{
    public const int MaxPages = 10;

    public static string Extract(byte[] pdf)
    {
        try
        {
            using var document = PdfDocument.Open(pdf);

            if (document.NumberOfPages > MaxPages)
            {
                throw new AppException($"Resumes for AI analysis can have at most {MaxPages} pages.");
            }

            var text = new StringBuilder();
            foreach (var page in document.GetPages())
            {
                text.AppendLine(ContentOrderTextExtractor.GetText(page));
            }

            return text.ToString();
        }
        catch (PdfDocumentEncryptedException)
        {
            throw new AppException("This PDF is password protected. Remove the password and try again.");
        }
        catch (Exception ex) when (ex is not AppException)
        {
            throw new AppException("This PDF could not be read. It may be damaged; try saving it again as a PDF.");
        }
    }
}
