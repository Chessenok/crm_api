using CrmApi.Data;
using CrmApi.Services;

namespace CrmApi.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddSignalR();
        services.AddSingleton<ICrmStore, InMemoryCrmStore>();
        services.AddSingleton<SessionService>();
        services.AddSingleton<PairingService>();
        services.AddSingleton<SyncService>();
        services.AddSingleton<CallTriggerService>();
        services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true)));
        return services;
    }
}
