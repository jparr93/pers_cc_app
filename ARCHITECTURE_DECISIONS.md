# Architectural Decision Records (ADRs)

## Overview

This document records important architectural decisions made for the Clarion Connections Pairing App. Each decision includes context, rationale, and consequences to help future developers understand the design choices and their trade-offs.

---

## ADR-001: Separate Client and Server Architecture

**Status:** Accepted  
**Date:** 2026-04-23

### Context

The Pairing App needed to serve both static frontend assets and provide an API for business logic. We had to decide between:
- Monolithic server serving everything
- Separate frontend and backend repositories
- Separate frontend and backend in the same monorepo

### Decision

Adopt a **monorepo structure with separate but co-located client and server** packages within the same repository.

### Consequences

**Positive:**
- Single repository simplifies deployment orchestration
- Easier to coordinate changes between frontend and backend
- Shared tooling configuration (package.json workspaces)
- Simpler CI/CD pipeline management

**Negative:**
- Requires careful package management with npm workspaces
- Frontend and backend tightly coupled in deployment
- Developers need understanding of both client and server

### Alternatives Considered

- **Separate repositories**: Would enable independent scaling and deployment but added complexity to orchestration
- **Traditional monolith**: Would simplify some aspects but reduce code organization and scalability options

---

## ADR-002: Node.js + Express + TypeScript Backend

**Status:** Superseded (see ADR-011)  
**Date:** 2026-04-23  
**Superseded By:** ADR-011 (2026-04-23)

### Context

Backend needed to:
- Parse CSV files
- Generate pairings with deduplication logic
- Communicate with Azure Table Storage
- Provide REST API endpoints
- Support future enhancements

### Decision

Use **Node.js 24.x** with **Express.js** framework and **TypeScript** for type safety.

### Consequences

**Positive:**
- Consistent JavaScript/TypeScript across full stack
- Rich ecosystem with Azure SDK for Node.js
- Fast development and iteration
- Good performance for I/O-bound operations
- TypeScript provides compile-time error checking

**Negative:**
- Single-threaded event loop limitations for CPU-intensive workloads
- Less suitable for heavy computational algorithms
- Fewer developers familiar with TypeScript vs. JavaScript

### Alternatives Considered

- **Python/Flask**: Easier CSV processing, but adds language complexity
- **C#/.NET**: Native Azure integration, but adds infrastructure complexity
- **Vanilla Node.js**: Simpler setup but loses type safety benefits

---

## ADR-003: Azure Table Storage for Persistence

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application needed to persist generated pairings and prevent duplicate pairings across months. Key requirements:
- Low latency queries
- Minimal infrastructure maintenance
- Cost-effective for small-scale data
- Native Azure integration with managed identities

### Decision

Use **Azure Table Storage** as the primary data store for pairings and pairing history.

### Consequences

**Positive:**
- NoSQL flexibility for varied pairing data
- Automatic scalability
- No database server management
- Native managed identity authentication (no connection strings in code)
- Cost-effective for low transaction volumes
- Built-in partitioning and replication

**Negative:**
- Limited query capabilities compared to relational databases
- No complex joins or transactions
- Data model must account for partition key design
- Eventual consistency model

### Alternatives Considered

- **SQL Database (Azure)**: More powerful queries but higher operational overhead
- **Cosmos DB**: More expensive for this workload scale
- **Local SQLite**: Simplicity but no cloud persistence or multi-instance support

### Implementation Notes

- Pairings stored with PartitionKey as month/year, RowKey as participant pair
- Previous pairings tracked to prevent duplicates within 12-month rolling window

---

## ADR-004: Vanilla JavaScript Frontend (Initially)

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Frontend needed to:
- Upload CSV files
- Trigger pairing generation
- Display results in an intuitive UI
- Export pairings to CSV/clipboard
- Support dark mode

### Decision

Start with **vanilla HTML + CSS + JavaScript** in the client package for simplicity and minimal build complexity.

### Consequences

**Positive:**
- No build process required
- Minimal dependencies
- Fast initial development
- Easy deployment (static assets)
- No JavaScript framework learning curve

**Negative:**
- Limited scalability for complex UI interactions
- Manual DOM manipulation harder to maintain
- State management becomes complex at scale
- No component reusability framework

