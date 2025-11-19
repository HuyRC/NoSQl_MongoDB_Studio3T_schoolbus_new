/**
 * Students Module
 * Handles student management operations
 */

let studentsTable;
let isEditMode = false;
let allStudents = [];
let allSchools = [];

$(document).ready(function () {
    initStudentsTable();
    loadSchools();
    loadStudents();
});

// =======================================
// DataTable
// =======================================
function initStudentsTable() {
    studentsTable = $('#studentsTable').DataTable({
        columns: [
            { data: null, render: (d, t, r, meta) => meta.row + 1 },
            { data: 'mahs' },
            { data: 'hoten' },
            { data: 'lop' },
            { data: 'ngaysinh', render: (d) => formatDate(d) },
            { data: 'phai', render: (d) => getGenderIcon(d) },
            { data: 'schoolCode', render: (d) => getSchoolBadge(d) },
            { data: 'diachi', render: (d) => `<small>${d}</small>` },
            {
                data: 'active',
                render: (d) =>
                    d
                        ? '<span class="badge status-active">Hoạt động</span>'
                        : '<span class="badge status-inactive">Ngừng</span>',
            },
            {
                data: null,
                orderable: false,
                render: (data, type, row) => {
                    const id = row.id || row._id;
                    // <button class="btn btn-action btn-view" onclick="viewStudent('${id}')">
                    //             <i class="fas fa-eye"></i>
                    // </button>
                    return `
                        <div class="action-buttons">
                            
                            <button class="btn btn-action btn-edit" onclick="editStudent('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteStudent('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>`;
                },
            },
        ],
    });
}

// =======================================
// Load Schools
// =======================================
async function loadSchools() {
    try {
        allSchools = await api.getSchools();

        const schoolSelect = $('#studentSchool');
        const filterSelect = $('#filterSchool');

        schoolSelect.empty().append(`<option value="">-- Chọn trường --</option>`);
        filterSelect.empty().append(`<option value="">Tất cả trường</option>`);

        allSchools.forEach((s) => {
            const opt = `<option value="${s.code}" data-id="${s.id}">${s.name}</option>`;
            schoolSelect.append(opt);
            filterSelect.append(opt);
        });
    } catch (err) {
        showError('Không thể tải danh sách trường: ' + err.message);
    }
}

// =======================================
// Load Students
// =======================================
async function loadStudents() {
    try {
        showLoading();
        allStudents = await api.getStudents();

        studentsTable.clear();
        studentsTable.rows.add(allStudents);
        studentsTable.draw();

        hideLoading();
    } catch (err) {
        hideLoading();
        showError('Không thể tải danh sách học sinh: ' + err.message);
    }
}

// =======================================
// Filter Students
// =======================================
function filterStudents() {
    const schoolFilter = $('#filterSchool').val();
    const genderFilter = $('#filterGender').val();
    const activeFilter = $('#filterActive').val();

    let filtered = [...allStudents];

    if (schoolFilter) filtered = filtered.filter((s) => s.schoolCode === schoolFilter);
    if (genderFilter) filtered = filtered.filter((s) => s.phai === genderFilter);
    if (activeFilter !== '') {
        const isActive = activeFilter === 'true';
        filtered = filtered.filter((s) => s.active === isActive);
    }

    studentsTable.clear();
    studentsTable.rows.add(filtered);
    studentsTable.draw();
}

// =======================================
// Add Student
// =======================================
function openAddStudentModal() {
    isEditMode = false;
    $('#studentModalTitle').html('<i class="fas fa-user-graduate me-2"></i>Thêm học sinh');
    $('#studentForm')[0].reset();
    $('#studentId').val('');
    $('#studentActive').prop('checked', true);
    $('#studentMahs').prop('disabled', false);
}

