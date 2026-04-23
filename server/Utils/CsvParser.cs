using CsvHelper;
using CsvHelper.Configuration;
using PairingApp.Models;
using System.Globalization;

namespace PairingApp.Utils;

public class CsvParser
{
    public static async Task<List<Participant>> ParseCsvStringAsync(string csvContent)
    {
        var participants = new List<Participant>();
        
        using (var reader = new StringReader(csvContent))
        using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
        {
            csv.Context.RegisterClassMap<ParticipantMap>();
            
            await foreach (var record in csv.GetRecordsAsync<Participant>())
            {
                if (!string.IsNullOrWhiteSpace(record.Name) && !string.IsNullOrWhiteSpace(record.Department))
                {
                    participants.Add(record);
                }
            }
        }
        
        return participants;
    }
}

public class ParticipantMap : ClassMap<Participant>
{
    public ParticipantMap()
    {
        Map(m => m.Name).Name("Name");
        Map(m => m.Department).Name("Department");
    }
}
