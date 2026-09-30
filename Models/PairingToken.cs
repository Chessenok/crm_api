namespace CrmApi.Models;

public sealed class PairingToken(string token, string userId, string companyId, DateTimeOffset expiresAt, bool used)
{
    public string Token { get; } = token;
    public string UserId { get; } = userId;
    public string CompanyId { get; } = companyId;
    public DateTimeOffset ExpiresAt { get; } = expiresAt;
    public bool Used { get; set; } = used;
}
