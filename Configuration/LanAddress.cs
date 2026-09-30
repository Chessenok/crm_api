using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace CrmApi.Configuration;

public static class LanAddress
{
    public static string Get()
    {
        foreach (var networkInterface in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (networkInterface.OperationalStatus != OperationalStatus.Up) continue;
            if (networkInterface.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel) continue;
            var address = networkInterface.GetIPProperties().UnicastAddresses
                .FirstOrDefault(item => item.Address.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(item.Address));
            if (address is not null) return address.Address.ToString();
        }

        return "localhost";
    }
}
