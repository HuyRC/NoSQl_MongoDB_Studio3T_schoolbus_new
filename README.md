# 🚌 SchoolBus API

Ứng dụng **ASP.NET 9 + MongoDB Studio 3T** dùng để quản lý **hệ thống đưa đón học sinh bằng xe Bus**.  
Giao diện thử nghiệm được tích hợp sẵn bằng **Swagger UI**.
## ⚙️ Công nghệ sử dụng
- ASP.NET Core 9 (Minimal API)
- MongoDB + MongoDB.Driver
- Swagger UI (tự động sinh giao diện test API)

---

## 📁 Cấu trúc chính
SchoolBusApi/
│
├── .vscode/                      # Cấu hình VS Code (chạy và build)
│   ├── launch.json               # Cấu hình khởi chạy Swagger tự động
│   └── tasks.json                # Nhiệm vụ build .NET trước khi chạy
│
├── Properties/                   # Thông tin metadata khi publish project
│
├── bin/                          # (Tự sinh) file build nhị phân khi chạy dotnet build
├── obj/                          # (Tự sinh) file tạm của quá trình biên dịch
│
├── appsettings.json              # Cấu hình chính (MongoDB connection, database)
├── appsettings.Development.json  # Cấu hình môi trường dev (ghi đè appsettings.json nếu cần)
│
├── MongoContext.cs               # Lớp kết nối MongoDB (tương tự DbContext trong EF)
├── Model.cs                      # Chứa các model: School, Student, Stop, Route, Trip, v.v.
├── Program.cs                    # Toàn bộ API (Minimal API: CRUD cho từng collection)
│
├── README.md                     # Tài liệu mô tả dự án (hiển thị trên GitHub)
│
└── SchoolBusApi.csproj           # File cấu hình project .NET (framework, package,...)


## Cách chạy project
1. Kiểm tra phần database ở bên Studio3T 
    - connection phải ở port: 27017 ( xem cấu hình ở appsettings.json)
    - Tên database trong connection phải là schoolbus (vì  tên db trong project cần trùng với db bên studio3t ) để tránh lỗi khi truy vấn dữ liệu
2. Cài extensions : vào phần extensions ( ở thanh công cụ bên trái ) -> Tìm kiếm C# -> install
3. Mở terminal trong vs code và chạy 2 câu lệnh sau 
    -dotnet add package MongoDB.Driver
    -dotnet add package Swashbuckle.AspNetCore
4. Cách để run project : 
    dotnet run --urls "http://localhost:5100"
5. Cách vào swagger để test  các truy vấn dữ liệu
    - chạy lệnh ở 4. -> vào trình duyệt truy cập: http://localhost:5100/swagger -> sẽ hiện giao diện truy xuất dữ liệu 
    - Giao diện truy xuất dữ liệu gồm CRUD của từng object : school,student,...
        get: đọc dữ liệu  (get có 2 loại : 1 loại đọc toàn bộ 1 collection, 1 loại đọc 1 document cụ thể theo id )
        post: thêm mới 
        put: cập nhật
        delete: xóa 
    ## Note:
    1. Về link truy cập:http://localhost:5100/swagger nếu quên thì vào .vscode/launch.json, link là uriFormat
    2. Collection của Nosql như 1 table bên Sql , còn 1 document  thì là như 1 hàng (row)