### Alternatives Considered

- **React**: Better for complex UIs, but adds build and deployment overhead
- **Vue/Angular**: Similar trade-offs as React
- **Web Components**: Good middle ground but less mature ecosystem

### Future Evolution Path

If the application grows to require more interactivity, migration path:
1. Extract into React components
2. Set up Vite or Webpack
3. Maintain same API contract with backend
4. Gradual component migration

---

## ADR-005: GitHub Actions for CI/CD

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application needed automated deployment to Azure App Services with:
- Build and test automation
- Secure credential management
- Multi-environment support (dev/production)

### Decision

Use **GitHub Actions** for CI/CD pipeline with YAML workflow files stored in `.github/workflows/`.

### Consequences

**Positive:**
- Native GitHub integration with no external tools
- Secure GitHub Secrets management
- Matrix testing across environments
- Flexible and powerful workflow syntax
- Free tier adequate for this project scale
- Built-in logging and debugging

**Negative:**
- Vendor lock-in to GitHub
- Limited local debugging capabilities
- Learning curve for complex workflows

### Alternatives Considered

- **Azure DevOps Pipelines**: Native Azure integration but less GitHub-friendly
- **Jenkins**: Self-hosted option but requires maintenance
- **GitLab CI/CD**: Good but project uses GitHub

### Implementation Details

- Triggered on push to main branch and pull requests
- Builds and tests both client and server
- Deploys to Azure App Services via GitHub Secrets containing Azure credentials

---

## ADR-006: Managed Identities for Azure Authentication

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application needs to access Azure Table Storage. Key requirements:
- No hardcoded connection strings or keys
- Secure credential rotation
- Following Azure security best practices
- Azure-native authentication

### Decision

Use **Azure Managed Identities** for application authentication to Azure services instead of connection strings or access keys.

### Consequences

**Positive:**
- Zero credentials in application code or configuration
- Automatic credential lifecycle management
- No key rotation ceremonies
- Full compliance with Azure security best practices
- Built-in audit trail in Azure activity logs
- Scope credentials to specific Azure resources via role assignments

**Negative:**
- Requires Azure-hosted environment (not usable in local dev without workarounds)
- Adds small set-up complexity to Azure infrastructure
- Requires understanding of Azure RBAC

### Alternatives Considered

- **Connection strings**: Simple but exposes credentials if secrets leaked
- **Azure Key Vault**: More complex, better for key rotation at scale
- **Service Principals**: Better for CI/CD, less suitable for running code

### Implementation Notes

- Frontend and API both need Managed Identity configured
- RBAC roles assigned: "Storage Table Data Contributor" on storage account
- Environment variables point to storage account URL (no credentials)

---

## ADR-007: Direct .NET Deployment to Azure App Services (No Docker)

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application deploys to Azure App Services on Linux with .NET 10 runtime. Deployment needed to:
- Be consistent across environments
- Require minimal infrastructure setup
- Match client deployment approach (direct zip deployment without Docker)
- Simplify CI/CD pipeline

### Decision

Deploy **.NET application directly** to Azure App Services via `dotnet publish` and zip deployment, without Docker containerization in the production pipeline.

### Consequences

**Positive:**
- Simpler CI/CD pipeline (no Docker build/push steps)
- Faster deployments (no container registry needed)
- Consistent with client deployment strategy
- No container registry credentials or infrastructure
- Direct .NET feature support in App Services
- App Service handles .NET runtime management

**Negative:**
- Less portable (tied to App Services platform)
- Can't easily test exact production environment locally
- Platform-specific deployment process

### Docker Optional

A Dockerfile is provided for optional local testing and development but is not used in the GitHub Actions deployment pipeline.

### Alternatives Considered

- **Docker with Container Registry**: More portable but adds complexity
- **Container Instances**: More overhead than App Services
- **Virtual Machine**: Less managed than App Services

---

## ADR-011: Refactor Backend to .NET 10 + ASP.NET Core

**Status:** Accepted  
**Date:** 2026-04-23

### Context

---

## ADR-008: Monorepo with npm Workspaces

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Project contains two separate package directories (client and server) that need to be built, tested, and deployed together.

### Decision

