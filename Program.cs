using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// === CONFIG & DEPENDENCY INJECTION ===
builder.Services.Configure<MongoSettings>(builder.Configuration.GetSection("Mongo"));
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ ENABLE CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ✅ USE CORS
app.UseCors();

// ✅ SERVE STATIC FILES - QUAN TRỌNG!
var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});

// ✅ SERVE FILES FROM 'pages' FOLDER
var pagesPath = Path.Combine(Directory.GetCurrentDirectory(), "pages");
if (Directory.Exists(pagesPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(pagesPath),
        RequestPath = "/pages"
    });
}

// ✅ DEFAULT FILES
app.UseDefaultFiles(new DefaultFilesOptions
{
    DefaultFileNames = new List<string> { "index.html", "dashboard.html" }
});

// ✅ REDIRECT ROOT TO LOGIN
app.MapGet("/", () => Results.Redirect("pages/admin/login.html"));

app.UseSwagger();
app.UseSwaggerUI();

var ctx = app.Services.GetRequiredService<MongoContext>();

// ======================================================
// =============== SCHOOLS CRUD =========================
// ======================================================
app.MapGet("/api/schools", async () =>
    await ctx.Schools.Find(_ => true).SortBy(s => s.code).ToListAsync());

app.MapGet("/api/schools/{code}", async (string code) =>
{
    var sch = await ctx.Schools.Find(s => s.code == code).FirstOrDefaultAsync();
    return sch is null ? Results.NotFound() : Results.Ok(sch);
});

app.MapPost("/api/schools", async (School s) =>
{
    await ctx.Schools.InsertOneAsync(s);
    return Results.Created($"/api/schools/{s.code}", s);
});

