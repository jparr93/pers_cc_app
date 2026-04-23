using Microsoft.AspNetCore.Mvc;
using PairingApp.Models;
using PairingApp.Services;
using PairingApp.Utils;

namespace PairingApp.Controllers;

[ApiController]
[Route("api")]
[Produces("application/json")]
public class PairingsController : ControllerBase
{
    private readonly PairingService _pairingService;
    private readonly ILogger<PairingsController> _logger;

    public PairingsController(PairingService pairingService, ILogger<PairingsController> logger)
    {
        _pairingService = pairingService;
        _logger = logger;
    }

    [HttpGet("pairings")]
    public async Task<ActionResult<PairingsResponse>> GetPairings([FromQuery] string? date = null)
    {
        try
        {
            var runDate = date ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
            var pairings = await _pairingService.GetPairingsAsync(runDate);
            var exhaustion = _pairingService.GetExhaustionPercentage();

            return Ok(new PairingsResponse
            {
                Pairings = pairings,
                RunDate = runDate,
                ExhaustionPercentage = exhaustion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pairings");
            return StatusCode(500, new { error = "Failed to retrieve pairings" });
        }
    }

    [HttpPost("pairings/generate")]
    public async Task<ActionResult<GeneratePairingsRequest>> GeneratePairings(IFormFile file, [FromForm] string runDate)
    {
        try
        {
            _logger.LogInformation("Generate pairings request received");

            if (file == null || file.Length == 0)
            {
                _logger.LogError("No file uploaded");
                return BadRequest(new { error = "CSV file is required" });
            }

            if (string.IsNullOrEmpty(runDate))
            {
                _logger.LogError("No runDate provided");
                return BadRequest(new { error = "runDate is required" });
            }

            _logger.LogInformation("Processing file: {fileName} for date: {runDate}", file.FileName, runDate);

            string csvContent;
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                csvContent = await reader.ReadToEndAsync();
            }

            var participants = await CsvParser.ParseCsvStringAsync(csvContent);

            _logger.LogInformation("Parsed participants: {count}", participants.Count);

            if (participants.Count == 0)
            {
                _logger.LogError("CSV file is empty");
                return BadRequest(new { error = "CSV file is empty or invalid" });
            }

            var newPairings = await _pairingService.GeneratePairingsAsync(participants, runDate);
            _logger.LogInformation("Generated pairings: {count}", newPairings.Count);

            return Ok(new GeneratePairingsRequest
            {
                Pairings = newPairings,
                Count = newPairings.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pairings");
            return StatusCode(500, new { error = "Failed to generate pairings", details = ex.Message });
        }
    }

    [HttpPost("pairings/reset")]
    public async Task<ActionResult<object>> ResetPairings()
    {
        try
        {
            await _pairingService.ResetPairingsAsync();
            return Ok(new { message = "Pairings reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting pairings");
            return StatusCode(500, new { error = "Failed to reset pairings" });
        }
    }

    [HttpGet("exhaustion")]
    public async Task<ActionResult<object>> GetExhaustionPercentage()
    {
        try
        {
            var exhaustionPercentage = await _pairingService.GetExhaustionPercentageAsync();
            return Ok(new { exhaustionPercentage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking exhaustion");
            return StatusCode(500, new { error = "Failed to check exhaustion" });
        }
    }

    [HttpGet("pairings/export")]
    public async Task<ActionResult> ExportPairings([FromQuery] string? date = null)
    {
        try
        {
            var runDate = date ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
            var csv = await _pairingService.ExportPairingsCsvAsync(runDate);

            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"pairings-{runDate}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting pairings");
            return StatusCode(500, new { error = "Failed to export pairings" });
        }
    }
}
