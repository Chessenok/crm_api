namespace CrmApi.Models;

public sealed class PairingToken(string token, string userId, string companyId, DateTimeOffset expiresAt, int useCount = 0)
{
    public string Token { get; } = token;
    public string UserId { get; } = userId;
    public string CompanyId { get; } = companyId;
    public DateTimeOffset ExpiresAt { get; } = expiresAt;
    public int UseCount { get; set; } = useCount;
    public bool IsFullyUsed => UseCount >= 1;
    public string? PairedDeviceId { get; set; }
}
