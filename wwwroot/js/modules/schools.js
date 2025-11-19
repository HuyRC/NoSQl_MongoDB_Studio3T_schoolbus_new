/**
 * Schools Module - FIXED VERSION
 * Handles school management operations
 */

let schoolsTable;
let isEditMode = false;

$(document).ready(function() {
    initSchoolsTable();
    loadSchools();
});

// Initialize DataTable
function initSchoolsTable() {
    schoolsTable = $('#schoolsTable').DataTable({
        columns: [
            { data: null, render: (data, type, row, meta) => meta.row + 1 },
            { data: 'code', render: (data) => `<span class="school-badge ${data}">${data}</span>` },
            { data: 'name' },
            { data: 'address' },
            { 
                data: 'active',
                render: (data) => data ? 
                    '<span class="badge status-active">Hoạt động</span>' : 
                    '<span class="badge status-inactive">Ngừng</span>'
            },
            {
                data: null,
                orderable: false,
                render: (data, type, row) => {
                    const id = row.id || row._id;
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-action btn-edit" onclick="editSchool('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteSchool('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

// Load all schools
async function loadSchools() {
    try {
        showLoading();
        const schools = await api.getSchools();
        
        schoolsTable.clear();
        schoolsTable.rows.add(schools);
        schoolsTable.draw();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load schools error:', error);
        showError('Không thể tải danh sách trường học: ' + error.message);
    }
}

// Open Add School Modal
function openAddSchoolModal() {
    isEditMode = false;
    $('#schoolModalTitle').html('<i class="fas fa-school me-2"></i>Thêm trường học');
    $('#schoolForm')[0].reset();
    $('#schoolId').val('');
    $('#schoolActive').prop('checked', true);
    $('#schoolCode').prop('disabled', false);
}

// Edit School
async function editSchool(id) {
    try {
        showLoading();
        
        // Get all schools and find the one to edit
        const schools = await api.getSchools();
        const school = schools.find(s => s.id === id || s._id === id);
        
        if (!school) {
            hideLoading();
            showError('Không tìm thấy thông tin trường học');
            return;
        }
        
        // Fill form
        isEditMode = true;
        $('#schoolModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa trường học');
        $('#schoolId').val(school.id || school._id);
        $('#schoolCode').val(school.code).prop('disabled', true);
        $('#schoolName').val(school.name);
        $('#schoolAddress').val(school.address);
        $('#schoolActive').prop('checked', school.active !== false);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('schoolModal'));
        modal.show();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Edit school error:', error);
        showError('Không thể tải thông tin trường học: ' + error.message);
    }
}

// Save School (Create or Update)
async function saveSchool() {
    try {
        // Validate form
        const form = $('#schoolForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Get form data
        const schoolData = {
            code: $('#schoolCode').val().trim().toUpperCase(),
            name: $('#schoolName').val().trim(),
            address: $('#schoolAddress').val().trim(),
            active: $('#schoolActive').is(':checked')
        };
        
        // Validate
        if (!schoolData.code || !schoolData.name || !schoolData.address) {
            showError('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        showLoading();
        
        if (isEditMode) {
            // Update
            const id = $('#schoolId').val();
            await api.updateSchool(id, schoolData);
            showSuccess('Cập nhật trường học thành công');
        } else {
            // Create
            await api.createSchool(schoolData);
            showSuccess('Thêm trường học thành công');
        }
        
        // Close modal and reload
        bootstrap.Modal.getInstance(document.getElementById('schoolModal')).hide();
        await loadSchools();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Save school error:', error);
        showError('Không thể lưu trường học: ' + error.message);
    }
}

// Delete School
async function deleteSchool(id) {
    const confirmed = await confirmDelete('Bạn có chắc chắn muốn xóa trường học này?');
    
    if (!confirmed) return;
    
    try {
        showLoading();
        await api.deleteSchool(id);
        showSuccess('Xóa trường học thành công');
        await loadSchools();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Delete school error:', error);
        showError('Không thể xóa trường học: ' + error.message);
    }
}