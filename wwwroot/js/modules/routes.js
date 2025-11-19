/**
 * Routes Module - FIXED VERSION
 */

let routesTable, isEditMode = false, allRoutes = [], allSchools = [], allStops = [];
let currentStopOrder = [];

$(document).ready(function() {
    initRoutesTable();
    loadData(); // Load tất cả data cùng lúc
});

// Load all data
async function loadData() {
    try {
        showLoading();
        
        // Load parallel
        await Promise.all([
            loadSchools(),
            loadStops(),
            loadRoutes()
        ]);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load data error:', error);
        showError('Không thể tải dữ liệu: ' + error.message);
    }
}

function initRoutesTable() {
    routesTable = $('#routesTable').DataTable({
        columns: [
            { data: null, render: (d,t,r,m) => m.row + 1 },
            { data: 'code', render: d => `<strong>${d}</strong>` },
            { data: 'name' },
            { data: 'schoolCode', render: d => getSchoolBadge(d) },
            { 
                data: 'direction', 
                render: d => d === 'morning' ? 
                    '<span class="badge bg-info">Sáng</span>' : 
                    '<span class="badge bg-warning">Chiều</span>' 
            },
            { data: 'stopOrder', render: d => `<span class="badge bg-primary">${d?.length || 0} điểm</span>` },
            { data: 'isActive', render: d => getStatusBadge(d ? 'true' : 'false') },
            {
                data: null,
                orderable: false,
                render: (d,t,r) => {
                    const id = r.id || r._id;
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-action btn-view" onclick="viewRoute('${id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-action btn-edit" onclick="editRoute('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteRoute('${id}')">
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
        
        const select = $('#routeSchool');
        select.empty().append('<option value="">-- Chọn trường --</option>');
        
        allSchools.forEach(s => {
            const id = s.id || s._id;
            select.append(`<option value="${s.code}" data-id="${id}">${s.name}</option>`);
        });
    } catch (e) {
        console.error('Load schools error:', e);
        showError('Không thể tải danh sách trường: ' + e.message);
    }
}

async function loadStops() {
    try {
        allStops = await api.getStops();
        console.log('Loaded stops:', allStops);
    } catch (e) {
        console.error('Load stops error:', e);
        showError('Không thể tải danh sách điểm dừng: ' + e.message);
    }
}

async function loadRoutes() {
    try {
        allRoutes = await api.getRoutes();
        console.log('Loaded routes:', allRoutes);
        
        routesTable.clear().rows.add(allRoutes).draw();
    } catch (e) {
        console.error('Load routes error:', e);
        showError('Không thể tải danh sách tuyến đường: ' + e.message);
    }
}

function openAddRouteModal() {
    isEditMode = false;
    currentStopOrder = [];
    $('#routeModalTitle').html('<i class="fas fa-route me-2"></i>Thêm tuyến đường');
    $('#routeForm')[0].reset();
    $('#routeId').val('');
    $('#routeActive').prop('checked', true);
    $('#routeCode').prop('disabled', false);
    renderStopOrder();
}

async function editRoute(id) {
    try {
        showLoading();
        const route = allRoutes.find(r => (r.id || r._id) === id);
        if (!route) {
            hideLoading();
            showError('Không tìm thấy tuyến đường');
            return;
        }
        
        isEditMode = true;
        currentStopOrder = route.stopOrder || [];
        
        $('#routeModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa tuyến đường');
        $('#routeId').val(route.id || route._id);
        $('#routeCode').val(route.code).prop('disabled', true);
        $('#routeName').val(route.name);
        $('#routeSchool').val(route.schoolCode);
        $('#routeDirection').val(route.direction);
        $('#routeActive').prop('checked', route.isActive !== false);
        
        renderStopOrder();
        
        const modal = new bootstrap.Modal(document.getElementById('routeModal'));
        modal.show();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Edit route error:', e);
        showError('Không thể tải thông tin tuyến đường: ' + e.message);
    }
}

async function viewRoute(id) {
    const route = allRoutes.find(r => (r.id || r._id) === id);
    if (!route) return;
    
    let stopsList = '';
    if (route.stopOrder && route.stopOrder.length > 0) {
        stopsList = route.stopOrder.map(s => `
            <div class="d-flex align-items-center mb-2 p-2 border-bottom">
                <div class="route-stop-seq">${s.seq}</div>
                <div class="flex-grow-1">
                    <strong>${s.stopCode}</strong>
                </div>
                <div class="route-stop-time">${s.plannedTime}</div>
            </div>
        `).join('');
    } else {
        stopsList = '<p class="text-muted">Chưa có điểm dừng</p>';
    }
    
    Swal.fire({
        title: `<i class="fas fa-route me-2"></i>${route.name}`,
        html: `
            <div class="text-start">
                <p><strong>Mã tuyến:</strong> ${route.code}</p>
                <p><strong>Trường:</strong> ${getSchoolBadge(route.schoolCode)}</p>
                <p><strong>Hướng:</strong> ${route.direction === 'morning' ? 'Sáng' : 'Chiều'}</p>
                <p><strong>Trạng thái:</strong> ${getStatusBadge(route.isActive ? 'true' : 'false')}</p>
                <hr>
                <h6><i class="fas fa-map-marked-alt me-2"></i>Các điểm dừng:</h6>
                <div class="route-stop-list">${stopsList}</div>
            </div>
        `,
        width: 600,
        showCloseButton: true,
        confirmButtonText: 'Đóng'
    });
}

function addStopToRoute() {
    const select = $('#selectStop');
    select.empty().append('<option value="">-- Chọn điểm dừng --</option>');
    
    const selectedSchoolCode = $('#routeSchool').val();
    if (!selectedSchoolCode) {
        showError('Vui lòng chọn trường trước');
        return;
    }
    
    const availableStops = allStops.filter(s => {
        return !s.schoolCode || s.schoolCode === selectedSchoolCode;
    });
    
    availableStops.forEach(s => {
        const alreadyAdded = currentStopOrder.some(so => so.stopCode === s.code);
        if (!alreadyAdded) {
            const id = s.id || s._id;
            select.append(`<option value="${s.code}" data-id="${id}">${s.name} (${s.code})</option>`);
        }
    });
    
    $('#stopTime').val('');
    
    const modal = new bootstrap.Modal(document.getElementById('addStopModal'));
    modal.show();
}

function confirmAddStop() {
    const stopCode = $('#selectStop').val();
    const stopTime = $('#stopTime').val();
    
    if (!stopCode || !stopTime) {
        showError('Vui lòng chọn điểm dừng và thời gian');
        return;
    }
    
    const stop = allStops.find(s => s.code === stopCode);
    if (!stop) return;
    
    const stopId = stop.id || stop._id;
    const newSeq = currentStopOrder.length + 1;
    currentStopOrder.push({
        seq: newSeq,
        stopCode: stop.code,
        stopId: stopId,
        plannedTime: stopTime
    });
    
    renderStopOrder();
    bootstrap.Modal.getInstance(document.getElementById('addStopModal')).hide();
    showSuccess('Đã thêm điểm dừng');
}

function renderStopOrder() {
    const container = $('#stopOrderList');
    const emptyMsg = $('#emptyStopMessage');
    
    if (currentStopOrder.length === 0) {
        emptyMsg.show();
        container.find('.stop-item').remove();
        return;
    }
    
    emptyMsg.hide();
    container.find('.stop-item').remove();
    
    currentStopOrder.forEach((stop, index) => {
        const stopItem = $(`
            <div class="stop-item card mb-2">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center">
                        <div class="route-stop-seq me-3">${stop.seq}</div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${stop.stopCode}</h6>
                            <small class="text-muted">Thời gian: ${stop.plannedTime}</small>
                        </div>
                        <div class="btn-group">
                            ${index > 0 ? `<button class="btn btn-sm btn-outline-primary" onclick="moveStopUp(${index})" title="Lên"><i class="fas fa-arrow-up"></i></button>` : ''}
                            ${index < currentStopOrder.length - 1 ? `<button class="btn btn-sm btn-outline-primary" onclick="moveStopDown(${index})" title="Xuống"><i class="fas fa-arrow-down"></i></button>` : ''}
                            <button class="btn btn-sm btn-outline-danger" onclick="removeStop(${index})" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        container.append(stopItem);
    });
}

function moveStopUp(index) {
    if (index === 0) return;
    [currentStopOrder[index], currentStopOrder[index - 1]] = [currentStopOrder[index - 1], currentStopOrder[index]];
    currentStopOrder.forEach((s, i) => s.seq = i + 1);
    renderStopOrder();
}

function moveStopDown(index) {
    if (index === currentStopOrder.length - 1) return;
    [currentStopOrder[index], currentStopOrder[index + 1]] = [currentStopOrder[index + 1], currentStopOrder[index]];
    currentStopOrder.forEach((s, i) => s.seq = i + 1);
    renderStopOrder();
}

function removeStop(index) {
    currentStopOrder.splice(index, 1);
    currentStopOrder.forEach((s, i) => s.seq = i + 1);
    renderStopOrder();
}

async function saveRoute() {
    try {
        const form = $('#routeForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const schoolCode = $('#routeSchool').val();
        const selectedSchool = allSchools.find(s => s.code === schoolCode);
        
        if (!selectedSchool) {
            showError('Vui lòng chọn trường học');
            return;
        }
        
        const schoolId = selectedSchool.id || selectedSchool._id;
        
        const data = {
            code: $('#routeCode').val().trim().toUpperCase(),
            name: $('#routeName').val().trim(),
            direction: $('#routeDirection').val(),
            schoolCode: schoolCode,
            schoolId: schoolId,
            isActive: $('#routeActive').is(':checked'),
            stopOrder: currentStopOrder
        };
        
        if (!data.code || !data.name || !data.schoolCode) {
            showError('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        showLoading();
        
        if (isEditMode) {
            await api.updateRoute($('#routeId').val(), data);
            showSuccess('Cập nhật tuyến đường thành công');
        } else {
            await api.createRoute(data);
            showSuccess('Thêm tuyến đường thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('routeModal')).hide();
        await loadRoutes();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Save route error:', e);
        showError('Không thể lưu tuyến đường: ' + e.message);
    }
}

async function deleteRoute(id) {
    if (!await confirmDelete('Bạn có chắc chắn muốn xóa tuyến đường này?')) return;
    
    try {
        showLoading();
        await api.deleteRoute(id);
        showSuccess('Xóa tuyến đường thành công');
        await loadRoutes();
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Delete route error:', e);
        showError('Không thể xóa tuyến đường: ' + e.message);
    }
}