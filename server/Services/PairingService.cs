using Azure.Data.Tables;
using PairingApp.Models;

namespace PairingApp.Services;

public class PairingService
{
    private readonly TableClient? _tableClient;
    private readonly Dictionary<string, HashSet<string>> _pairingHistory = [];
    private readonly Dictionary<string, List<PairingEntity>> _mockStorage = [];
    private const string TableName = "pairings";

    public PairingService(TableClient? tableClient = null)
    {
        _tableClient = tableClient;
    }

    public async Task<List<Pair>> GeneratePairingsAsync(List<Participant> participants, string runDate)
    {
        Console.WriteLine($"Generating pairings for {participants.Count} participants on {runDate}");

        // Shuffle participants
        var shuffled = participants.OrderBy(_ => Guid.NewGuid()).ToList();
        var pairs = new List<Pair>();

        // Load existing pairs to avoid duplicates
        await LoadPairingHistoryAsync();

        // Generate pairs ensuring no repeats
        for (int i = 0; i < shuffled.Count - 1; i += 2)
        {
            var p1 = shuffled[i];
            var p2 = shuffled[i + 1];

            var pairKey = GetPairKey(p1.Name, p2.Name);

            // Check if this pair already exists
            if (!_pairingHistory.ContainsKey(pairKey))
            {
                pairs.Add(new Pair
                {
                    Person1 = p1.Name,
                    Person2 = p2.Name,
                    Department1 = p1.Department,
                    Department2 = p2.Department
                });

                _pairingHistory[pairKey] = new HashSet<string> { p1.Name, p2.Name };
            }
        }

        Console.WriteLine($"Created {pairs.Count} new pairs");

        // Store in Azure Table Storage
        await StorePairingsAsync(pairs, runDate);

        Console.WriteLine("Pairs stored successfully");
        return pairs;
    }

    public async Task<List<Pair>> GetPairingsAsync(string runDate)
    {
        var pairs = new List<Pair>();

        try
        {
            if (_tableClient != null)
            {
                var entities = _tableClient.QueryAsync<PairingEntity>(
                    e => e.PartitionKey == runDate
                );

                await foreach (var entity in entities)
                {
                    pairs.Add(new Pair
                    {
                        Person1 = entity.Person1 ?? string.Empty,
                        Person2 = entity.Person2 ?? string.Empty,
                        Department1 = entity.Department1 ?? string.Empty,
                        Department2 = entity.Department2 ?? string.Empty
                    });
                }
            }
            else
            {
                // Use mock storage
                if (_mockStorage.ContainsKey(runDate))
                {
                    foreach (var entity in _mockStorage[runDate])
                    {
                        pairs.Add(new Pair
                        {
                            Person1 = entity.Person1 ?? string.Empty,
                            Person2 = entity.Person2 ?? string.Empty,
                            Department1 = entity.Department1 ?? string.Empty,
                            Department2 = entity.Department2 ?? string.Empty
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error retrieving pairings: {ex.Message}");
        }

        return pairs;
    }

    public async Task ResetPairingsAsync()
    {
        try
        {
            if (_tableClient != null)
            {
                var entities = _tableClient.QueryAsync<PairingEntity>();

                await foreach (var entity in entities)
                {
                    await _tableClient.DeleteEntityAsync(entity.PartitionKey, entity.RowKey);
                }
            }

            _mockStorage.Clear();
            _pairingHistory.Clear();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error resetting pairings: {ex.Message}");
            throw;
        }
    }

    public async Task<double> GetExhaustionPercentageAsync()
    {
        try
        {
            int count = 0;

            if (_tableClient != null)
            {
                var entities = _tableClient.QueryAsync<PairingEntity>();
                await foreach (var entity in entities)
                {
                    count++;
                }
            }
            else
            {
                foreach (var entities in _mockStorage.Values)
                {
                    count += entities.Count;
                }
            }

            // Simple calculation: count / (estimated max possible pairs)
            return Math.Min((double)count / 100 * 100, 100);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error calculating exhaustion: {ex.Message}");
            return 0;
        }
    }

    public double GetExhaustionPercentage()
    {
        // Sync version for quick calculation
        const int maxPossiblePairs = 100;
        var usedPairs = _pairingHistory.Count;
        return Math.Min((double)usedPairs / maxPossiblePairs * 100, 100);
    }

    public async Task<string> ExportPairingsCsvAsync(string runDate)
    {
        var pairs = await GetPairingsAsync(runDate);
        var csv = "Person 1,Department 1,Person 2,Department 2\n";

        foreach (var pair in pairs)
        {
            csv += $"\"{pair.Person1}\",\"{pair.Department1}\",\"{pair.Person2}\",\"{pair.Department2}\"\n";
        }

        return csv;
    }

    private string GetPairKey(string name1, string name2)
    {
        var names = new[] { name1, name2 }.OrderBy(n => n).ToArray();
        return $"{names[0]}|{names[1]}";
    }

    private async Task StorePairingsAsync(List<Pair> pairs, string runDate)
    {
        for (int i = 0; i < pairs.Count; i++)
        {
            var pair = pairs[i];
            var entity = new PairingEntity
            {
                PartitionKey = runDate,
                RowKey = $"pair-{i}",
                Person1 = pair.Person1,
                Person2 = pair.Person2,
                Department1 = pair.Department1,
                Department2 = pair.Department2,
                RunDate = runDate,
                Timestamp = DateTimeOffset.UtcNow
            };

            if (_tableClient != null)
            {
                try
                {
                    Console.WriteLine($"Storing pair {i} to Azure Table Storage");
                    await _tableClient.AddEntityAsync(entity);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error storing pair to Azure: {ex.Message}");
                    StoreMockEntity(entity);
                }
            }
            else
            {
                Console.WriteLine($"Using mock storage for pair {i}");
                StoreMockEntity(entity);
            }
        }
    }

    private void StoreMockEntity(PairingEntity entity)
    {
        if (!_mockStorage.ContainsKey(entity.PartitionKey))
        {
            _mockStorage[entity.PartitionKey] = [];
        }

        _mockStorage[entity.PartitionKey].Add(entity);
    }

    private async Task LoadPairingHistoryAsync()
    {
        try
        {
            if (_tableClient != null)
            {
                var entities = _tableClient.QueryAsync<PairingEntity>();
                await foreach (var entity in entities)
                {
                    var pairKey = GetPairKey(entity.Person1 ?? string.Empty, entity.Person2 ?? string.Empty);
                    _pairingHistory[pairKey] = new HashSet<string> 
                    { 
                        entity.Person1 ?? string.Empty, 
                        entity.Person2 ?? string.Empty 
                    };
                }
            }
            else
            {
                foreach (var entities in _mockStorage.Values)
                {
                    foreach (var entity in entities)
                    {
                        var pairKey = GetPairKey(entity.Person1 ?? string.Empty, entity.Person2 ?? string.Empty);
                        _pairingHistory[pairKey] = new HashSet<string> 
                        { 
                            entity.Person1 ?? string.Empty, 
                            entity.Person2 ?? string.Empty 
                        };
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading pairing history: {ex.Message}");
        }
    }
}

public class PairingEntity : ITableEntity
{
    public string? Person1 { get; set; }
    public string? Person2 { get; set; }
    public string? Department1 { get; set; }
    public string? Department2 { get; set; }
    public string? RunDate { get; set; }

    public string PartitionKey { get; set; } = string.Empty;
    public string RowKey { get; set; } = string.Empty;
    public DateTimeOffset? Timestamp { get; set; }
    public Azure.ETag ETag { get; set; }
}
