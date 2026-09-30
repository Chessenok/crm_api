namespace CrmApi.DTOs;

public record PairRequest(string PairingToken, DeviceInfo DeviceInfo);
public record DeviceInfo(string Platform, string Model, string OsVersion, string AppVersion);
public record PushTokenRequest(string DeviceId, string PushToken, string Platform);
public record ActivityRequest(string ClientId, int DurationSeconds, DateTimeOffset Start, DateTimeOffset End, string? Note, double? AiScore);
public record CallTriggerRequest(string UserId, string ClientId, string PhoneNumber);
