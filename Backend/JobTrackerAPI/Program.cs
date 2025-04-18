using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using JobTrackerAPI.Data;
using JobTrackerAPI.Services;
using JobTrackerAPI.Middleware;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add user secrets in development environment
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework Core with SQLite
builder.Services.AddDbContext<JobContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add ASP.NET Identity with Roles
// Update the Identity configuration in Program.cs
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => 
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    
    // User settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
    
    // Email confirmation settings
    options.SignIn.RequireConfirmedEmail = true; // Require email verification
})
.AddEntityFrameworkStores<JobContext>()
.AddDefaultTokenProviders();

// Configure token lifetime
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(2); // Set token expiration to 2 hours
});

// Register the RolesService and RoleMigrationUtility
builder.Services.AddScoped<RolesService>();
builder.Services.AddScoped<RoleMigrationUtility>();

// Register the AdminDashboardService
builder.Services.AddScoped<AdminDashboardService>();

// Register the JobPostingService and RecruiterService
builder.Services.AddScoped<RecruiterService>();
builder.Services.AddScoped<JobPostingService>();


builder.Services.AddScoped<FileService>();

//HERE
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Handle circular references
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        // Avoid infinite recursion by setting a reasonable max depth
        options.JsonSerializerOptions.MaxDepth = 10;
    });

// Register the EmailService
builder.Services.AddScoped<EmailService>();

// Add Authentication with JWT Bearer and Google OAuth
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
})
.AddGoogle(options =>
{
    // Load Google settings from configuration (appsettings.json)
    IConfigurationSection googleAuthSection = builder.Configuration.GetSection("Authentication:Google");
    options.ClientId = googleAuthSection["ClientId"] ?? throw new InvalidOperationException("Google ClientId is not configured");
    options.ClientSecret = googleAuthSection["ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret is not configured");
    options.CallbackPath = "/signin-google";
});

// Add CORS policy to allow requests from React (localhost:3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("https://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Job Tracker API", Version = "v1" });
    // Enable JWT authentication in Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {your JWT token}' to authenticate."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Run initialization and migration tasks
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    
    try
    {
        // Ensure the roles are created
        var rolesService = services.GetRequiredService<RolesService>();
        await rolesService.EnsureRolesCreatedAsync();
        
        // Migrate existing users to have at least the "User" role
        var migrationUtility = services.GetRequiredService<RoleMigrationUtility>();
        await migrationUtility.MigrateExistingUsersToRoles();
        
        // Create an admin user if one doesn't exist
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var adminEmail = builder.Configuration["AdminUser:Email"];
        var adminPassword = builder.Configuration["AdminUser:Password"];
        
        if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
        {
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                adminUser = new IdentityUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };
                
                await userManager.CreateAsync(adminUser, adminPassword);
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
            else
            {
                // Ensure the admin user has the Admin role
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during application initialization");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthentication(); // Enable authentication middleware

// Add the role enforcement middleware after authentication but before authorization
app.UseRoleEnforcement();

// Add this before configuring the static files
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// Create the CV uploads directory as well
var cvUploadsPath = Path.Combine(uploadsPath, "CVs");
if (!Directory.Exists(cvUploadsPath))
{
    Directory.CreateDirectory(cvUploadsPath);
}

// Then add the static files middleware
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseStaticFiles();

// Add this to configure the file uploads directory for static file serving
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath, "Uploads")),
    RequestPath = "/uploads"
});

app.UseAuthorization();

app.MapControllers();

app.Run();