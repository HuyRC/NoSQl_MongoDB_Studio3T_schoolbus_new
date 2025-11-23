const API_URL = "http://localhost:5100/api";

$(document).ready(function() {
    loadTrips();

    $('#btnLoadManifest').click(function() {
        const tripCode = $('#tripSelect').val();
        if(!tripCode) {
            Swal.fire('Chưa chọn chuyến!', 'Vui lòng chọn một chuyến xe để tiếp tục.', 'warning');
            return;
        }
        loadStudentManifest(tripCode);
    });
});

// 1. Load danh sách chuyến xe
function loadTrips() {
    $.get(`${API_URL}/trips`, function(trips) {
        const $select = $('#tripSelect');
        $select.empty().append('<option value="">-- Chọn chuyến xe --</option>');
        
        // Sắp xếp chuyến mới nhất lên đầu
        trips.sort((a, b) => new Date(b.date) - new Date(a.date));

        trips.forEach(trip => {
            const dateStr = new Date(trip.date).toLocaleDateString('vi-VN');
            $select.append(`<option value="${trip.tripCode}" 
                                     data-route="${trip.routeCode}"
                                     data-trip-id="${trip.id}"
                                     data-time="${new Date(trip.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}">
                                [${dateStr}] ${trip.tripCode} (${trip.routeCode})
                            </option>`);
        });
    });
}

