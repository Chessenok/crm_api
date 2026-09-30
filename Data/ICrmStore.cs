using CrmApi.Models;

namespace CrmApi.Data;

public interface ICrmStore
{
    IDictionary<string, PairingToken> PairingTokens { get; }
    IDictionary<string, Device> Devices { get; }
    IDictionary<string, Session> Sessions { get; }
    IList<Client> Clients { get; }
    IList<Order> Orders { get; }
    IList<Call> Calls { get; }
}
