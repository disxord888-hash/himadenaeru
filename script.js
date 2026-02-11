document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultArea = document.getElementById('resultArea');

    const finalRank = document.getElementById('finalRank');
    const rankDescription = document.getElementById('rankDescription');
    const dailyViews = document.getElementById('dailyViews');
    const elapsedDays = document.getElementById('elapsedDays');
    const totalViews = document.getElementById('totalViews');

    const manualViewsInput = document.getElementById('manualViews');
    const manualDateInput = document.getElementById('manualDate');

    // Rank Definitions
    const POPULARITY_RANKS = [
        { threshold: 1000000, rank: 'Ω', icon: '🌌' },
        { threshold: 750000, rank: 'UX', icon: '👑' },
        { threshold: 500000, rank: 'EX', icon: '✨' },
        { threshold: 250000, rank: 'ZZ', icon: '💎' },
        { threshold: 100000, rank: 'Z', icon: '🟥' },
        { threshold: 50000, rank: 'S', icon: '🟧' },
        { threshold: 10000, rank: 'A', icon: '🟨' },
        { threshold: 5000, rank: 'B', icon: '🟩' },
        { threshold: 1000, rank: 'C', icon: '🟦' },
        { threshold: 500, rank: 'D', icon: '🟪' },
        { threshold: 250, rank: 'E', icon: '🟫' },
        { threshold: 100, rank: 'F', icon: '⬜' },
        { threshold: 0, rank: 'G', icon: '🫧' }
    ];

    const TIMING_RANKS = [
        { maxDays: 30, rank: 'N', label: '新作', icon: '🆕' },
        { maxDays: 90, rank: 'F', label: 'フレッシュ', icon: '⚡' },
        { maxDays: 365, rank: 'R', label: '最近', icon: '⏱' },
        { maxDays: 1095, rank: 'M1', label: '中期（前期）', icon: '📦' },
        { maxDays: 1825, rank: 'M2', label: '中期（後期）', icon: '📦' },
        { maxDays: 3650, rank: 'L1', label: '古典（初期）', icon: '🏛' },
        { maxDays: 5475, rank: 'L2', label: '古典（中期）', icon: '🏛' },
        { maxDays: Infinity, rank: 'L3', label: '歴史的古典', icon: '🏛' }
    ];

    analyzeBtn.addEventListener('click', () => {
        const views = parseInt(manualViewsInput.value);
        const dateStr = manualDateInput.value;

        if (isNaN(views) || !dateStr) {
            alert('有効な値を入力してください。');
            return;
        }

        displayResult(views, new Date(dateStr));
    });

    function calculateRank(views, publishedAt) {
        const now = new Date();
        const diffTime = Math.abs(now - publishedAt);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        const popularityIndex = views / diffDays;

        const pRank = POPULARITY_RANKS.find(r => popularityIndex >= r.threshold);
        const tRank = TIMING_RANKS.find(r => diffDays <= r.maxDays);

        return {
            pRank,
            tRank,
            popularityIndex,
            diffDays
        };
    }

    function displayResult(views, publishedAt) {
        const result = calculateRank(views, publishedAt);

        finalRank.textContent = `${result.pRank.rank}-${result.tRank.rank}`;
        rankDescription.textContent = `${result.pRank.icon} ${result.pRank.rank}級の${result.tRank.label}`;

        dailyViews.textContent = Math.floor(result.popularityIndex).toLocaleString();
        elapsedDays.textContent = `${result.diffDays} 日`;
        totalViews.textContent = views.toLocaleString();

        resultArea.classList.remove('hidden');

        // スムーズなスクロール
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }
});
