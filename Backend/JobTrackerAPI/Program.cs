using Microsoft.EntityFrameworkCore;
using JobTrackerAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Entity Framework Core with SQLite
builder.Services.AddDbContext<JobContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS policy to allow requests from React (localhost:3000)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("https://localhost:3000") // Allow only the React app on localhost:3000
            .AllowAnyMethod()                      // Allow all HTTP methods (GET, POST, PUT, DELETE)
            .AllowAnyHeader()                      // Allow all headers (e.g., Content-Type)
            .AllowCredentials()                    // Allow credentials (optional if needed)
    );
});

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS policy for requests
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers(); // Maps API controllers

app.Run();
