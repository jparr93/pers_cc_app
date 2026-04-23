# Optional: This Dockerfile is provided for local containerization during development.
# The GitHub Actions pipeline deploys directly to Azure App Services without using Docker.
# To build locally:
#   docker build -f server/Dockerfile -t pairing-app-api .
#   docker run -p 3000:3000 pairing-app-api

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file
COPY ["server/PairingApp.csproj", "server/"]
WORKDIR /src/server

# Restore dependencies
RUN dotnet restore "PairingApp.csproj"

# Copy source code
WORKDIR /src
COPY ./server ./server
WORKDIR /src/server

# Build the application
RUN dotnet build "PairingApp.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PairingApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy published files
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:3000
ENV ASPNETCORE_ENVIRONMENT=Production

# Expose port
EXPOSE 3000

# Start the application
ENTRYPOINT ["dotnet", "PairingApp.dll"]
