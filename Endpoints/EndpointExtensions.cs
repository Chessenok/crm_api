using CrmApi.Configuration;
using CrmApi.Data;
using CrmApi.DTOs;
using CrmApi.Hubs;
using CrmApi.Services;

namespace CrmApi.Extensions;

public static class EndpointExtensions
{
    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        var baseUrl = $"http://{LanAddress.Get()}:5144";

        app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "Mobile CRM API", url = baseUrl }));

        app.MapPost("/auth/pair", (PairRequest request, PairingService pairing) =>
        {
            var result = pairing.Pair(request);
            return result is null
                ? Results.Unauthorized()
                : Results.Ok(new { access_token = result.Value.AccessToken, device_id = result.Value.Device.Id, user_id = result.Value.Device.UserId, company_id = result.Value.Device.CompanyId, expires_in_days = 30 });
        });

        app.MapPost("/auth/logout", (HttpRequest request, SessionService sessions) => sessions.Remove(request) ? Results.NoContent() : Results.Unauthorized());

        app.MapPost("/devices/push-token", (PushTokenRequest body, HttpRequest request, SessionService sessions, ICrmStore store) =>
        {
            var session = sessions.Get(request);
            if (session is null || session.DeviceId != body.DeviceId || !store.Devices.TryGetValue(body.DeviceId, out var device)) return Results.Unauthorized();
            store.Devices[body.DeviceId] = device with { PushToken = body.PushToken, LastSeen = DateTimeOffset.UtcNow };
            return Results.NoContent();
        });

        app.MapGet("/sync/full", (HttpRequest request, SessionService sessions, SyncService sync) =>
        {
            var session = sessions.Get(request);
            return session is null ? Results.Unauthorized() : Results.Ok(sync.Get(session.CompanyId, DateTimeOffset.MinValue));
        });

        app.MapGet("/sync/delta", (long? from, HttpRequest request, SessionService sessions, SyncService sync) =>
        {
            var session = sessions.Get(request);
            if (session is null) return Results.Unauthorized();
            var timestamp = from.HasValue ? DateTimeOffset.FromUnixTimeMilliseconds(from.Value) : DateTimeOffset.MinValue;
            return Results.Ok(sync.Get(session.CompanyId, timestamp));
        });

        app.MapPost("/sync/batch", (IReadOnlyList<ActivityRequest> activities, HttpRequest request, SessionService sessions, SyncService sync) =>
        {
            var session = sessions.Get(request);
            if (session is null) return Results.Unauthorized();
            return Results.Ok(new { processed = sync.AddActivities(session.CompanyId, activities), server_ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
        });

        app.MapPost("/calls/trigger", async (CallTriggerRequest body, HttpRequest request, SessionService sessions, CallTriggerService calls) =>
        {
            var session = sessions.Get(request);
            if (session is null) return Results.Unauthorized();
            var result = await calls.Trigger(session, body.UserId, body.ClientId, body.PhoneNumber);
            if (result.Method == "unauthorized") return Results.Unauthorized();
            return Results.Ok(new { device_found = result.Found, delivery_method = result.Method });
        });

        app.MapPost("/demo/pairing-token", (PairingService pairing) =>
        {
            var token = pairing.CreateDemoToken();
            return Results.Ok(new { token = token.Token, api_url = baseUrl, company_id = "ecap-demo", expires_at = token.ExpiresAt });
        });

        app.MapHub<DeviceHub>("/hubs/device");
        app.MapFallbackToFile("index.html");
        return app;
    }
}