Use **npm workspaces** in the root package.json to manage both client and server as independent packages within a single repository.

### Consequences

**Positive:**
- Single package-lock.json file for reproducible builds
- Consistent dependency versions across workspace
- Simplified CI/CD orchestration (single build step for client)
- Easier local development coordination

**Negative:**
- More complex build automation for client
- Workspace understanding required
- Shared root package.json can become cluttered

### Alternatives Considered

- **Separate repositories**: Cleaner separation but complex orchestration
- **Single package.json**: Simpler but mixes client and server semantics
- **Lerna/Yarn workspaces**: More powerful but adds dependency

---

## ADR-009: CSV Input Format for Participant Data

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application needed a way for users to provide participant data with:
- Easy to create and edit in Excel/Sheets
- No database setup required
- Human-readable and auditable

### Decision

Accept **CSV (Comma-Separated Values)** format with Name and Department columns for participant input.

### Consequences

**Positive:**
- Non-technical users can create and edit with Excel/Sheets
- Auditable: participants can review CSV before upload
- No database dependency for input
- Standard format, easy to parse
- Familiar to business users

**Negative:**
- No validation in spreadsheet application
- Requires upload UI interaction for each generation
- Potential whitespace/formatting issues

### Format Specification

```
Name,Department
John Doe,Engineering
Jane Smith,Marketing
```

### Alternatives Considered

- **Database UI**: Would require more infrastructure
- **JSON input**: More technical, less accessible
- **Manual entry**: Doesn't scale for large participant lists

---

## ADR-010: Pairing Deduplication Strategy

**Status:** Accepted  
**Date:** 2026-04-23

### Context

Application needed to avoid generating the same pairings repeatedly across multiple months to keep the coffee chats fresh and maximize participation diversity.

### Decision

Maintain a **12-month rolling history** of all generated pairings and use deduplication logic to avoid repeating pairs.

### Consequences

**Positive:**
- Prevents same-pair repetition within 12 months
- Encourages broader cross-company networking
- Tracks pair exhaustion to monitor participation diversity

**Negative:**
- Requires storage of historical data
- Algorithm complexity increases with pairing pool size
- May fail to find valid pairings if pool is too small

### Implementation Details

- Entity Key format: `{firstName1}_{firstName2}` (sorted alphabetically)
- Partition Key: `{year}-{month}` for easy historical queries
- Deduplication checks against all entities in 12-month window
- Exhaustion tracking provided to UI for user awareness

### Algorithm Overview

1. Load all historical pairings (past 12 months)
2. Generate candidate pairs
3. Filter out pairs in recent history
4. Return valid unique pairings
5. Store new pairings with timestamp

---

## ADR-011: Refactor Backend to .NET 10 + ASP.NET Core

**Status:** Accepted  
**Date:** 2026-04-23  
**Supersedes:** ADR-002

### Context

Initial implementation used Node.js/Express with TypeScript. After deployment and operational experience, the team identified performance and scalability requirements that prompted reconsideration of the technology stack. Key considerations:

- Future algorithm complexity may require stronger computational performance
- Desire for more enterprise-standard Azure integration out-of-the-box
- Strong static typing benefits as codebase grows
- Azure's better DevOps tooling and monitoring for .NET applications

### Decision

Refactor the backend to use **.NET 10** with **ASP.NET Core** framework, replacing the Node.js/Express implementation entirely. Deploy directly to Azure App Services without Docker containerization.

### Consequences

**Positive:**
- Better performance for complex pairing algorithms (multi-threaded, JIT compilation)
- Native .NET support for Azure SDK with managed identity authentication
- Stronger compile-time type safety with C# language features
- Better performance for CPU-bound operations
- Azure native integration (Application Insights, etc.)
- Simpler deployment (direct zip publish vs Docker container registry)
- Consistent deployment with client (App Services direct deployment)
- Faster CI/CD pipeline
- Scalability for future feature additions

