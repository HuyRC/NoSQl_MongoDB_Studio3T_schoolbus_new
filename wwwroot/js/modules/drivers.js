/**
 * Drivers Module - Quản lý Tài xế
 */

let driversTable;
let isEditMode = false;
let allDrivers = [];

$(document).ready(function() {
    initDriversTable();
    loadDrivers();
});

function initDriversTable() {
    driversTable = $('#driversTable').DataTable({
        columns: [
            { data: null, render: (data, type, row, meta) => meta.row + 1 },
            { data: 'code', render: (data) => `<strong>${data}</strong>` },
            { data: 'fullName' },
            { data: 'phone', render: (data) => `<i class="fas fa-phone me-1"></i>${data}` },
            { data: 'licenseNo', render: (data) => data || '<span class="text-muted">Chưa cập nhật</span>' },
            { 
                data: 'active',
                render: (data) => getStatusBadge(data ? 'true' : 'false')
            },
            {
                data: null,
                orderable: false,
                render: (data, type, row) => `
                    <div class="action-buttons">
                        <button class="btn btn-action btn-edit" onclick="editDriver('${row.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-action btn-delete" onclick="deleteDriver('${row.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `
            }
        ]
    });
}

async function loadDrivers() {
    try {
        showLoading();
        allDrivers = await api.getDrivers();
        
        driversTable.clear();
        driversTable.rows.add(allDrivers);
        driversTable.draw();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Không thể tải danh sách tài xế: ' + error.message);
    }
}

function openAddDriverModal() {
    isEditMode = false;
    $('#driverModalTitle').html('<i class="fas fa-id-card me-2"></i>Thêm tài xế');
    $('#driverForm')[0].reset();
    $('#driverId').val('');
    $('#driverActive').prop('checked', true);
    $('#driverCode').prop('disabled', false);
}

async function editDriver(id) {
    try {
        showLoading();
        const driver = allDrivers.find(d => d.id === id);
        
        if (!driver) {
            hideLoading();
            showError('Không tìm thấy thông tin tài xế');
            return;
        }
        
        isEditMode = true;
        $('#driverModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa tài xế');
        $('#driverId').val(driver.id);
        $('#driverCode').val(driver.code).prop('disabled', true);
        $('#driverName').val(driver.fullName);
        $('#driverPhone').val(driver.phone);
        $('#driverLicense').val(driver.licenseNo || '');
        $('#driverActive').prop('checked', driver.active);
        
        const modal = new bootstrap.Modal(document.getElementById('driverModal'));
        modal.show();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Không thể tải thông tin tài xế: ' + error.message);
    }
}

async function saveDriver() {
    try {
        const form = $('#driverForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const driverData = {
            code: $('#driverCode').val().trim().toUpperCase(),
            fullName: $('#driverName').val().trim(),
            phone: $('#driverPhone').val().trim(),
            licenseNo: $('#driverLicense').val().trim() || null,
            active: $('#driverActive').is(':checked')
        };
        
        if (!driverData.code || !driverData.fullName || !driverData.phone) {
            showError('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        // Validate phone number (simple validation)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(driverData.phone)) {
            showError('Số điện thoại không hợp lệ (10-11 số)');
            return;
        }
        
        showLoading();
        
        if (isEditMode) {
            const id = $('#driverId').val();
            await api.updateDriver(id, driverData);
            showSuccess('Cập nhật tài xế thành công');
        } else {
            await api.createDriver(driverData);
            showSuccess('Thêm tài xế thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('driverModal')).hide();
        await loadDrivers();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Không thể lưu tài xế: ' + error.message);
    }
}

async function deleteDriver(id) {
    const confirmed = await confirmDelete('Bạn có chắc chắn muốn xóa tài xế này?');
    if (!confirmed) return;
    
    try {
        showLoading();
        await api.deleteDriver(id);
        showSuccess('Xóa tài xế thành công');
        await loadDrivers();
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Không thể xóa tài xế: ' + error.message);
    }
}