app.MapPut("/api/schools/{id}", async (string id, School s) =>
{
    s.Id = id;
    var r = await ctx.Schools.ReplaceOneAsync(x => x.Id == id, s);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/schools/{id}", async (string id) =>
{
    var r = await ctx.Schools.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== STUDENTS CRUD ========================
// ======================================================
app.MapGet("/api/students", async () =>
    await ctx.Students.Find(FilterDefinition<Student>.Empty).SortBy(s => s.mahs).ToListAsync());

app.MapGet("/api/students/{mahs}", async (string mahs) =>
{
    var stu = await ctx.Students.Find(s => s.mahs == mahs).FirstOrDefaultAsync();
    return stu is null ? Results.NotFound() : Results.Ok(stu);
});

app.MapPost("/api/students", async (Student s) =>
{
    await ctx.Students.InsertOneAsync(s);
    return Results.Created($"/api/students/{s.mahs}", s);
});

app.MapPut("/api/students/{id}", async (string id, Student s) =>
{
    s.Id = id;
    var r = await ctx.Students.ReplaceOneAsync(x => x.Id == id, s);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/students/{id}", async (string id) =>
{
    var r = await ctx.Students.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== STOPS CRUD ===========================
// ======================================================
app.MapGet("/api/stops", async () =>
    await ctx.Stops.Find(_ => true).SortBy(s => s.code).ToListAsync());

app.MapGet("/api/stops/{code}", async (string code) =>
{
    var stop = await ctx.Stops.Find(s => s.code == code).FirstOrDefaultAsync();
    return stop is null ? Results.NotFound() : Results.Ok(stop);
});

app.MapPost("/api/stops", async (Stop s) =>
{
    await ctx.Stops.InsertOneAsync(s);
    return Results.Created($"/api/stops/{s.code}", s);
});

app.MapPut("/api/stops/{id}", async (string id, Stop s) =>
{
    s.Id = id;
    var r = await ctx.Stops.ReplaceOneAsync(x => x.Id == id, s);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/stops/{id}", async (string id) =>
{
    var r = await ctx.Stops.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== ROUTES CRUD ==========================
// ======================================================
app.MapGet("/api/routes", async () =>
    await ctx.Routes.Find(_ => true).SortBy(r => r.code).ToListAsync());

app.MapGet("/api/routes/{code}", async (string code) =>
{
    var route = await ctx.Routes.Find(r => r.code == code).FirstOrDefaultAsync();
    return route is null ? Results.NotFound() : Results.Ok(route);
});

app.MapPost("/api/routes", async (Route r) =>
{
    await ctx.Routes.InsertOneAsync(r);
    return Results.Created($"/api/routes/{r.code}", r);
});

app.MapPut("/api/routes/{id}", async (string id, Route r) =>
{
    r.Id = id;
    var res = await ctx.Routes.ReplaceOneAsync(x => x.Id == id, r);
    return res.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/routes/{id}", async (string id) =>
{
    var r = await ctx.Routes.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== DRIVERS CRUD =========================
// ======================================================
app.MapGet("/api/drivers", async () =>
    await ctx.Drivers.Find(_ => true).SortBy(d => d.code).ToListAsync());

app.MapGet("/api/drivers/{code}", async (string code) =>
{
    var drv = await ctx.Drivers.Find(d => d.code == code).FirstOrDefaultAsync();
    return drv is null ? Results.NotFound() : Results.Ok(drv);
});

app.MapPost("/api/drivers", async (Driver d) =>
{
    await ctx.Drivers.InsertOneAsync(d);
    return Results.Created($"/api/drivers/{d.code}", d);
});

app.MapPut("/api/drivers/{id}", async (string id, Driver d) =>
{
    d.Id = id;
    var r = await ctx.Drivers.ReplaceOneAsync(x => x.Id == id, d);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/drivers/{id}", async (string id) =>
{
    var r = await ctx.Drivers.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== BUSES CRUD ===========================
// ======================================================
app.MapGet("/api/buses", async () =>
    await ctx.Buses.Find(_ => true).SortBy(b => b.code).ToListAsync());

app.MapGet("/api/buses/{code}", async (string code) =>
{
    var bus = await ctx.Buses.Find(b => b.code == code).FirstOrDefaultAsync();
    return bus is null ? Results.NotFound() : Results.Ok(bus);
});

app.MapPost("/api/buses", async (Bus b) =>
{
    await ctx.Buses.InsertOneAsync(b);
    return Results.Created($"/api/buses/{b.code}", b);
});

app.MapPut("/api/buses/{id}", async (string id, Bus b) =>
{
    b.Id = id;
    var r = await ctx.Buses.ReplaceOneAsync(x => x.Id == id, b);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/buses/{id}", async (string id) =>
{
    var r = await ctx.Buses.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== TRIPS CRUD ===========================
// ======================================================
app.MapGet("/api/trips", async () =>
    await ctx.Trips.Find(_ => true).SortBy(t => t.tripCode).ToListAsync());

app.MapGet("/api/trips/{tripCode}", async (string tripCode) =>
{
    var trip = await ctx.Trips.Find(t => t.tripCode == tripCode).FirstOrDefaultAsync();
    return trip is null ? Results.NotFound() : Results.Ok(trip);
});

app.MapPost("/api/trips", async (Trip t) =>
{
    await ctx.Trips.InsertOneAsync(t);
    return Results.Created($"/api/trips/{t.tripCode}", t);
});

app.MapPut("/api/trips/{id}", async (string id, Trip t) =>
{
    t.Id = id;
    var r = await ctx.Trips.ReplaceOneAsync(x => x.Id == id, t);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/trips/{id}", async (string id) =>
{
    var r = await ctx.Trips.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});


// ======================================================
// =============== ASSIGNMENTS CRUD =====================
// ======================================================
app.MapGet("/api/assignments", async () =>
    await ctx.Assignments.Find(_ => true).ToListAsync());

app.MapGet("/api/assignments/{id}", async (string id) =>
{
    var a = await ctx.Assignments.Find(x => x.Id == id).FirstOrDefaultAsync();
    return a is null ? Results.NotFound() : Results.Ok(a);
});


app.MapPost("/api/assignments", async (Assignment a) =>
{
    await ctx.Assignments.InsertOneAsync(a);
    return Results.Created($"/api/assignments/{a.Id}", a);
});

app.MapPut("/api/assignments/{id}", async (string id, Assignment a) =>
{
    a.Id = id;
    var r = await ctx.Assignments.ReplaceOneAsync(x => x.Id == id, a);
    return r.MatchedCount == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapDelete("/api/assignments/{id}", async (string id) =>
{
    var r = await ctx.Assignments.DeleteOneAsync(x => x.Id == id);
    return r.DeletedCount == 0 ? Results.NotFound() : Results.NoContent();
});

// ======================================================
// =============== ATTENDANCE CRUD ======================
// ======================================================

// 1. Lấy danh sách điểm danh của một chuyến cụ thể
app.MapGet("/api/attendances/trip/{tripCode}", async (string tripCode) =>
{
    var list = await ctx.Attendances.Find(a => a.tripCode == tripCode).ToListAsync();
    return Results.Ok(list);
});

// 2. Điểm danh (Check-in/Check-out) - Dùng Upsert (Nếu có rồi thì cập nhật, chưa có thì thêm mới)
app.MapPost("/api/attendances", async (Attendance a) =>
{
    // Tìm xem học sinh này đã được điểm danh trong chuyến này chưa
    var filter = Builders<Attendance>.Filter.And(
        Builders<Attendance>.Filter.Eq(x => x.tripCode, a.tripCode),
        Builders<Attendance>.Filter.Eq(x => x.studentCode, a.studentCode)
    );

    var update = Builders<Attendance>.Update
        .Set(x => x.tripId, a.tripId)
        .Set(x => x.studentId, a.studentId)
        .Set(x => x.status, a.status)
        .Set(x => x.checkInTime, DateTime.Now)
        .Set(x => x.note, a.note);

    // Thực hiện Upsert
    await ctx.Attendances.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });
    
    return Results.Ok(new { message = "Điểm danh thành công" });
});

Console.WriteLine("✅ Server is running at http://localhost:5100");
Console.WriteLine("📊 Swagger UI: http://localhost:5100/swagger");
Console.WriteLine("🏠 Dashboard: http://localhost:5100/pages/admin/dashboard.html");

app.Run();