# Mobile CRM API (crm_api)

Backend API for the **ECAP Mobile CRM Agent** application. Provides real-time synchronization, device pairing, and call triggering capabilities for field sales agents.

## Project Overview

This ASP.NET Core 8.0 Web API serves as the backend for a mobile CRM application used by field sales agents. It enables:

- **Device Pairing** - Secure token-based device registration
- **Real-time Sync** - Full/delta/batch synchronization of clients, orders, and call activities
- **Call Triggering** - WebSocket-based call initiation from mobile devices
- **Demo Dashboard** - Web-based testing interface at `/`

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Mobile App │────▶│  crm_api    │◀───▶│  Dashboard  │
│  (Agent)    │     │  (ASP.NET)  │     │  (Web)      │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┴───────────────────┘
                    SignalR / WebSocket
```

### Tech Stack

- **Framework**: ASP.NET Core 8.0
- **Real-time**: SignalR (WebSockets)
- **API Docs**: Swagger/OpenAPI
- **Storage**: In-memory (development) - `ICrmStore` abstraction for production DB
- **Auth**: Bearer token (session-based)

## Project Structure

```
crm_api/
├── Program.cs                    # Entry point
├── crm_api.csproj               # Project config
├── appsettings.json             # Configuration
├── Configuration/
│   └── LanAddress.cs            # LAN IP detection
├── Data/
│   ├── ICrmStore.cs             # Data abstraction
│   └── InMemoryCrmStore.cs      # In-memory implementation
├── DTOs/
│   └── ApiRequests.cs           # Request/response models
├── Endpoints/
│   └── EndpointExtensions.cs    # API endpoint mapping
├── Extensions/
│   ├── ServiceCollectionExtensions.cs  # DI registration
│   └── WebApplicationExtensions.cs     # Middleware pipeline
├── Hubs/
│   └── DeviceHub.cs             # SignalR hub for devices
├── Models/
│   ├── CrmModels.cs             # Domain models
│   └── PairingToken.cs          # Pairing token model
├── Services/
│   ├── PairingService.cs        # Device pairing logic
│   ├── SessionService.cs        # Session/token management
│   ├── SyncService.cs           # Data synchronization
│   └── CallTriggerService.cs    # Call triggering via SignalR
└── wwwroot/
    ├── index.html               # Demo dashboard
    ├── app.js                   # Dashboard logic
    └── style.css                # Dashboard styles
```

## Domain Models

| Model | Description |
|-------|-------------|
| `Device` | Registered mobile device (platform, model, push token) |
| `Session` | Authenticated session (30-day expiry) |
| `Client` | CRM client (name, phone, status: VIP/Restant/Normal) |
| `Order` | Client order (number, status, value) |
| `Call` | Call activity (duration, timestamps, AI score, notes) |
| `PairingToken` | One-time pairing token (5-min expiry) |

## API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + base URL |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/pair` | Pair device using pairing token |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/demo/pairing-token` | Generate demo pairing token |

### Device Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/devices/push-token` | Register push notification token |

### Synchronization
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sync/full` | Full sync (all clients, orders, calls) |
| `GET` | `/sync/delta?from=<ts>` | Delta sync since timestamp |
| `POST` | `/sync/batch` | Batch upload call activities |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/calls/trigger` | Trigger call on agent's device |

### Real-time (SignalR)
| Hub | Endpoint | Description |
|-----|----------|-------------|
| `DeviceHub` | `/hubs/device` | WebSocket for call triggers |

## Getting Started

### Prerequisites
- .NET 8.0 SDK

### Run Locally
```bash
dotnet restore
dotnet run
```

API available at:
- `http://localhost:5144` (HTTP)
- `https://localhost:7144` (HTTPS)
- Swagger UI: `/swagger`
- Demo Dashboard: `/`

### Demo Flow
1. Open `/` in browser
2. Click **Generate Token** → QR code appears
3. Scan with mobile app or copy token
4. Mobile app calls `/auth/pair` with token
5. Dashboard shows connected device
6. Test call triggering from dashboard

## Configuration

### appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Port Configuration
Default ports in `Properties/launchSettings.json`:
- HTTP: 5144
- HTTPS: 7144

## Extending for Production

### Replace In-Memory Store
Implement `ICrmStore` for your database:
```csharp
public class SqlCrmStore : ICrmStore { ... }
```
Register in `ServiceCollectionExtensions.cs`:
```csharp
services.AddSingleton<ICrmStore, SqlCrmStore>();
```

### Add Persistent Storage
- Sessions → Redis or database
- Pairing tokens → Database with TTL
- Clients/Orders/Calls → PostgreSQL, SQL Server, etc.

### Authentication Enhancements
- JWT tokens with refresh rotation
- Device fingerprinting
- Multi-tenant isolation (by `CompanyId`)

### Observability
- Add structured logging (Serilog)
- Metrics (Prometheus/OpenTelemetry)
- Distributed tracing

## Key Design Decisions

1. **Minimal API** - No controllers, uses `MapGet`/`MapPost` for simplicity
2. **Extension Methods** - Clean separation of DI, middleware, endpoints
3. **In-Memory First** - Fast iteration, swap store for production
4. **SignalR Groups** - Per-device groups for targeted call triggers
5. **CompanyId Isolation** - Multi-tenant ready via `CompanyId` on all entities

## Testing

### HTTP Requests
Use `crm_api.http` file with VS Code REST Client or Rider.

### Manual Testing
1. Start API
2. Open `/` → Generate token
3. Use Swagger `/swagger` to test endpoints
4. Check SignalR connection in browser DevTools

## License

MIT