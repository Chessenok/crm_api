using CrmApi.Data;
using CrmApi.DTOs;

namespace CrmApi.Services;

public sealed class SyncService(ICrmStore store)
{
    public object Get(string companyId, DateTimeOffset from) => new
    {
        clients = store.Clients.Where(client => client.CompanyId == companyId && client.UpdatedAt >= from),
        orders = store.Orders.Where(order => order.CompanyId == companyId && order.UpdatedAt >= from),
        calls = store.Calls.Where(call => call.CompanyId == companyId && call.End >= from),
        deleted_ids = Array.Empty<string>(),
        server_ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
    };

    public int AddActivities(string companyId, IReadOnlyList<ActivityRequest> activities)
    {
        foreach (var activity in activities.Where(activity => store.Clients.Any(client => client.Id == activity.ClientId && client.CompanyId == companyId)))
        {
            store.Calls.Add(new Models.Call(Guid.NewGuid().ToString(), companyId, activity.ClientId, activity.DurationSeconds, activity.Start, activity.End, activity.Note, activity.AiScore));
        }

        return activities.Count;
    }
}
