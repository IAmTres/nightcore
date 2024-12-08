// Sample leaderboard data (replace with actual data from your backend)
let leaderboardData = [
    {
        id: 1,
        title: "Nightcore - Your Song",
        artist: "UserOne",
        upvotes: 156,
        timestamp: "2 hours ago",
        audioUrl: "#"
    },
    {
        id: 2,
        title: "Nightcore - Amazing Grace",
        artist: "UserTwo",
        upvotes: 142,
        timestamp: "3 hours ago",
        audioUrl: "#"
    },
    // Add more sample items as needed
];

// Function to create a leaderboard item
function createLeaderboardItem(item) {
    return `
        <div class="flex items-center justify-between p-4 bg-purple-900/20 rounded-lg hover:bg-purple-900/30 transition-colors">
            <div class="flex items-center space-x-4">
                <button class="play-btn w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-600 transition-colors">
                    <i class="fas fa-play text-sm"></i>
                </button>
                <div>
                    <h3 class="font-semibold text-purple-300">${item.title}</h3>
                    <p class="text-sm text-gray-400">Created by ${item.artist} • ${item.timestamp}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button class="upvote-btn flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-900/40 hover:bg-purple-900/60 transition-colors" data-id="${item.id}">
                    <i class="fas fa-arrow-up text-purple-400"></i>
                    <span class="text-purple-300">${item.upvotes}</span>
                </button>
            </div>
        </div>
    `;
}

// Function to render the leaderboard
function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;

    leaderboardList.innerHTML = leaderboardData
        .sort((a, b) => b.upvotes - a.upvotes)
        .map(createLeaderboardItem)
        .join('');

    // Add event listeners to upvote buttons
    document.querySelectorAll('.upvote-btn').forEach(btn => {
        btn.addEventListener('click', handleUpvote);
    });
}

// Function to handle upvoting
function handleUpvote(event) {
    const button = event.currentTarget;
    const itemId = parseInt(button.dataset.id);
    const item = leaderboardData.find(i => i.id === itemId);
    
    if (item) {
        item.upvotes++;
        renderLeaderboard();
    }
}

// Smooth scroll functionality
document.addEventListener('DOMContentLoaded', () => {
    const scrollButton = document.getElementById('scroll-to-leaderboard');
    const leaderboard = document.getElementById('leaderboard');

    if (scrollButton && leaderboard) {
        scrollButton.addEventListener('click', () => {
            leaderboard.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Initial render
    renderLeaderboard();
});
