using CrmApi.Data;
using CrmApi.DTOs;
using CrmApi.Models;

namespace CrmApi.Services;

public sealed class PairingService(ICrmStore store, SessionService sessions)
{
    public (Device Device, string AccessToken)? Pair(PairRequest request)
    {
        if (!store.PairingTokens.TryGetValue(request.PairingToken, out var pairing) || pairing.ExpiresAt < DateTimeOffset.UtcNow || pairing.IsFullyUsed)
            return null;

        pairing.UseCount++;
        var device = new Device(Guid.NewGuid().ToString(), pairing.UserId, pairing.CompanyId, request.DeviceInfo.Platform, request.DeviceInfo.Model, null, DateTimeOffset.UtcNow);
        pairing.PairedDeviceId = device.Id;
        store.Devices[device.Id] = device;
        return (device, sessions.Create(pairing.UserId, pairing.CompanyId, device.Id));
    }

    public (string Token, DateTimeOffset ExpiresAt) CreateDemoToken()
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(5);
        var token = Guid.NewGuid().ToString();
        store.PairingTokens[token] = new PairingToken(token, "user-demo", "ecap-demo", expiresAt, 0);
        return (token, expiresAt);
    }
}
