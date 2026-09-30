namespace CrmApi.Models;

public record Device(string Id, string UserId, string CompanyId, string Platform, string Model, string? PushToken, DateTimeOffset LastSeen);
public record Session(string Token, string UserId, string CompanyId, string DeviceId, DateTimeOffset ExpiresAt);
public record Client(string Id, string CompanyId, string Name, string Phone, string Status, DateTimeOffset UpdatedAt);
public record Order(string Id, string CompanyId, string ClientId, string Number, string Status, decimal Value, DateTimeOffset UpdatedAt);
public record Call(string Id, string CompanyId, string ClientId, int DurationSeconds, DateTimeOffset Start, DateTimeOffset End, string? Note, double? AiScore);
