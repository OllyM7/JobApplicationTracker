using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace JobTrackerAPI.Services
{
    public class EmailService
    {
        private readonly string _apiKey;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        
        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            
            _apiKey = _configuration["EmailSettings:SendGridApiKey"];
            _fromEmail = _configuration["EmailSettings:FromEmail"];
            _fromName = _configuration["EmailSettings:FromName"];
            
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("SendGrid API key is not configured");
            }
        }
        
        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent, string plainTextContent = "")
        {
            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogError("Cannot send email: SendGrid API key is not configured");
                return false;
            }
            
            var client = new SendGridClient(_apiKey);
            var from = new EmailAddress(_fromEmail, _fromName);
            var toAddress = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, plainTextContent, htmlContent);
            
            try
            {
                var response = await client.SendEmailAsync(msg);
                
                if (response.StatusCode == System.Net.HttpStatusCode.Accepted || 
                    response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    _logger.LogInformation($"Email sent to {to} with subject: {subject}");
                    return true;
                }
                else
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    _logger.LogError($"Failed to send email. Status code: {response.StatusCode}, Response: {responseBody}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Exception while sending email to {to}");
                return false;
            }
        }
        
        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string callbackUrl)
        {
            string subject = "Reset Your Password";
            
            string htmlContent = $@"
            <html>
            <body>
                <h2>Reset Your Password</h2>
                <p>You've requested to reset your password.</p>
                <p>Please click the link below to reset your password:</p>
                <p><a href='{callbackUrl}?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(email)}'>Reset Password</a></p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>The link will expire in 30 minutes.</p>
            </body>
            </html>";
            
            string plainTextContent = $"Reset your password by clicking this link: {callbackUrl}?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(email)}";
            
            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }
        
        public async Task SendAccountVerificationEmailAsync(string email, string verificationToken, string callbackUrl)
        {
            string subject = "Verify Your Email Address";
            
            string htmlContent = $@"
            <html>
            <body>
                <h2>Verify Your Email Address</h2>
                <p>Thank you for registering! Please verify your email address.</p>
                <p>Please click the link below to verify your email:</p>
                <p><a href='{callbackUrl}?token={Uri.EscapeDataString(verificationToken)}&email={Uri.EscapeDataString(email)}'>Verify Email</a></p>
                <p>If you didn't register for an account, please ignore this email.</p>
            </body>
            </html>";
            
            string plainTextContent = $"Verify your email by clicking this link: {callbackUrl}?token={Uri.EscapeDataString(verificationToken)}&email={Uri.EscapeDataString(email)}";
            
            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }
        
        public async Task SendAccountDeletionConfirmationAsync(string email)
        {
            string subject = "Your Account Has Been Deleted";
            
            string htmlContent = $@"
            <html>
            <body>
                <h2>Account Deletion Confirmation</h2>
                <p>Your account has been successfully deleted from our system.</p>
                <p>All your personal data and job applications have been removed.</p>
                <p>We're sorry to see you go. If you wish to use our services again, you'll need to create a new account.</p>
            </body>
            </html>";
            
            string plainTextContent = "Your account has been successfully deleted from our system. All your personal data and job applications have been removed.";
            
            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }
        
        public async Task SendApplicationStatusUpdateAsync(string email, string companyName, string position, string status, string feedback = "")
        {
            string subject = $"Update on your application to {companyName}";
            
            string htmlContent = $@"
            <html>
            <body>
                <h2>Application Status Update</h2>
                <p>There's an update on your application for the <strong>{position}</strong> position at <strong>{companyName}</strong>.</p>
                <p>Your application status has been changed to: <strong>{status}</strong></p>
                {(string.IsNullOrEmpty(feedback) ? "" : $"<p><strong>Feedback:</strong> {feedback}</p>")}
                <p>Log in to your account to see more details.</p>
            </body>
            </html>";
            
            string plainTextContent = $"Update on your application for the {position} position at {companyName}. Status: {status}." +
                                   (string.IsNullOrEmpty(feedback) ? "" : $"\nFeedback: {feedback}");
            
            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }
    }
}