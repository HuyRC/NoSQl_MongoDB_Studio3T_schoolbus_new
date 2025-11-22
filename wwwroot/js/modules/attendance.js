const API_URL = "http://localhost:5100/api";

$(document).ready(function() {
    loadTrips();

    $('#btnLoadManifest').click(function() {
        const tripCode = $('#tripSelect').val();
        if(!tripCode) {
            alert("Vui lòng chọn chuyến xe!");
            return;
        }
        loadStudentManifest(tripCode);
    });
});

// 1. Load danh sách chuyến xe vào Dropdown
function loadTrips() {
    $.get(`${API_URL}/trips`, function(trips) {
        const $select = $('#tripSelect');
        $select.empty().append('<option value="">-- Chọn chuyến xe --</option>');
        
        // Sắp xếp chuyến mới nhất lên đầu
        trips.sort((a, b) => new Date(b.date) - new Date(a.date));

        trips.forEach(trip => {
            // Format ngày hiển thị cho đẹp
            const dateStr = new Date(trip.date).toLocaleDateString('vi-VN');
            // Lưu thêm data-route-code để dùng sau này
            $select.append(`<option value="${trip.tripCode}" 
                                     data-route="${trip.routeCode}"
                                     data-trip-id="${trip.id}">
                                [${dateStr}] ${trip.tripCode} (${trip.routeCode})
                            </option>`);
        });
    });
}

// 2. Load danh sách học sinh + trạng thái điểm danh
async function loadStudentManifest(tripCode) {
    const $option = $('#tripSelect option:selected');
    const routeCode = $option.data('route');
    const tripId = $option.data('trip-id');

    $('#tripInfoBadge').text(`Chuyến: ${tripCode}`).removeClass('d-none');
    $('#attendanceTableBody').html('<tr><td colspan="6" class="text-center">Đang tải dữ liệu...</td></tr>');

    try {
        // Gọi song song 3 API để lấy dữ liệu cần thiết
        const [assignments, students, attendances] = await Promise.all([
            $.get(`${API_URL}/assignments`),               // Lấy phân công để biết HS nào đi tuyến này
            $.get(`${API_URL}/students`),                  // Lấy chi tiết tên HS
            $.get(`${API_URL}/attendances/trip/${tripCode}`) // Lấy dữ liệu đã điểm danh trước đó
        ]);

        // Lọc ra các assignment thuộc Route của chuyến này
        const routeAssignments = assignments.filter(a => a.routeCode === routeCode && a.active);

        if (routeAssignments.length === 0) {
            $('#attendanceTableBody').html('<tr><td colspan="6" class="text-center">Không có học sinh nào được phân công cho tuyến này.</td></tr>');
            return;
        }

        let html = '';
        routeAssignments.forEach((assign, index) => {
            // Tìm thông tin chi tiết học sinh
            const student = students.find(s => s.mahs === assign.studentCode) || {};
            
            // Tìm xem học sinh này đã được điểm danh chưa
            const attended = attendances.find(a => a.studentCode === assign.studentCode);
            
            // Xác định trạng thái nút bấm
            const isPresent = attended && attended.status === 'present';
            const isAbsent = attended && attended.status === 'absent';
            
            html += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td><span class="fw-bold text-primary">${assign.studentCode}</span></td>
                    <td>${student.hoten || 'N/A'}</td>
                    <td>${student.lop || 'N/A'}</td>
                    <td><span class="badge bg-secondary">${assign.pickStopCode}</span></td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" 
                                class="btn btn-sm ${isPresent ? 'btn-success' : 'btn-outline-success'} btn-attendance"
                                onclick="submitAttendance('${tripCode}', '${tripId}', '${assign.studentCode}', '${assign.studentId}', 'present')">
                                <i class="bi bi-check-circle"></i> Có mặt
                            </button>
                            <button type="button" 
                                class="btn btn-sm ${isAbsent ? 'btn-danger' : 'btn-outline-danger'} btn-attendance"
                                onclick="submitAttendance('${tripCode}', '${tripId}', '${assign.studentCode}', '${assign.studentId}', 'absent')">
                                <i class="bi bi-x-circle"></i> Vắng
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        $('#attendanceTableBody').html(html);

    } catch (error) {
        console.error(error);
        alert("Lỗi khi tải dữ liệu. Vui lòng kiểm tra Console.");
    }
}

// 3. Hàm gửi dữ liệu điểm danh
window.submitAttendance = function(tripCode, tripId, studentCode, studentId, status) {
    const data = {
        tripCode: tripCode,
        tripId: tripId,
        studentCode: studentCode,
        studentId: studentId,
        status: status,
        note: ""
    };

    $.ajax({
        url: `${API_URL}/attendances`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            // Reload lại bảng để cập nhật màu nút (hoặc có thể update UI trực tiếp để nhanh hơn)
            loadStudentManifest(tripCode); 
        },
        error: function(err) {
            alert("Lỗi khi lưu điểm danh!");
        }
    });
};