// 2. Load danh sách học sinh (Logic render nút bấm)
async function loadStudentManifest(tripCode) {
    const $option = $('#tripSelect option:selected');
    const routeCode = $option.data('route');
    const tripId = $option.data('trip-id');
    const tripTime = $option.data('time');

    // Cập nhật UI Header
    $('#tripInfoBadge').removeClass('d-none');
    $('#tripInfoText').text(tripTime);

    $('#attendanceTableBody').html('<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Đang tải dữ liệu...</p></td></tr>');

    try {
        const [assignments, students, attendances] = await Promise.all([
            $.get(`${API_URL}/assignments`),
            $.get(`${API_URL}/students`),
            $.get(`${API_URL}/attendances/trip/${tripCode}`)
        ]);

        const routeAssignments = assignments.filter(a => a.routeCode === routeCode && a.active);

        if (routeAssignments.length === 0) {
            $('#attendanceTableBody').html('<tr><td colspan="6" class="text-center py-5 text-muted">Không có học sinh nào được phân công cho tuyến này.</td></tr>');
            return;
        }

        let html = '';
        routeAssignments.forEach((assign, index) => {
            const student = students.find(s => s.mahs === assign.studentCode) || {};
            
            // Tìm trạng thái hiện tại (nếu có)
            const attendanceRecord = attendances.find(a => a.studentCode === assign.studentCode);
            const currentStatus = attendanceRecord ? attendanceRecord.status : null; // 'present', 'absent' hoặc null

            // Xác định class CSS cho nút
            const btnPresentClass = currentStatus === 'present' ? 'btn-success' : 'btn-outline-success';
            const btnAbsentClass = currentStatus === 'absent' ? 'btn-danger' : 'btn-outline-danger';

            html += `
                <tr>
                    <td class="text-center fw-bold text-secondary">${index + 1}</td>
                    <td><span class="badge bg-light text-dark border">${assign.studentCode}</span></td>
                    <td class="fw-bold text-dark">${student.hoten || 'N/A'}</td>
                    <td>${student.lop || 'N/A'}</td>
                    <td><div class="d-flex align-items-center"><i class="bi bi-geo-alt-fill text-danger me-2"></i>${assign.pickStopCode}</div></td>
                    <td class="text-center">
                        <div class="btn-group shadow-sm" role="group">
                            <button type="button" 
                                class="btn ${btnPresentClass} btn-sm px-3 py-2"
                                onclick="toggleAttendance('${tripCode}', '${tripId}', '${assign.studentCode}', '${assign.studentId}', 'present', '${currentStatus}')">
                                <i class="bi bi-check-circle-fill me-1"></i> Có mặt
                            </button>
                            
                            <button type="button" 
                                class="btn ${btnAbsentClass} btn-sm px-3 py-2"
                                onclick="toggleAttendance('${tripCode}', '${tripId}', '${assign.studentCode}', '${assign.studentId}', 'absent', '${currentStatus}')">
                                <i class="bi bi-x-circle-fill me-1"></i> Vắng
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        $('#attendanceTableBody').html(html);
        $('#rowCounter').text(`Đang hiển thị ${routeAssignments.length} học sinh`);

    } catch (error) {
        console.error(error);
        Swal.fire('Lỗi', 'Không thể tải dữ liệu điểm danh', 'error');
    }
}

// 3. Hàm Xử lý Bật/Tắt điểm danh (QUAN TRỌNG)
window.toggleAttendance = function(tripCode, tripId, studentCode, studentId, actionStatus, currentStatus) {
    
    // LOGIC: Nếu nút bấm trùng với trạng thái hiện tại => XÓA (Hủy chọn)
    if (actionStatus === currentStatus) {
        // Gọi API Xóa
        $.ajax({
            url: `${API_URL}/attendances/${tripCode}/${studentCode}`,
            type: 'DELETE',
            success: function() {
                // Reload lại bảng để cập nhật giao diện (về trạng thái trắng)
                loadStudentManifest(tripCode);
            },
            error: function() {
                Swal.fire('Lỗi', 'Không thể hủy điểm danh', 'error');
            }
        });
    } else {
        // LOGIC: Nếu khác trạng thái hoặc chưa có => GỌI API LƯU (Như cũ)
        const data = {
            tripCode: tripCode, tripId: tripId,
            studentCode: studentCode, studentId: studentId,
            status: actionStatus, note: ""
        };

        $.ajax({
            url: `${API_URL}/attendances`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                loadStudentManifest(tripCode);
            },
            error: function() {
                Swal.fire('Lỗi', 'Không thể lưu điểm danh', 'error');
            }
        });
    }
};

// 4. Hàm Xuất Excel
window.exportToExcel = function() {
    // Kiểm tra xem có dữ liệu không
    if ($('#attendanceTableBody tr').length === 0 || $('#attendanceTableBody td').length <= 1) {
        Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'warning');
        return;
    }

    const tripCode = $('#tripSelect').val();
    const tripText = $('#tripSelect option:selected').text().trim(); // Lấy tên chuyến để đặt tên file
    
    // Tạo mảng dữ liệu để xuất
    let data = [];
    
    // Thêm Tiêu đề cột
    data.push(["STT", "Mã Học Sinh", "Họ Tên", "Lớp", "Điểm Đón", "Trạng Thái", "Ghi Chú"]);

    // Duyệt qua từng dòng trong bảng HTML để lấy dữ liệu
    $('#attendanceTableBody tr').each(function(index, tr) {
        const tds = $(tr).find('td');
        
        // Lấy thông tin cơ bản
        const stt = $(tds[0]).text();
        const maHS = $(tds[1]).text();
        const tenHS = $(tds[2]).text();
        const lop = $(tds[3]).text();
        const diemDon = $(tds[4]).text();
        
        // Xử lý logic trạng thái (Dựa vào class của nút bấm)
        let trangThai = "Chưa điểm danh";
        const btnPresent = $(tds[5]).find('button:first-child'); // Nút Có mặt
        const btnAbsent = $(tds[5]).find('button:last-child');   // Nút Vắng

        if (btnPresent.hasClass('btn-success')) {
            trangThai = "CÓ MẶT";
        } else if (btnAbsent.hasClass('btn-danger')) {
            trangThai = "VẮNG";
        }

        data.push([stt, maHS, tenHS, lop, diemDon, trangThai, ""]);
    });

    // Tạo Workbook và Worksheet mới
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Tinh chỉnh độ rộng cột (cho đẹp)
    ws['!cols'] = [
        { wch: 5 },  // STT
        { wch: 15 }, // Mã HS
        { wch: 25 }, // Tên
        { wch: 10 }, // Lớp
        { wch: 20 }, // Điểm đón
        { wch: 15 }, // Trạng thái
        { wch: 20 }  // Ghi chú
    ];

    // Thêm sheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "DiemDanh");

    // Tạo tên file: DiemDanh_TRIP-CODE_NgayGio.xlsx
    const fileName = `BaoCao_DiemDanh_${tripCode}.xlsx`;

    // Xuất file
    XLSX.writeFile(wb, fileName);
};