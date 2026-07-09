// Simple modal functions - separate file for reliability
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('hidden');
        userManager.updateProfileStats();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Global event listeners for modal
document.addEventListener('DOMContentLoaded', function() {
    // Close button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'close-profile-modal') {
            closeProfileModal();
        }
    });
    
    // Overlay click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeProfileModal();
        }
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('profile-modal');
            if (modal && !modal.classList.contains('hidden')) {
                closeProfileModal();
            }
        }
    });
});