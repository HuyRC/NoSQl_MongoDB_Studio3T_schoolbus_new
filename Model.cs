using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

// ========== 1. SCHOOL ==========
public class School
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string code { get; set; } = "";  // "GD", "LQD"
    public string name { get; set; } = "";     public string address { get; set; } = "";
    public bool active { get; set; } = true;
}

// ========== 2. STUDENT ==========
public class Student
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string mahs { get; set; } = ""; // Mã HS: "GD0001"
    public string hoten { get; set; } = "";
    public string lop { get; set; } = "";
    public DateTime ngaysinh { get; set; } // ISODate trong Mongo
    public string phai { get; set; } = "";
    public string diachi { get; set; } = "";

    public string schoolCode { get; set; } = ""; // Mã trường logic ("GD")

    [BsonRepresentation(BsonType.ObjectId)]
    public string schoolId { get; set; }  // Tham chiếu vật lý

    public bool active { get; set; } = true;
}

// ========== 3. STOP (Điểm đón/trả) ==========
public class GeoPoint
{
    public string type { get; set; } = "Point";
    public double[] coordinates { get; set; } = new double[2]; // [long, lat]
}
public class Stop
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string code { get; set; } = ""; // STOP_BT01
    public string name { get; set; } = "";
    public GeoPoint location { get; set; } = new();// { type: "Point", coordinates: [...] }
    public string? note { get; set; }
    public string? schoolCode { get; set; }// Liên kết vùng trường
    public bool active { get; set; } = true;
}
// ========== 4. ROUTE (Tuyến đường) ==========
public class RouteStop
{
    public int seq { get; set; }// Thứ tự chạm
    public string stopCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string stopId { get; set; }

    public string plannedTime { get; set; } = "";// 06:25
}
public class Route
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string code { get; set; } = "";   // R-GD-AM
    public string name { get; set; } = "";
    public string direction { get; set; } = "morning";
    public string schoolCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string schoolId { get; set; }

    public bool isActive { get; set; } = true;

    public List<RouteStop> stopOrder { get; set; } = new();
}
// ========== 5. DRIVER (Tài xế) ==========
public class Driver
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string code { get; set; } = "";
    public string fullName { get; set; } = "";
    public string phone { get; set; } = "";
    public string? licenseNo { get; set; }
    public bool active { get; set; } = true;
}

// ========== 6. BUS (Xe) ==========
public class Bus
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string code { get; set; } = "";
    public string plate { get; set; } = "";
    public int capacity { get; set; }
    public string? brand { get; set; }
    public int? year { get; set; }
    public bool active { get; set; } = true;
}

// ========== 7. TRIP (Chuyến xe) ==========
public class Trip
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string tripCode { get; set; } = "";// TRIP-GD-AM-20251024

    public string routeCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string routeId { get; set; }

    public DateTime date { get; set; }// new Date("2025-10-24")


    public string busCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string busId { get; set; }

    public string driverCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string driverId { get; set; }

    public string status { get; set; } = "planned";// planned | started | finished
}

// ========== 8. ASSIGNMENT (Phân công HS) ==========
public class Assignment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string studentCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string studentId { get; set; }

    public string routeCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string routeId { get; set; }

    public string pickStopCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string pickStopId { get; set; }

    public string dropStopCode { get; set; } = "";

    [BsonRepresentation(BsonType.ObjectId)]
    public string dropStopId { get; set; }

    public List<string> days { get; set; } = new();
    public bool active { get; set; } = true;
}

// ========== 9. ATTENDANCE (Điểm danh) ==========
public class Attendance
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public string tripCode { get; set; } = ""; // Mã chuyến đi (VD: TRIP-GD-AM-20251024)
    
    [BsonRepresentation(BsonType.ObjectId)]
    public string tripId { get; set; }

    public string studentCode { get; set; } = "";
    
    [BsonRepresentation(BsonType.ObjectId)]
    public string studentId { get; set; }

    public string status { get; set; } = "present"; // present | absent | excused
    public DateTime checkInTime { get; set; } = DateTime.Now;
    public string? note { get; set; }
}