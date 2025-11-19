using MongoDB.Driver;
using Microsoft.Extensions.Options;
// Dùng để kết nối tới mongoDB và truy cập các collection của Database
public class MongoSettings
{
    public string ConnectionString { get; set; } = "";
    public string Database { get; set; } = "";
}
// lớp trung gian để kết nối và truy cập các collection
public class MongoContext
{
    public IMongoDatabase Db { get; }

    public MongoContext(IOptions<MongoSettings> opt)
    {
        var s = opt.Value;
        var client = new MongoClient(s.ConnectionString);
        Db = client.GetDatabase(s.Database);
    }

    // === COLLECTIONS ===
    public IMongoCollection<School> Schools => Db.GetCollection<School>(nameof(School).ToLower() + "s");
    public IMongoCollection<Student> Students => Db.GetCollection<Student>(nameof(Student).ToLower() + "s");
    public IMongoCollection<Route> Routes => Db.GetCollection<Route>(nameof(Route).ToLower() + "s");
    public IMongoCollection<Stop> Stops => Db.GetCollection<Stop>(nameof(Stop).ToLower() + "s");
    public IMongoCollection<Assignment> Assignments => Db.GetCollection<Assignment>(nameof(Assignment).ToLower() + "s");
    public IMongoCollection<Trip> Trips => Db.GetCollection<Trip>(nameof(Trip).ToLower() + "s");
    public IMongoCollection<Bus> Buses => Db.GetCollection<Bus>(nameof(Bus).ToLower() + "es"); // “Buses” đặc biệt
    public IMongoCollection<Driver> Drivers => Db.GetCollection<Driver>(nameof(Driver).ToLower() + "s");
}
