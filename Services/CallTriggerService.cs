using CrmApi.Data;
using CrmApi.Hubs;
using CrmApi.Models;
using Microsoft.AspNetCore.SignalR;

namespace CrmApi.Services;

public sealed class CallTriggerService(ICrmStore store, IHubContext<DeviceHub> hub)
{
    public async Task<(bool Found, string Method)> Trigger(Session session, string userId, string clientId, string phoneNumber)
    {
        if (!store.Clients.Any(client => client.Id == clientId && client.CompanyId == session.CompanyId))
            return (false, "unauthorized");

        var device = store.Devices.Values
            .Where(device => device.UserId == userId && device.CompanyId == session.CompanyId)
            .OrderByDescending(device => device.LastSeen)
            .FirstOrDefault();
        if (device is null) return (false, "not_found");

        await hub.Clients.Group(DeviceHub.Group(device.Id)).SendAsync("call.trigger", new { client_id = clientId, phone_number = phoneNumber });
        return (true, "websocket");
    }
}
