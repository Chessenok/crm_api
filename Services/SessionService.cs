using CrmApi.Data;
using CrmApi.Models;

namespace CrmApi.Services;

public sealed class SessionService(ICrmStore store)
{
    public string Create(string userId, string companyId, string deviceId)
    {
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        store.Sessions[token] = new Session(token, userId, companyId, deviceId, DateTimeOffset.UtcNow.AddDays(30));
        return token;
    }

    public Session? Get(HttpRequest request)
    {
        var token = request.Headers.Authorization.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        return store.Sessions.TryGetValue(token, out var session) && session.ExpiresAt > DateTimeOffset.UtcNow ? session : null;
    }

    public bool Remove(HttpRequest request)
    {
        var session = Get(request);
        return session is not null && store.Sessions.Remove(session.Token);
    }
}
