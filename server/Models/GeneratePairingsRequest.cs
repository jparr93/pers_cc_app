namespace PairingApp.Models;

public class GeneratePairingsRequest
{
    public List<Pair> Pairings { get; set; } = [];
    public int Count { get; set; }
}
