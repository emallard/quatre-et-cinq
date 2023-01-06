using System.Buffers;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/hello", () => "Hello World!");
app.MapPost("/", async context =>
{

    var readResult = await context.Request.BodyReader.ReadAsync();
    var bytes = readResult.Buffer.ToArray();
    await File.WriteAllBytesAsync("files/upload.tmp", bytes);
});

//app.UseFileServer()
//StaticFileOptions options = new();
//options.RequestPath = "/files";

var files = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), @"files"));
var appFiles = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), @"../client"));

var compositeProvider =
    new CompositeFileProvider(files, appFiles);


var options = new StaticFileOptions()
{
    FileProvider = appFiles,
    RequestPath = new PathString("/app"),
    ServeUnknownFileTypes = true

};
app.UseStaticFiles(options);


// https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/webapplication?view=aspnetcore-7.0
app.Run("http://localhost:4545");
