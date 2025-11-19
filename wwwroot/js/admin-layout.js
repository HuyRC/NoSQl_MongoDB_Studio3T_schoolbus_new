/**
 * Admin Layout JavaScript
 * Handles sidebar, navigation, and common UI interactions
 */

$(document).ready(function() {
    // Check authentication
    checkAuth();
    initSidebar();
    initNavigation();
    setActiveMenu();
});

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = '/pages/admin/login.html';
        return false;
    }
    return true;
}

// Initialize Sidebar
function initSidebar() {
    // Toggle sidebar
    $('#sidebarToggle').on('click', function() {
        $('#sidebar').toggleClass('collapsed');
        
        // Save state to localStorage
        const isCollapsed = $('#sidebar').hasClass('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });

    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        $('#sidebar').addClass('collapsed');
    }

    // Mobile sidebar toggle
    if ($(window).width() < 768) {
        $('#sidebarToggle').on('click', function(e) {
            e.stopPropagation();
            $('#sidebar').toggleClass('show');
        });

        // Close sidebar when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#sidebar, #sidebarToggle').length) {
                $('#sidebar').removeClass('show');
            }
        });
    }
}

// Initialize Navigation
function initNavigation() {
    // Menu item click
    $('.menu-item').on('click', function(e) {
        const href = $(this).attr('href');
        
        // Don't prevent default for logout buttons
        if ($(this).attr('id') === 'logoutBtn' || $(this).attr('id') === 'logoutBtn2') {
            e.preventDefault();
            handleLogout();
            return;
        }
        
        // Update active menu
        $('.menu-item').removeClass('active');
        $(this).addClass('active');
        
        // Update page title
        const pageTitle = $(this).find('span').text();
        $('#pageTitle').text(pageTitle);
        
        // Close mobile sidebar
        if ($(window).width() < 768) {
            $('#sidebar').removeClass('show');
        }
    });
}

// Set active menu based on current page
function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    $('.menu-item').each(function() {
        const href = $(this).attr('href');
        if (href && href.includes(currentPage)) {
            $(this).addClass('active');
            const pageTitle = $(this).find('span').text();
            $('#pageTitle').text(pageTitle);
            
            // ✅ FIX: AUTO-SCROLL SIDEBAR TO ACTIVE MENU
            const menuItem = $(this);
            const sidebarMenu = $('.sidebar-menu');
            
            if (menuItem.length && sidebarMenu.length) {
                // Sử dụng setTimeout để đảm bảo DOM đã render xong
                setTimeout(function() {
                    // Lấy vị trí tuyệt đối của menu item trong sidebar-menu
                    const menuItemOffset = menuItem.offset().top;
                    const sidebarMenuOffset = sidebarMenu.offset().top;
                    const relativeOffset = menuItemOffset - sidebarMenuOffset;
                    
                    const currentScrollTop = sidebarMenu.scrollTop();
                    const sidebarHeight = sidebarMenu.height();
                    const menuHeight = menuItem.outerHeight();
                    
                    // Tính vị trí scroll để menu item nằm ở giữa viewport
                    const targetScrollTop = currentScrollTop + relativeOffset - (sidebarHeight / 2) + (menuHeight / 2);
                    
                    // Scroll smooth đến vị trí target
                    sidebarMenu.animate({
                        scrollTop: Math.max(0, targetScrollTop)
                    }, 400);
                }, 100);
            }
        }
    });
}

// Handle logout
function handleLogout() {
    Swal.fire({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc chắn muốn đăng xuất?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e74a3b',
        cancelButtonColor: '#858796',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Clear session/token
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            
            Swal.fire({
                title: 'Đăng xuất thành công!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Chuyển hướng đến trang login
                window.location.replace('/pages/admin/login.html');
                });
        }
    });
}

// DataTable default config
$.extend(true, $.fn.dataTable.defaults, {
    language: {
        processing: "Đang xử lý...",
        lengthMenu: "Hiển thị _MENU_ dòng",
        zeroRecords: "Không tìm thấy dữ liệu",
        info: "Hiển thị _START_ đến _END_ trong tổng số _TOTAL_ dòng",
        infoEmpty: "Hiển thị 0 đến 0 trong tổng số 0 dòng",
        infoFiltered: "(lọc từ _MAX_ dòng)",
        search: "Tìm kiếm:",
        paginate: {
            first: "Đầu",
            last: "Cuối",
            next: "Tiếp",
            previous: "Trước"
        }
    },
    pageLength: 10,
    lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Tất cả"]],
    order: [[0, 'asc']],
    responsive: true
});