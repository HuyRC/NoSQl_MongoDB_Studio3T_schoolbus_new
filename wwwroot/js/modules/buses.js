/**
 * Buses Module - COMPLETE FIXED VERSION
 */

let busesTable;
let isEditMode = false;
let allBuses = [];

$(document).ready(function() {
    initBusesTable();
    loadBuses();
});

function initBusesTable() {
    busesTable = $('#busesTable').DataTable({
        columns: [
            { data: null, render: (data, type, row, meta) => meta.row + 1 },
            { data: 'code', render: data => `<strong>${data}</strong>` },
            { data: 'plate', render: data => `<span class="badge bg-primary">${data}</span>` },
            { data: 'brand', render: data => data || '-' },
            { data: 'year', render: data => data || '-' },
            { data: 'capacity', render: data => `${data} chỗ` },
            { 
                data: 'active',
                render: data => getStatusBadge(data ? 'true' : 'false')
            },
            {
                data: null,
                orderable: false,
                render: (data, type, row) => {
                    const id = row.id || row._id;
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-action btn-edit" onclick="editBus('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteBus('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
}

async function loadBuses() {
    try {
        showLoading();
        allBuses = await api.getBuses();
        console.log('Loaded buses:', allBuses);
        
        busesTable.clear();
        busesTable.rows.add(allBuses);
        busesTable.draw();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load buses error:', error);
        showError('Không thể tải danh sách xe buýt: ' + error.message);
    }
}

function openAddBusModal() {
    isEditMode = false;
    $('#busModalTitle').html('<i class="fas fa-bus me-2"></i>Thêm xe buýt');
    $('#busForm')[0].reset();
    $('#busId').val('');
    $('#busActive').prop('checked', true);
    $('#busCode').prop('disabled', false);
}

async function viewBus(id) {
    try {
        const bus = allBuses.find(b => (b.id || b._id) === id);
        if (!bus) {
            showError('Không tìm thấy xe buýt');
            return;
        }
        
        Swal.fire({
            title: `<i class="fas fa-bus me-2"></i>${bus.plate}`,
            html: `
                <div class="text-start">
                    <p><strong>Mã xe:</strong> ${bus.code}</p>
                    <p><strong>Biển số:</strong> <span class="badge bg-primary">${bus.plate}</span></p>
                    <p><strong>Hãng xe:</strong> ${bus.brand || 'Chưa cập nhật'}</p>
                    <p><strong>Năm sản xuất:</strong> ${bus.year || 'Chưa cập nhật'}</p>
                    <hr>
                    <p><strong>Sức chứa:</strong> ${bus.capacity} chỗ</p>
                    <p><strong>Trạng thái:</strong> ${getStatusBadge(bus.active ? 'true' : 'false')}</p>
                </div>
            `,
            width: 600,
            showCloseButton: true,
            confirmButtonText: 'Đóng'
        });
    } catch (e) {
        console.error('View bus error:', e);
        showError('Không thể xem chi tiết: ' + e.message);
    }
}

async function editBus(id) {
    try {
        showLoading();
        const bus = allBuses.find(b => (b.id || b._id) === id);
        
        if (!bus) {
            hideLoading();
            showError('Không tìm thấy thông tin xe buýt');
            return;
        }
        
        isEditMode = true;
        $('#busModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa xe buýt');
        $('#busId').val(bus.id || bus._id);
        $('#busCode').val(bus.code).prop('disabled', true);
        $('#busPlate').val(bus.plate);
        $('#busBrand').val(bus.brand || '');
        $('#busYear').val(bus.year || '');
        $('#busCapacity').val(bus.capacity);
        $('#busActive').prop('checked', bus.active !== false);
        
        const modal = new bootstrap.Modal(document.getElementById('busModal'));
        modal.show();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Edit bus error:', error);
        showError('Không thể tải thông tin xe buýt: ' + error.message);
    }
}

async function saveBus() {
    try {
        const form = $('#busForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const busData = {
            code: $('#busCode').val().trim().toUpperCase(),
            plate: $('#busPlate').val().trim(),
            brand: $('#busBrand').val().trim() || null,
            year: $('#busYear').val() ? parseInt($('#busYear').val()) : null,
            capacity: parseInt($('#busCapacity').val()),
            active: $('#busActive').is(':checked')
        };
        
        if (!busData.code || !busData.plate || !busData.capacity) {
            showError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        
        showLoading();
        
        if (isEditMode) {
            const id = $('#busId').val();
            await api.updateBus(id, busData);
            showSuccess('Cập nhật xe buýt thành công');
        } else {
            await api.createBus(busData);
            showSuccess('Thêm xe buýt thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('busModal')).hide();
        await loadBuses();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Save bus error:', error);
        showError('Không thể lưu xe buýt: ' + error.message);
    }
}

async function deleteBus(id) {
    const confirmed = await confirmDelete('Bạn có chắc chắn muốn xóa xe buýt này?');
    if (!confirmed) return;
    
    try {
        showLoading();
        await api.deleteBus(id);
        showSuccess('Xóa xe buýt thành công');
        await loadBuses();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Delete bus error:', error);
        showError('Không thể xóa xe buýt: ' + error.message);
    }
}