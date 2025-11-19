/**
 * Assignments Module - FIXED COMPLETE VERSION
 */

let assignmentsTable, isEditMode = false;
let allAssignments = [], allStudents = [], allRoutes = [], allSchools = [];
let currentRouteStops = [];

$(document).ready(function() {
    initAssignmentsTable();
    loadAllData();
});

async function loadAllData() {
    try {
        showLoading();
        
        await Promise.all([
            loadSchools(),
            loadStudents(),
            loadRoutes(),
            loadAssignments()
        ]);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load data error:', error);
        showError('Không thể tải dữ liệu: ' + error.message);
    }
}

function initAssignmentsTable() {
    assignmentsTable = $('#assignmentsTable').DataTable({
        columns: [
            { data: null, render: (d,t,r,m) => m.row + 1 },
            { data: 'studentCode', render: d => `<strong>${d}</strong>` },
            { data: 'routeCode' },
            { data: 'pickStopCode', render: d => `<span class="badge bg-success">${d}</span>` },
            { data: 'dropStopCode', render: d => `<span class="badge bg-danger">${d}</span>` },
            { 
                data: 'days', 
                render: d => {
                    if (!d || d.length === 0) return '-';
                    return d.map(day => `<span class="day-pill active">${day}</span>`).join(' ');
                }
            },
            { data: 'active', render: d => getStatusBadge(d ? 'true' : 'false') },
            {
                data: null,
                orderable: false,
                render: (d,t,r) => {
                    const id = r.id || r._id;
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-action btn-view" onclick="viewAssignment('${id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-action btn-edit" onclick="editAssignment('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteAssignment('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

async function loadSchools() {
    try {
        allSchools = await api.getSchools();
        console.log('Loaded schools:', allSchools);
        
        const select = $('#filterSchool');
        select.empty().append('<option value="">Tất cả trường</option>');
        allSchools.forEach(s => {
            select.append(`<option value="${s.code}">${s.name}</option>`);
        });
    } catch (e) {
        console.error('Load schools error:', e);
        showError('Không thể tải danh sách trường: ' + e.message);
    }
}

async function loadStudents() {
    try {
        allStudents = await api.getStudents();
        console.log('Loaded students:', allStudents);
        
        const select = $('#assignStudent');
        select.empty().append('<option value="">-- Chọn học sinh --</option>');
        
        allStudents.filter(s => s.active !== false).forEach(s => {
            const id = s.id || s._id;
            select.append(`<option value="${s.mahs}" data-id="${id}" data-school="${s.schoolCode}">${s.hoten} (${s.mahs} - ${s.schoolCode})</option>`);
        });
    } catch (e) {
        console.error('Load students error:', e);
        showError('Không thể tải danh sách học sinh: ' + e.message);
    }
}

async function loadRoutes() {
    try {
        allRoutes = await api.getRoutes();
        console.log('Loaded routes:', allRoutes);
        
        $('#assignRoute').empty().append('<option value="">-- Chọn tuyến --</option>');
        $('#filterRoute').empty().append('<option value="">Tất cả tuyến</option>');
        
        allRoutes.filter(r => r.isActive !== false).forEach(r => {
            const id = r.id || r._id;
            const option = `<option value="${r.code}" data-id="${id}" data-school="${r.schoolCode}">${r.name} (${r.code})</option>`;
            $('#assignRoute, #filterRoute').append(option);
        });
    } catch (e) {
        console.error('Load routes error:', e);
        showError('Không thể tải danh sách tuyến: ' + e.message);
    }
}

async function loadAssignments() {
    try {
        allAssignments = await api.getAssignments();
        console.log('Loaded assignments:', allAssignments);
        
        assignmentsTable.clear().rows.add(allAssignments).draw();
    } catch (e) {
        console.error('Load assignments error:', e);
        showError('Không thể tải danh sách phân công: ' + e.message);
    }
}

function onStudentChange() {
    const studentCode = $('#assignStudent').val();
    if (!studentCode) return;
    
    const student = allStudents.find(s => s.mahs === studentCode);
    if (!student) return;
    
    // Filter routes by student's school
    const routeSelect = $('#assignRoute');
    routeSelect.find('option').each(function() {
        const schoolCode = $(this).data('school');
        if (!schoolCode || schoolCode === student.schoolCode) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

function onRouteChangeAssignment() {
    const routeCode = $('#assignRoute').val();
    if (!routeCode) {
        $('#routeInfoAssignment').hide();
        $('#assignPickStop, #assignDropStop').prop('disabled', true).html('<option value="">-- Chọn tuyến trước --</option>');
        currentRouteStops = [];
        return;
    }
    
    const route = allRoutes.find(r => r.code === routeCode);
    if (!route) return;
    
    // Show route info
    let info = `
        <p class="mb-1"><strong>Trường:</strong> ${getSchoolBadge(route.schoolCode)}</p>
        <p class="mb-0"><strong>Hướng:</strong> ${route.direction === 'morning' ? 'Sáng' : 'Chiều'}</p>
    `;
    $('#routeInfoContent').html(info);
    $('#routeInfoAssignment').show();
    
    // Populate stop dropdowns
    currentRouteStops = route.stopOrder || [];
    
    const pickSelect = $('#assignPickStop');
    const dropSelect = $('#assignDropStop');
    
    pickSelect.empty().append('<option value="">-- Chọn điểm đón --</option>');
    dropSelect.empty().append('<option value="">-- Chọn điểm trả --</option>');
    
    currentRouteStops.forEach(stop => {
        const id = stop.stopId || stop.stopId;
        const option = `<option value="${stop.stopCode}" data-id="${id}" data-seq="${stop.seq}">${stop.stopCode} (${stop.plannedTime})</option>`;
        pickSelect.append(option);
        dropSelect.append(option);
    });
    
    pickSelect.prop('disabled', false);
    dropSelect.prop('disabled', false);
    
    // Validate pick/drop order
    pickSelect.off('change').on('change', validateStopOrder);
    dropSelect.off('change').on('change', validateStopOrder);
}

function validateStopOrder() {
    const pickStopCode = $('#assignPickStop').val();
    const dropStopCode = $('#assignDropStop').val();
    
    if (!pickStopCode || !dropStopCode) return;
    
    const pickSeq = parseInt($('#assignPickStop option:selected').data('seq'));
    const dropSeq = parseInt($('#assignDropStop option:selected').data('seq'));
    
    if (pickSeq > dropSeq) {
        showError('Điểm đón phải trước điểm trả trên tuyến!');
        $('#assignDropStop').val('');
    }
}

function filterAssignments() {
    const routeFilter = $('#filterRoute').val();
    const schoolFilter = $('#filterSchool').val();
    const activeFilter = $('#filterActive').val();
    
    let filtered = [...allAssignments];
    
    if (routeFilter) {
        filtered = filtered.filter(a => a.routeCode === routeFilter);
    }
    
    if (schoolFilter) {
        filtered = filtered.filter(a => {
            const student = allStudents.find(s => s.mahs === a.studentCode);
            return student && student.schoolCode === schoolFilter;
        });
    }
    
    if (activeFilter !== '') {
        const isActive = activeFilter === 'true';
        filtered = filtered.filter(a => a.active === isActive);
    }
    
    assignmentsTable.clear().rows.add(filtered).draw();
}

function openAddAssignmentModal() {
    isEditMode = false;
    $('#assignmentModalTitle').html('<i class="fas fa-clipboard-list me-2"></i>Phân công học sinh');
    $('#assignmentForm')[0].reset();
    $('#assignmentId').val('');
    $('#routeInfoAssignment').hide();
    $('#assignActive').prop('checked', true);
    
    // Reset days checkboxes
    $('#daysSelection input[type="checkbox"]').each(function() {
        const val = $(this).val();
        $(this).prop('checked', ['Mon','Tue','Wed','Thu','Fri'].includes(val));
    });
    
    $('#assignPickStop, #assignDropStop').prop('disabled', true);
}

async function viewAssignment(id) {
    try {
        const assignment = allAssignments.find(a => (a.id || a._id) === id);
        if (!assignment) {
            showError('Không tìm thấy phân công');
            return;
        }
        
        const student = allStudents.find(s => s.mahs === assignment.studentCode);
        const route = allRoutes.find(r => r.code === assignment.routeCode);
        
        const daysVN = {
            'Mon': 'Thứ 2', 'Tue': 'Thứ 3', 'Wed': 'Thứ 4',
            'Thu': 'Thứ 5', 'Fri': 'Thứ 6', 'Sat': 'Thứ 7', 'Sun': 'CN'
        };
        const daysText = (assignment.days || []).map(d => daysVN[d] || d).join(', ');
        
        Swal.fire({
            title: '<i class="fas fa-clipboard-list me-2"></i>Chi tiết phân công',
            html: `
                <div class="text-start">
                    <h6 class="text-primary">Thông tin học sinh:</h6>
                    <p><strong>Mã HS:</strong> ${assignment.studentCode}</p>
                    <p><strong>Họ tên:</strong> ${student ? student.hoten : '-'}</p>
                    <p><strong>Lớp:</strong> ${student ? student.lop : '-'}</p>
                    <hr>
                    <h6 class="text-primary">Thông tin tuyến:</h6>
                    <p><strong>Tuyến:</strong> ${route ? route.name : assignment.routeCode}</p>
                    <p><strong>Hướng:</strong> ${route ? (route.direction === 'morning' ? 'Sáng' : 'Chiều') : '-'}</p>
                    <hr>
                    <h6 class="text-primary">Điểm đón/trả:</h6>
                    <p><strong>Điểm đón:</strong> <span class="badge bg-success">${assignment.pickStopCode}</span></p>
                    <p><strong>Điểm trả:</strong> <span class="badge bg-danger">${assignment.dropStopCode}</span></p>
                    <hr>
                    <h6 class="text-primary">Lịch trình:</h6>
                    <p><strong>Ngày:</strong> ${daysText || '-'}</p>
                    <p><strong>Trạng thái:</strong> ${getStatusBadge(assignment.active ? 'true' : 'false')}</p>
                </div>
            `,
            width: 600,
            showCloseButton: true,
            confirmButtonText: 'Đóng'
        });
    } catch (e) {
        console.error('View assignment error:', e);
        showError('Không thể xem chi tiết: ' + e.message);
    }
}

async function editAssignment(id) {
    try {
        showLoading();
        const assignment = allAssignments.find(a => (a.id || a._id) === id);
        if (!assignment) {
            hideLoading();
            showError('Không tìm thấy phân công');
            return;
        }
        
        isEditMode = true;
        $('#assignmentModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa phân công');
        $('#assignmentId').val(assignment.id || assignment._id);
        
        $('#assignStudent').val(assignment.studentCode);
        onStudentChange();
        
        $('#assignRoute').val(assignment.routeCode);
        onRouteChangeAssignment();
        
        // Wait for stops to load
        setTimeout(() => {
            $('#assignPickStop').val(assignment.pickStopCode);
            $('#assignDropStop').val(assignment.dropStopCode);
        }, 100);
        
        $('#assignActive').prop('checked', assignment.active !== false);
        
        // Set days
        $('#daysSelection input[type="checkbox"]').prop('checked', false);
        (assignment.days || []).forEach(day => {
            $(`#daysSelection input[value="${day}"]`).prop('checked', true);
        });
        
        const modal = new bootstrap.Modal(document.getElementById('assignmentModal'));
        modal.show();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Edit assignment error:', e);
        showError('Không thể tải thông tin phân công: ' + e.message);
    }
}

async function saveAssignment() {
    try {
        const form = $('#assignmentForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const studentCode = $('#assignStudent').val();
        const routeCode = $('#assignRoute').val();
        const pickStopCode = $('#assignPickStop').val();
        const dropStopCode = $('#assignDropStop').val();
        
        const student = allStudents.find(s => s.mahs === studentCode);
        const route = allRoutes.find(r => r.code === routeCode);
        const pickStop = currentRouteStops.find(s => s.stopCode === pickStopCode);
        const dropStop = currentRouteStops.find(s => s.stopCode === dropStopCode);
        
        if (!student || !route || !pickStop || !dropStop) {
            showError('Vui lòng chọn đầy đủ thông tin');
            return;
        }
        
        // Get selected days
        const days = [];
        $('#daysSelection input[type="checkbox"]:checked').each(function() {
            days.push($(this).val());
        });
        
        if (days.length === 0) {
            showError('Vui lòng chọn ít nhất một ngày trong tuần');
            return;
        }
        
        const data = {
            studentCode: studentCode,
            studentId: student.id || student._id,
            routeCode: routeCode,
            routeId: route.id || route._id,
            pickStopCode: pickStopCode,
            pickStopId: pickStop.stopId,
            dropStopCode: dropStopCode,
            dropStopId: dropStop.stopId,
            days: days,
            active: $('#assignActive').is(':checked')
        };
        
        showLoading();
        
        if (isEditMode) {
            await api.updateAssignment($('#assignmentId').val(), data);
            showSuccess('Cập nhật phân công thành công');
        } else {
            await api.createAssignment(data);
            showSuccess('Phân công học sinh thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('assignmentModal')).hide();
        await loadAssignments();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Save assignment error:', e);
        showError('Không thể lưu phân công: ' + e.message);
    }
}

async function deleteAssignment(id) {
    if (!await confirmDelete('Bạn có chắc chắn muốn xóa phân công này?')) return;
    
    try {
        showLoading();
        await api.deleteAssignment(id);
        showSuccess('Xóa phân công thành công');
        await loadAssignments();
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Delete assignment error:', e);
        showError('Không thể xóa phân công: ' + e.message);
    }
}