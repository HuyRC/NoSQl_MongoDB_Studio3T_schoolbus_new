let stopsTable, isEditMode = false, allStops = [], allSchools = [];

$(document).ready(function() {
    initStopsTable();
    loadSchools();
    loadStops();
});

function initStopsTable() {
    stopsTable = $('#stopsTable').DataTable({
        columns: [
            { data: null, render: (d,t,r,m) => m.row + 1 },
            { data: 'code' },
            { data: 'name' },
            { data: 'schoolCode', render: d => d ? getSchoolBadge(d) : '<span class="text-muted">-</span>' },
            { data: 'location', render: d => d ? `<small>${d.coordinates[0]}, ${d.coordinates[1]}</small>` : '-' },
            { data: 'note', render: d => d || '<span class="text-muted">-</span>' },
            { data: 'active', render: d => getStatusBadge(d ? 'true' : 'false') },
            { data: null, orderable: false, render: (d,t,r) => `
                <div class="action-buttons">
                    <button class="btn btn-action btn-edit" onclick="editStop('${r.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-action btn-delete" onclick="deleteStop('${r.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` }
        ]
    });
}

async function loadSchools() {
    try {
        allSchools = await api.getSchools();
        const select = $('#stopSchool');
        select.empty().append('<option value="">-- Chọn trường (tùy chọn) --</option>');
        allSchools.forEach(s => select.append(`<option value="${s.code}">${s.name}</option>`));
    } catch (e) { showError('Không thể tải danh sách trường: ' + e.message); }
}

async function loadStops() {
    try {
        showLoading();
        allStops = await api.getStops();
        stopsTable.clear().rows.add(allStops).draw();
        hideLoading();
    } catch (e) { hideLoading(); showError('Không thể tải danh sách điểm đón: ' + e.message); }
}

function openAddStopModal() {
    isEditMode = false;
    $('#stopModalTitle').html('<i class="fas fa-map-marker-alt me-2"></i>Thêm điểm đón');
    $('#stopForm')[0].reset();
    $('#stopId').val('');
    $('#stopActive').prop('checked', true);
    $('#stopCode').prop('disabled', false);
}

async function editStop(id) {
    try {
        showLoading();
        const stop = allStops.find(s => s.id === id);
        if (!stop) { hideLoading(); showError('Không tìm thấy điểm đón'); return; }
        
        isEditMode = true;
        $('#stopModalTitle').html('<i class="fas fa-edit me-2"></i>Chỉnh sửa điểm đón');
        $('#stopId').val(stop.id);
        $('#stopCode').val(stop.code).prop('disabled', true);
        $('#stopName').val(stop.name);
        $('#stopSchool').val(stop.schoolCode || '');
        $('#stopLongitude').val(stop.location?.coordinates[0] || '');
        $('#stopLatitude').val(stop.location?.coordinates[1] || '');
        $('#stopNote').val(stop.note || '');
        $('#stopActive').prop('checked', stop.active);
        
        new bootstrap.Modal(document.getElementById('stopModal')).show();
        hideLoading();
    } catch (e) { hideLoading(); showError('Không thể tải thông tin: ' + e.message); }
}

async function saveStop() {
    try {
        const form = $('#stopForm')[0];
        if (!form.checkValidity()) { form.reportValidity(); return; }
        
        const data = {
            code: $('#stopCode').val().trim().toUpperCase(),
            name: $('#stopName').val().trim(),
            schoolCode: $('#stopSchool').val() || null,
            location: {
                type: "Point",
                coordinates: [parseFloat($('#stopLongitude').val()), parseFloat($('#stopLatitude').val())]
            },
            note: $('#stopNote').val().trim() || null,
            active: $('#stopActive').is(':checked')
        };
        
        showLoading();
        if (isEditMode) {
            await api.updateStop($('#stopId').val(), data);
            showSuccess('Cập nhật điểm đón thành công');
        } else {
            await api.createStop(data);
            showSuccess('Thêm điểm đón thành công');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('stopModal')).hide();
        await loadStops();
        hideLoading();
    } catch (e) { hideLoading(); showError('Không thể lưu: ' + e.message); }
}

async function deleteStop(id) {
    if (!await confirmDelete('Bạn có chắc chắn muốn xóa điểm đón này?')) return;
    try {
        showLoading();
        await api.deleteStop(id);
        showSuccess('Xóa điểm đón thành công');
        await loadStops();
        hideLoading();
    } catch (e) { hideLoading(); showError('Không thể xóa: ' + e.message); }
}