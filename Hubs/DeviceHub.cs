using CrmApi.Data;
using Microsoft.AspNetCore.SignalR;

namespace CrmApi.Hubs;

public sealed class DeviceHub(ICrmStore store) : Hub
{
    public static string Group(string deviceId) => $"device:{deviceId}";

    public override async Task OnConnectedAsync()
    {
        var deviceId = Context.GetHttpContext()?.Request.Query["device_id"].ToString();
        if (!string.IsNullOrWhiteSpace(deviceId) && store.Devices.TryGetValue(deviceId, out var device))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, Group(deviceId));
            store.Devices[deviceId] = device with { LastSeen = DateTimeOffset.UtcNow };
        }

        await base.OnConnectedAsync();
    }
}
