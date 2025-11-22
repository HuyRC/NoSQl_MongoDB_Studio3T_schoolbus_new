// 1. CẤU HÌNH MENU (Khớp với cấu trúc dự án của bạn)
const MENU_ITEMS = [
    { title: "Dashboard", href: "/pages/admin/dashboard.html", icon: "bi-house-door-fill" },
    { title: "Quản lý Trường", href: "/pages/admin/schools.html", icon: "bi-building" },
    { title: "Quản lý Học sinh", href: "/pages/admin/students.html", icon: "bi-people-fill" },
    { title: "Quản lý Điểm đón", href: "/pages/admin/stops.html", icon: "bi-geo-alt-fill" },
    { title: "Quản lý Tuyến đường", href: "/pages/admin/routes.html", icon: "bi-map-fill" },
    { title: "Quản lý Tài xế", href: "/pages/admin/drivers.html", icon: "bi-person-badge-fill" },
    { title: "Quản lý Xe buýt", href: "/pages/admin/buses.html", icon: "bi-bus-front-fill" },
    { title: "Quản lý Chuyến đi", href: "/pages/admin/trips.html", icon: "bi-calendar-check-fill" },
    { title: "Phân công Học sinh", href: "/pages/admin/assignments.html", icon: "bi-clipboard-data-fill" },
    { title: "Quản lý Điểm danh", href: "/pages/admin/attendance.html", icon: "bi-check-circle-fill" }
];

$(document).ready(function() {
    // 1. Render Sidebar ngay khi trang tải xong
    renderSidebar();

    // 2. Khởi tạo các logic khác
    checkAuth();
    initSidebar();
    initNavigation();
    
    // 3. Highlight menu hiện tại
    setActiveMenu();
});

// === HÀM RENDER SIDEBAR ===
function renderSidebar() {
    const $container = $('#sidebar-container');
    
    // Kiểm tra an toàn: Nếu file HTML thiếu thẻ này thì báo lỗi console để biết đường sửa
    if ($container.length === 0) {
        console.error("LỖI: Không tìm thấy <div id='sidebar-container'> trong file HTML. Vui lòng thêm thẻ này vào body.");
        return;
    }

    // Tạo Header Sidebar
    let html = `
    <nav id="sidebar" class="bg-primary text-white" style="width: 250px; transition: all 0.3s; position: fixed; top: 0; left: 0; bottom: 0; z-index: 1000; display: flex; flex-direction: column;">
            <div class="sidebar-header p-3 border-bottom border-light d-flex align-items-center justify-content-center">
                <i class="bi bi-bus-front fs-3 me-2"></i>
                <h5 class="m-0 fw-bold">School Bus</h5>
            </div>
            
            <ul class="list-unstyled components p-2 sidebar-menu" style="overflow-y: auto; height: calc(100vh - 130px);">
    `;

    // Loop qua MENU_ITEMS để tạo danh sách
    MENU_ITEMS.forEach(item => {
        html += `
            <li class="mb-1">
                <a href="${item.href}" class="menu-item text-white text-decoration-none p-2 d-flex align-items-center rounded opacity-75 hover-opacity-100">
                    <i class="bi ${item.icon} me-3 fs-5"></i>
                    <span>${item.title}</span>
                </a>
            </li>
        `;
    });

    // Tạo Footer (Logout)
    html += `
            </ul>
            <div class="p-3 border-top border-light w-100 position-absolute bottom-0 start-0 bg-primary">
                <a href="#" id="logoutBtn" class="text-white text-decoration-none d-flex align-items-center opacity-75 hover-opacity-100">
                    <i class="bi bi-box-arrow-right me-3 fs-5"></i>
                    <span>Đăng xuất</span>
                </a>
            </div>
        </nav>
        
        <button id="sidebarToggle" class="btn btn-primary position-fixed top-0 start-0 m-2 d-md-none shadow" style="z-index: 1001;">
            <i class="bi bi-list"></i>
        </button>
    `;

    $container.html(html);
}

// === KIỂM TRA ĐĂNG NHẬP ===
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    // Nếu đang ở trang login thì bỏ qua
    if (window.location.pathname.toLowerCase().includes('login.html')) return;
    
    if (isLoggedIn !== 'true') {
        window.location.href = '/pages/admin/login.html';
    }
}

// === TOGGLE SIDEBAR (Mobile & Desktop) ===
function initSidebar() {
    $(document).on('click', '#sidebarToggle', function(e) {
        e.stopPropagation();
        $('#sidebar').toggleClass('show'); 
        // Thêm class cho wrapper nếu cần đẩy nội dung sang phải (tùy CSS của bạn)
        $('#wrapper').toggleClass('toggled');
    });

    // Click ra ngoài thì đóng sidebar (chỉ trên Mobile)
    $(document).on('click', function(e) {
        if ($(window).width() < 768) {
            if (!$(e.target).closest('#sidebar, #sidebarToggle').length) {
                $('#sidebar').removeClass('show');
            }
        }
    });
}

// === XỬ LÝ SỰ KIỆN NAVIGATION ===
function initNavigation() {
    $(document).on('click', '#logoutBtn', function(e) {
        e.preventDefault();
        handleLogout();
    });
}

// === SET ACTIVE MENU (Highlight mục đang chọn) ===
function setActiveMenu() {
    const currentPath = window.location.pathname.toLowerCase();
    
    $('.menu-item').each(function() {
        const href = $(this).attr('href').toLowerCase();
        
        // Logic so sánh: Nếu đường dẫn trình duyệt chứa href của menu
        if (href && currentPath.includes(href)) {
            // Style Active: Nền trắng, Chữ xanh đậm
            $(this).addClass('active bg-white text-primary fw-bold shadow-sm');
            $(this).removeClass('text-white opacity-75'); // Bỏ style mờ mặc định
            
            // Cập nhật tiêu đề trang (nếu có thẻ #pageTitle trong HTML)
            const pageTitle = $(this).find('span').text();
            if ($('#pageTitle').length) {
                $('#pageTitle').text(pageTitle);
            }
        }
    });
}

// === LOGIC ĐĂNG XUẤT ===
function handleLogout() {
    // Ưu tiên dùng SweetAlert2 nếu có
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Đăng xuất?',
            text: 'Bạn có chắc chắn muốn thoát phiên làm việc?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) performLogout();
        });
    } else {
        // Fallback về confirm mặc định của trình duyệt
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) performLogout();
    }
}

function performLogout() {
    // Xóa toàn bộ dữ liệu phiên
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    
    // Chuyển hướng về login
    window.location.replace('/pages/admin/login.html');
}

// === CẤU HÌNH MẶC ĐỊNH CHO DATATABLE (Nếu dùng) ===
if ($.fn.dataTable) {
    $.extend(true, $.fn.dataTable.defaults, {
        language: {
            processing: "Đang xử lý...",
            lengthMenu: "Hiển thị _MENU_ dòng",
            zeroRecords: "Không tìm thấy dữ liệu phù hợp",
            info: "Đang xem _START_ đến _END_ trong tổng số _TOTAL_ mục",
            infoEmpty: "Đang xem 0 đến 0 trong tổng số 0 mục",
            infoFiltered: "(được lọc từ _MAX_ mục)",
            search: "Tìm kiếm:",
            paginate: { first: "First", last: "Last", next: "Sau", previous: "Trước" }
        },
        pageLength: 10,
        responsive: true,
        autoWidth: false
    });
}