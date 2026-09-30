using System.Collections.Concurrent;
using CrmApi.Models;

namespace CrmApi.Data;

public sealed class InMemoryCrmStore : ICrmStore
{
    public IDictionary<string, PairingToken> PairingTokens { get; } = new ConcurrentDictionary<string, PairingToken>();
    public IDictionary<string, Device> Devices { get; } = new ConcurrentDictionary<string, Device>();
    public IDictionary<string, Session> Sessions { get; } = new ConcurrentDictionary<string, Session>();
    public IList<Client> Clients { get; } =
    [
        new("client-1", "ecap-demo", "Andrei Popescu", "0742123456", "VIP", DateTimeOffset.UtcNow),
        new("client-2", "ecap-demo", "Maria Ionescu", "0721334890", "Restant", DateTimeOffset.UtcNow),
        new("client-3", "ecap-demo", "Nordic Design SRL", "0733884221", "Normal", DateTimeOffset.UtcNow),
    ];
    public IList<Order> Orders { get; } =
    [new("order-1", "ecap-demo", "client-1", "#10482", "Livrata", 1240, DateTimeOffset.UtcNow)];
    public IList<Call> Calls { get; } = [];
}