**Negative:**
- Complete backend rewrite required (breaking change)
- Different developer skill set required (C# vs TypeScript)
- Less portable (tied to App Services platform)

### Migration Path

1. **New .NET 10 project** created in `/server/` directory (replacing TypeScript source)
2. **Feature parity** maintained: All endpoints and business logic identical
3. **Database layer** unchanged: Azure Table Storage with same schema
4. **API contracts** preserved: Frontend-facing endpoints remain 100% compatible
5. **Deployment** via direct publish: `dotnet publish` → zip → deploy to App Service
6. **App Service** updated to .NET 10 runtime: `app-cc-api-be-wcus-001`

### Technical Implementation

**Architecture:**
- Controllers: `Controllers/PairingsController.cs`, `Controllers/HealthController.cs`
- Services: `Services/PairingService.cs` (equivalent to Node.js version)
- Models: `Models/Participant.cs`, `Models/Pair.cs`, `Models/PairingsResponse.cs`
- Utilities: `Utils/CsvParser.cs` (using CsvHelper NuGet package)
- Configuration: `Program.cs` (ASP.NET Core startup), `appsettings.json`
- Web Server: IIS configuration via `web.config`

**Dependencies:**
- `Azure.Data.Tables` - Azure Table Storage client
- `Azure.Identity` - Managed identity authentication
- `CsvHelper` - CSV parsing
- `Swashbuckle.AspNetCore` - Swagger/OpenAPI documentation

**Build & Deployment:**
- Build: `dotnet build PairingApp.csproj -c Release`
- Publish: `dotnet publish PairingApp.csproj -c Release -o ./publish`
- Deployment: GitHub Actions creates zip, deploys via publish profile
- Environment: App Services .NET 10 runtime
- Port: 3000 (same as original)

### Alternatives Considered

- **Python/FastAPI**: Would require backend rewrite but less mature Azure integration
- **Keep Node.js**: Original choice still viable for current workload
- **Docker deployment**: More complex infrastructure, no benefit for App Services
- **Java/Spring Boot**: More enterprise but heavier infrastructure overhead

### Testing & Validation

- All API endpoints preserve request/response contracts
- CSV parsing tested with sample_participants.csv
- Azure Table Storage integration tested with managed identity
- Health check endpoint (`/health`) confirms startup
- Publish profile testing before production deployment

### Rollback Plan

- Git history preserves original Node.js implementation
- Publish profiles allow quick rollback to previous App Service version
- Table Storage data remains unchanged during deployment

---

## Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Separate Client and Server Architecture | Accepted | 2026-04-23 |
| 002 | Node.js + Express + TypeScript Backend | Superseded | 2026-04-23 |
| 003 | Azure Table Storage for Persistence | Accepted | 2026-04-23 |
| 004 | Vanilla JavaScript Frontend | Accepted | 2026-04-23 |
| 005 | GitHub Actions for CI/CD | Accepted | 2026-04-23 |
| 006 | Managed Identities for Azure Authentication | Accepted | 2026-04-23 |
| 007 | Direct .NET Deployment to Azure App Services | Accepted | 2026-04-23 |
| 008 | Monorepo with npm Workspaces | Accepted | 2026-04-23 |
| 009 | CSV Input Format for Participant Data | Accepted | 2026-04-23 |
| 010 | Pairing Deduplication Strategy | Accepted | 2026-04-23 |
| 011 | Refactor Backend to .NET 10 + ASP.NET Core | Accepted | 2026-04-23 |

---

## How to Update This Document

When making significant architectural decisions:

1. **Create a new ADR** by copying the template below
2. **Assign a sequential number** (e.g., ADR-011)
3. **Include all sections**: Context, Decision, Consequences, Alternatives
4. **Update the decision log** at the end of this document
5. **Reference in code** where applicable (comments, README)

### ADR Template

```markdown
## ADR-XXX: [Brief Decision Title]

**Status:** Proposed | Accepted | Deprecated | Superseded  
**Date:** YYYY-MM-DD

### Context

[Describe the issue or problem that prompted this decision]

### Decision

[State the architectural decision clearly]

### Consequences

**Positive:**
- [Benefit 1]
- [Benefit 2]

**Negative:**
- [Trade-off 1]
- [Trade-off 2]

### Alternatives Considered

- **[Alternative 1]**: [Brief rationale for rejection]
- **[Alternative 2]**: [Brief rationale for rejection]
```

---

## Related Documentation

- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [ENV_SETUP.md](ENV_SETUP.md) - Environment setup
