namespace PairingApp.Models;

public class PairingsResponse
{
    public List<Pair> Pairings { get; set; } = [];
    public string RunDate { get; set; } = string.Empty;
    public double ExhaustionPercentage { get; set; }
}
