/**
 * Dashboard Module
 * Handles dashboard statistics and overview
 */

$(document).ready(function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        showLoading();
        
        // Load all data in parallel
        const [schools, students, buses, drivers, routes, stops, trips] = await Promise.all([
            api.getSchools(),
            api.getStudents(),
            api.getBuses(),
            api.getDrivers(),
            api.getRoutes(),
            api.getStops(),
            api.getTrips()
        ]);

        // Update statistics
        $('#totalSchools').text(schools.length);
        $('#totalStudents').text(students.length);
        $('#totalBuses').text(buses.length);
        $('#totalDrivers').text(drivers.length);
        $('#totalRoutes').text(routes.length);
        $('#totalStops').text(stops.length);
        $('#totalTrips').text(trips.length);

        // Populate schools list
        populateSchoolsList(schools);

        // Populate today's trips
        populateTodayTrips(trips);

        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Không thể tải dữ liệu dashboard: ' + error.message);
    }
}

function populateSchoolsList(schools) {
    const tbody = $('#schoolsList');
    tbody.empty();

    if (schools.length === 0) {
        tbody.append('<tr><td colspan="3" class="text-center text-muted">Chưa có trường học nào</td></tr>');
        return;
    }

    schools.forEach(school => {
        tbody.append(`
            <tr>
                <td><span class="school-badge ${school.code}">${school.code}</span></td>
                <td>${school.name}</td>
                <td><small class="text-muted">${school.address}</small></td>
            </tr>
        `);
    });
}

function populateTodayTrips(trips) {
    const tbody = $('#todayTripsList');
    tbody.empty();

    // Filter trips for today
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(trip => {
        const tripDate = new Date(trip.date).toISOString().split('T')[0];
        return tripDate === today;
    });

    if (todayTrips.length === 0) {
        tbody.append('<tr><td colspan="3" class="text-center text-muted">Không có chuyến đi nào hôm nay</td></tr>');
        return;
    }

    todayTrips.forEach(trip => {
        tbody.append(`
            <tr>
                <td><small>${trip.tripCode}</small></td>
                <td><small>${trip.routeCode}</small></td>
                <td>${getStatusBadge(trip.status)}</td>
            </tr>
        `);
    });
}