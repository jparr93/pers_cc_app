using Azure.Data.Tables;
using Azure.Identity;
using PairingApp.Services;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Configure port from environment variable or default to 3000
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.ConfigureKestrel(serverOptions => 
{
    serverOptions.ListenAnyIP(int.Parse(port));
});

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
