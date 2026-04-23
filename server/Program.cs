using Azure.Data.Tables;
using Azure.Identity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using PairingApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure port using environment variable
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
var urls = $"http://0.0.0.0:{port}";
builder.WebHost.UseUrls(urls);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddLogging();

// Initialize Azure Table Storage
TableClient? tableClient = null;
try
{
    var storageUrl = builder.Configuration["STORAGE_ACCOUNT_URL"] 
        ?? "https://saccwcus001.table.core.windows.net";
    
    var credential = new DefaultAzureCredential();
    tableClient = new TableClient(new Uri(storageUrl), "pairings", credential);
    
    Console.WriteLine("Successfully initialized Azure Table Client");
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to initialize Azure Table Client: {ex.Message}");
    Console.WriteLine("Using mock table storage for development");
}

// Register PairingService as singleton
builder.Services.AddSingleton(sp => new PairingService(tableClient));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

app.Run();
