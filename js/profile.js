document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Update profile information
    function updateProfileInfo() {
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = user.name || 'Nightcore User';
        }

        // Update token balance
        const tokenBalance = document.getElementById('tokenBalance');
        if (tokenBalance) {
            tokenBalance.textContent = user.tokens || '0';
        }

        // Update plan status
        const planStatus = document.getElementById('planStatus');
        if (planStatus) {
            if (user.isPremium) {
                planStatus.textContent = 'Premium';
                planStatus.classList.add('bg-purple-500');
                planStatus.classList.remove('bg-gray-700');
            } else {
                planStatus.textContent = 'Free';
            }
        }

        // Calculate next reset date
        const nextReset = document.getElementById('nextReset');
        if (nextReset) {
            const today = new Date();
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            const days = Math.ceil((nextWeek - today) / (1000 * 60 * 60 * 24));
            nextReset.textContent = `${days} days`;
        }
    }

    // Handle token purchase
    const purchaseButtons = document.querySelectorAll('.purchase-token-btn');
    purchaseButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const amount = button.dataset.amount;
            const price = button.dataset.price;
            
            try {
                // For demo purposes, we'll just update the token count
                user.tokens = (parseInt(user.tokens) || 0) + parseInt(amount);
                localStorage.setItem('user', JSON.stringify(user));
                updateProfileInfo();
                alert(`Successfully purchased ${amount} tokens!`);
            } catch (error) {
                console.error('Purchase error:', error);
                alert('Failed to process purchase. Please try again.');
            }
        });
    });

    // Handle premium upgrade
    const upgradeButton = document.getElementById('upgrade-btn');
    if (upgradeButton) {
        upgradeButton.addEventListener('click', async () => {
            try {
                // For demo purposes, we'll just update the premium status
                user.isPremium = true;
                localStorage.setItem('user', JSON.stringify(user));
                updateProfileInfo();
                alert('Successfully upgraded to Premium!');
            } catch (error) {
                console.error('Upgrade error:', error);
                alert('Failed to process upgrade. Please try again.');
            }
        });
    }

    // Initialize profile
    updateProfileInfo();
});
