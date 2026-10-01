using System.ComponentModel.DataAnnotations;

namespace SkillHireAI.API.DTOs.Validation;

/// <summary>
/// Fails when this value is less than another property on the same object.
/// Runs with the other field attributes, unlike IValidatableObject which only
/// runs once every field is already valid.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public class NotLessThanAttribute : ValidationAttribute
{
    private readonly string _otherProperty;

    public NotLessThanAttribute(string otherProperty)
    {
        _otherProperty = otherProperty;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        var other = context.ObjectType.GetProperty(_otherProperty)?.GetValue(context.ObjectInstance);

        if (value is IComparable current && other is not null && current.CompareTo(other) < 0)
        {
            return new ValidationResult(
                ErrorMessage ?? $"{context.DisplayName} cannot be less than {_otherProperty}.",
                new[] { context.MemberName! });
        }

        return ValidationResult.Success;
    }
}