// =======================================
// Edit Student
// =======================================
async function editStudent(id) {
    try {
        showLoading();

        // tìm theo id hoặc _id cho chắc
        const student = allStudents.find((s) => (s.id === id || s._id === id));

        if (!student) {
            hideLoading();
            return showError('Không tìm thấy thông tin học sinh');
        }

        isEditMode = true;

        $('#studentModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa học sinh');
        $('#studentId').val(student.id || student._id);
        $('#studentMahs').val(student.mahs).prop('disabled', true);
        $('#studentName').val(student.hoten);
        $('#studentClass').val(student.lop);

        const birth = new Date(student.ngaysinh);
        $('#studentBirthdate').val(birth.toISOString().split('T')[0]);

        $('#studentGender').val(student.phai);
        $('#studentAddress').val(student.diachi);
        $('#studentSchool').val(student.schoolCode);
        $('#studentActive').prop('checked', student.active);

        const modalEl = document.getElementById('studentModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();

        hideLoading();
    } catch (err) {
        hideLoading();
        showError('Không thể tải thông tin học sinh: ' + err.message);
    }
}
// =======================================
// Save Student
// =======================================
async function saveStudent() {
    try {
        const form = $('#studentForm')[0];
        if (!form.checkValidity()) return form.reportValidity();

        const schoolCode = $('#studentSchool').val();
        const selectedSchool = allSchools.find((s) => s.code === schoolCode);

        if (!selectedSchool) return showError('Vui lòng chọn trường học');

        const data = {
            mahs: $('#studentMahs').val().trim().toUpperCase(),
            hoten: $('#studentName').val().trim(),
            lop: $('#studentClass').val().trim(),
            ngaysinh: new Date($('#studentBirthdate').val()).toISOString(),
            phai: $('#studentGender').val(),
            diachi: $('#studentAddress').val().trim(),
            schoolCode,
            schoolId: selectedSchool.id || selectedSchool._id,
            active: $('#studentActive').is(':checked'),
        };

        showLoading();

        if (isEditMode) {
            const id = $('#studentId').val();
            await api.updateStudent(id, data);
            showSuccess('Cập nhật học sinh thành công');
        } else {
            await api.createStudent(data);
            showSuccess('Thêm học sinh thành công');
        }

        bootstrap.Modal.getInstance('#studentModal').hide();
        await loadStudents();
        hideLoading();
    } catch (err) {
        hideLoading();
        showError('Không thể lưu học sinh: ' + err.message);
    }
}

// =======================================
// Delete Student
// =======================================
async function deleteStudent(id) {
    const confirmDeleteAction = await confirmDelete('Bạn có chắc chắn muốn xóa học sinh này?');
    if (!confirmDeleteAction) return;

    try {
        showLoading();
        await api.deleteStudent(id);
        showSuccess('Xóa học sinh thành công');
        await loadStudents();
        hideLoading();
    } catch (err) {
        hideLoading();
        showError('Không thể xóa học sinh: ' + err.message);
    }
}

// =======================================
// ⭐ VIEW STUDENT (GLOBAL)
// =======================================
window.viewStudent = function (id) {
    // tìm theo id hoặc _id
    const student = allStudents.find((s) => (s.id === id || s._id === id));

    if (!student) return showError('Không tìm thấy thông tin học sinh');

    // Đổ dữ liệu ra modal
    $('#viewMahs').text(student.mahs);
    $('#viewHoten').text(student.hoten);
    $('#viewLop').text(student.lop);
    $('#viewNgaysinh').text(formatDate(student.ngaysinh));
    $('#viewPhai').html(getGenderIcon(student.phai));
    $('#viewSchool').text(student.schoolCode);
    $('#viewAddress').text(student.diachi);
    $('#viewActive').html(
        student.active
            ? '<span class="badge status-active">Hoạt động</span>'
            : '<span class="badge status-inactive">Ngừng</span>'
    );

    // 🔥 MỞ MODAL ĐÚNG CÁCH GIỐNG ROUTES
    const modalEl = document.getElementById('viewStudentModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
};

