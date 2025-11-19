/**
 * API Service for School Bus Management System
 * Handles all API calls to backend - FIXED VERSION
 */

const API_BASE_URL = 'http://localhost:5100/api';

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    // ===== HELPER: Extract ID from MongoDB response =====
    extractId(obj) {
        if (!obj) return null;
        // MongoDB trả về: { $oid: "..." } hoặc string
        if (obj.$oid) return obj.$oid;
        if (obj._id && obj._id.$oid) return obj._id.$oid;
        if (obj._id) return obj._id;
        if (obj.id) return obj.id;
        return obj;
    }

    // ===== HELPER: Process single object =====
    processObject(obj) {
        if (!obj) return null;
        // Extract ID
        obj.id = this.extractId(obj._id || obj.id);
        // Process nested IDs
        if (obj.schoolId) obj.schoolId = this.extractId(obj.schoolId);
        if (obj.routeId) obj.routeId = this.extractId(obj.routeId);
        if (obj.busId) obj.busId = this.extractId(obj.busId);
        if (obj.driverId) obj.driverId = this.extractId(obj.driverId);
        if (obj.studentId) obj.studentId = this.extractId(obj.studentId);
        if (obj.pickStopId) obj.pickStopId = this.extractId(obj.pickStopId);
        if (obj.dropStopId) obj.dropStopId = this.extractId(obj.dropStopId);
        
        // Process stopOrder if exists
        if (obj.stopOrder && Array.isArray(obj.stopOrder)) {
            obj.stopOrder = obj.stopOrder.map(s => ({
                ...s,
                stopId: this.extractId(s.stopId)
            }));
        }
        
        return obj;
    }

    // ===== HELPER: Process array =====
    processArray(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(obj => this.processObject(obj));
    }

    // Generic HTTP methods
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? this.processArray(data) : this.processObject(data);
        } catch (error) {
            console.error('GET Error:', error);
            throw error;
        }
    }

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            return this.processObject(result);
        } catch (error) {
            console.error('POST Error:', error);
            throw error;
        }
    }

    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok && response.status !== 204) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            console.error('PUT Error:', error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok && response.status !== 204) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            console.error('DELETE Error:', error);
            throw error;
        }
    }

    // ========== SCHOOLS ==========
    async getSchools() { return await this.get('/schools'); }
    async getSchool(code) { return await this.get(`/schools/${code}`); }
    async createSchool(school) { return await this.post('/schools', school); }
    async updateSchool(id, school) { return await this.put(`/schools/${id}`, school); }
    async deleteSchool(id) { return await this.delete(`/schools/${id}`); }

    // ========== STUDENTS ==========
    async getStudents() { return await this.get('/students'); }
    async getStudent(mahs) { return await this.get(`/students/${mahs}`); }
    async createStudent(student) { return await this.post('/students', student); }
    async updateStudent(id, student) { return await this.put(`/students/${id}`, student); }
    async deleteStudent(id) { return await this.delete(`/students/${id}`); }

    // ========== STOPS ==========
    async getStops() { return await this.get('/stops'); }
    async getStop(code) { return await this.get(`/stops/${code}`); }
    async createStop(stop) { return await this.post('/stops', stop); }
    async updateStop(id, stop) { return await this.put(`/stops/${id}`, stop); }
    async deleteStop(id) { return await this.delete(`/stops/${id}`); }

    // ========== ROUTES ==========
    async getRoutes() { return await this.get('/routes'); }
    async getRoute(code) { return await this.get(`/routes/${code}`); }
    async createRoute(route) { return await this.post('/routes', route); }
    async updateRoute(id, route) { return await this.put(`/routes/${id}`, route); }
    async deleteRoute(id) { return await this.delete(`/routes/${id}`); }

    // ========== DRIVERS ==========
    async getDrivers() { return await this.get('/drivers'); }
    async getDriver(code) { return await this.get(`/drivers/${code}`); }
    async createDriver(driver) { return await this.post('/drivers', driver); }
    async updateDriver(id, driver) { return await this.put(`/drivers/${id}`, driver); }
    async deleteDriver(id) { return await this.delete(`/drivers/${id}`); }

    // ========== BUSES ==========
    async getBuses() { return await this.get('/buses'); }
    async getBus(code) { return await this.get(`/buses/${code}`); }
    async createBus(bus) { return await this.post('/buses', bus); }
    async updateBus(id, bus) { return await this.put(`/buses/${id}`, bus); }
    async deleteBus(id) { return await this.delete(`/buses/${id}`); }

    // ========== TRIPS ==========
    async getTrips() { return await this.get('/trips'); }
    async getTrip(tripCode) { return await this.get(`/trips/${tripCode}`); }
    async createTrip(trip) { return await this.post('/trips', trip); }
    async updateTrip(id, trip) { return await this.put(`/trips/${id}`, trip); }
    async deleteTrip(id) { return await this.delete(`/trips/${id}`); }

    // ========== ASSIGNMENTS ==========
    async getAssignments() { return await this.get('/assignments'); }
    async getAssignment(id) { return await this.get(`/assignments/${id}`); }
    async createAssignment(assignment) { return await this.post('/assignments', assignment); }
    async updateAssignment(id, assignment) { return await this.put(`/assignments/${id}`, assignment); }
    async deleteAssignment(id) { return await this.delete(`/assignments/${id}`); }
}

// Create global instance
const api = new ApiService(API_BASE_URL);

// Helper functions
const showLoading = () => {
    const overlay = $('<div class="loading-overlay"><div class="spinner-border text-light" role="status"></div></div>');
    $('body').append(overlay);
};

const hideLoading = () => {
    $('.loading-overlay').remove();
};

const showSuccess = (message) => {
    Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
};

const showError = (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: message || 'Đã có lỗi xảy ra. Vui lòng thử lại!',
        confirmButtonText: 'OK'
    });
};

const confirmDelete = async (message = 'Bạn có chắc chắn muốn xóa?') => {
    const result = await Swal.fire({
        title: 'Xác nhận xóa',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74a3b',
        cancelButtonColor: '#858796',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    return result.isConfirmed;
};

// Format helpers
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const getStatusBadge = (status) => {
    const badges = {
        'planned': '<span class="badge status-planned">Đã lên kế hoạch</span>',
        'started': '<span class="badge status-started">Đang thực hiện</span>',
        'finished': '<span class="badge status-finished">Hoàn thành</span>',
        'true': '<span class="badge status-active">Hoạt động</span>',
        'false': '<span class="badge status-inactive">Ngừng</span>'
    };
    return badges[status] || status;
};

const getGenderIcon = (gender) => {
    if (gender === 'Nam') {
        return '<i class="fas fa-mars gender-male"></i> Nam';
    } else if (gender === 'Nữ') {
        return '<i class="fas fa-venus gender-female"></i> Nữ';
    }
    return gender;
};

const getSchoolBadge = (code) => {
    return `<span class="school-badge ${code}">${code}</span>`;
};