/**
 * Trips Module - FIXED VERSION
 */

let tripsTable, isEditMode = false;
let allTrips = [], allRoutes = [], allBuses = [], allDrivers = [];

$(document).ready(function() {
    initTripsTable();
    loadAllData();
    
    const today = new Date().toISOString().split('T')[0];
    $('#tripDate').val(today);
});

async function loadAllData() {
    try {
        showLoading();
        
        await Promise.all([
            loadRoutes(),
            loadBuses(),
            loadDrivers(),
            loadTrips()
        ]);
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load data error:', error);
        showError('Không thể tải dữ liệu: ' + error.message);
    }
}

function initTripsTable() {
    tripsTable = $('#tripsTable').DataTable({
        columns: [
            { data: null, render: (d,t,r,m) => m.row + 1 },
            { data: 'tripCode', render: d => `<small><strong>${d}</strong></small>` },
            { data: 'routeCode' },
            { data: 'date', render: d => formatDate(d) },
            { data: 'busCode', render: d => `<span class="badge bg-primary">${d}</span>` },
            { data: 'driverCode' },
            { data: 'status', render: d => getStatusBadge(d) },
            {
                data: null,
                orderable: false,
                render: (d,t,r) => {
                    const id = r.id || r._id;
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-action btn-view" onclick="viewTrip('${id}')" title="Xem chi tiết">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-action btn-edit" onclick="editTrip('${id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-delete" onclick="deleteTrip('${id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        order: [[3, 'desc']]
    });
}

async function loadRoutes() {
    try {
        allRoutes = await api.getRoutes();
        console.log('Loaded routes:', allRoutes);
        
        $('#tripRoute').empty().append('<option value="">-- Chọn tuyến --</option>');
        $('#filterRoute').empty().append('<option value="">Tất cả tuyến</option>');
        
        allRoutes.forEach(r => {
            const id = r.id || r._id;
            const option = `<option value="${r.code}" data-id="${id}">${r.name} (${r.code})</option>`;
            $('#tripRoute, #filterRoute').append(option);
        });
    } catch (e) {
        console.error('Load routes error:', e);
        showError('Không thể tải danh sách tuyến: ' + e.message);
    }
}

async function loadBuses() {
    try {
        allBuses = await api.getBuses();
        console.log('Loaded buses:', allBuses);
        
        const select = $('#tripBus');
        select.empty().append('<option value="">-- Chọn xe --</option>');
        
        allBuses.filter(b => b.active !== false).forEach(b => {
            const id = b.id || b._id;
            select.append(`<option value="${b.code}" data-id="${id}">${b.plate} - ${b.code} (${b.capacity} chỗ)</option>`);
        });
    } catch (e) {
        console.error('Load buses error:', e);
        showError('Không thể tải danh sách xe: ' + e.message);
    }
}

async function loadDrivers() {
    try {
        allDrivers = await api.getDrivers();
        console.log('Loaded drivers:', allDrivers);
        
        const select = $('#tripDriver');
        select.empty().append('<option value="">-- Chọn tài xế --</option>');
        
        allDrivers.filter(d => d.active !== false).forEach(d => {
            const id = d.id || d._id;
            select.append(`<option value="${d.code}" data-id="${id}">${d.fullName} (${d.code})</option>`);
        });
    } catch (e) {
        console.error('Load drivers error:', e);
        showError('Không thể tải danh sách tài xế: ' + e.message);
    }
}

async function loadTrips() {
    try {
        allTrips = await api.getTrips();
        console.log('Loaded trips:', allTrips);
        
        tripsTable.clear().rows.add(allTrips).draw();
    } catch (e) {
        console.error('Load trips error:', e);
        showError('Không thể tải danh sách chuyến đi: ' + e.message);
    }
}

function onRouteChange() {
    const routeCode = $('#tripRoute').val();
    if (!routeCode) {
        $('#routeDetails').hide();
        return;
    }
    
    const route = allRoutes.find(r => r.code === routeCode);
    if (!route) return;
    
    let content = `
        <p class="mb-1"><strong>Trường:</strong> ${getSchoolBadge(route.schoolCode)}</p>
        <p class="mb-1"><strong>Hướng:</strong> ${route.direction === 'morning' ? 'Sáng' : 'Chiều'}</p>
        <p class="mb-0"><strong>Số điểm dừng:</strong> ${route.stopOrder?.length || 0}</p>
    `;
    
    $('#routeDetailContent').html(content);
    $('#routeDetails').show();
}

function filterTrips() {
    const dateFilter = $('#filterDate').val();
    const routeFilter = $('#filterRoute').val();
    const statusFilter = $('#filterStatus').val();
    
    let filtered = [...allTrips];
    
    if (dateFilter) {
        filtered = filtered.filter(t => {
            const tripDate = new Date(t.date).toISOString().split('T')[0];
            return tripDate === dateFilter;
        });
    }
    
    if (routeFilter) {
        filtered = filtered.filter(t => t.routeCode === routeFilter);
    }
    
    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    tripsTable.clear().rows.add(filtered).draw();
}

function clearFilters() {
    $('#filterDate').val('');
    $('#filterRoute').val('');
    $('#filterStatus').val('');
    tripsTable.clear().rows.add(allTrips).draw();
}

function openAddTripModal() {
    isEditMode = false;
    $('#tripModalTitle').html('<i class="fas fa-calendar-check me-2"></i>Thêm chuyến đi');
    $('#tripForm')[0].reset();
    $('#tripId').val('');
    $('#routeDetails').hide();
    $('#tripCode').prop('disabled', false);
    
    const today = new Date().toISOString().split('T')[0];
    $('#tripDate').val(today);
    $('#tripStatus').val('planned');
}

async function editTrip(id) {
    try {
        showLoading();
        const trip = allTrips.find(t => (t.id || t._id) === id);
        if (!trip) {
            hideLoading();
            showError('Không tìm thấy chuyến đi');
            return;
        }
        
        isEditMode = true;
        $('#tripModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa chuyến đi');
        $('#tripId').val(trip.id || trip._id);
        $('#tripCode').val(trip.tripCode).prop('disabled', true);
        
        const tripDate = new Date(trip.date).toISOString().split('T')[0];
        $('#tripDate').val(tripDate);
        
        $('#tripRoute').val(trip.routeCode);
        onRouteChange();
        
        $('#tripBus').val(trip.busCode);
        $('#tripDriver').val(trip.driverCode);
        $('#tripStatus').val(trip.status);
        
        const modal = new bootstrap.Modal(document.getElementById('tripModal'));
        modal.show();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Edit trip error:', e);
        showError('Không thể tải thông tin chuyến đi: ' + e.message);
    }
}

async function viewTrip(id) {
    const trip = allTrips.find(t => (t.id || t._id) === id);
    if (!trip) return;
    
    const route = allRoutes.find(r => r.code === trip.routeCode);
    const bus = allBuses.find(b => b.code === trip.busCode);
    const driver = allDrivers.find(d => d.code === trip.driverCode);
    
    Swal.fire({
        title: `<i class="fas fa-calendar-check me-2"></i>Chi tiết chuyến đi`,
        html: `
            <div class="text-start">
                <p><strong>Mã chuyến:</strong> ${trip.tripCode}</p>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)}</p>
                <hr>
                <p><strong>Tuyến:</strong> ${route ? route.name : trip.routeCode}</p>
                <p><strong>Xe buýt:</strong> ${bus ? `${bus.plate} (${bus.brand})` : trip.busCode}</p>
                <p><strong>Tài xế:</strong> ${driver ? `${driver.fullName} (${driver.phone})` : trip.driverCode}</p>
                <hr>
                <p><strong>Trạng thái:</strong> ${getStatusBadge(trip.status)}</p>
            </div>
        `,
        width: 600,
        showCloseButton: true,
        confirmButtonText: 'Đóng'
    });
}

async function saveTrip() {
    try {
        const form = $('#tripForm')[0];
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const routeCode = $('#tripRoute').val();
        const busCode = $('#tripBus').val();
        const driverCode = $('#tripDriver').val();
        
        const selectedRoute = allRoutes.find(r => r.code === routeCode);
        const selectedBus = allBuses.find(b => b.code === busCode);
        const selectedDriver = allDrivers.find(d => d.code === driverCode);
        
        if (!selectedRoute || !selectedBus || !selectedDriver) {
            showError('Vui lòng chọn đầy đủ tuyến, xe và tài xế');
            return;
        }
        
        const data = {
            tripCode: $('#tripCode').val().trim().toUpperCase(),
            routeCode: routeCode,
            routeId: selectedRoute.id || selectedRoute._id,
            date: new Date($('#tripDate').val()).toISOString(),
            busCode: busCode,
            busId: selectedBus.id || selectedBus._id,
            driverCode: driverCode,
            driverId: selectedDriver.id || selectedDriver._id,
            status: $('#tripStatus').val()
        };
        
        showLoading();
        
        if (isEditMode) {
            await api.updateTrip($('#tripId').val(), data);
            showSuccess('Cập nhật chuyến đi thành công');
        } else {
            await api.createTrip(data);
            showSuccess('Thêm chuyến đi thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('tripModal')).hide();
        await loadTrips();
        
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Save trip error:', e);
        showError('Không thể lưu chuyến đi: ' + e.message);
    }
}

async function deleteTrip(id) {
    if (!await confirmDelete('Bạn có chắc chắn muốn xóa chuyến đi này?')) return;
    
    try {
        showLoading();
        await api.deleteTrip(id);
        showSuccess('Xóa chuyến đi thành công');
        await loadTrips();
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error('Delete trip error:', e);
        showError('Không thể xóa chuyến đi: ' + e.message);
    }
}