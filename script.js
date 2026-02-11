document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const inputSections = document.querySelectorAll('.input-section');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const fetchBtn = document.getElementById('fetchBtn');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');

    const videoUrlInput = document.getElementById('videoUrl');
    const manualViewsInput = document.getElementById('manualViews');
    const manualDateInput = document.getElementById('manualDate');
    const relativeTimeInput = document.getElementById('relativeTime');

    const finalRank = document.getElementById('finalRank');
    const rankDescription = document.getElementById('rankDescription');
    const dailyViews = document.getElementById('dailyViews');
    const elapsedDays = document.getElementById('elapsedDays');
    const totalViews = document.getElementById('totalViews');

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

    // Parse relative time strings like "18分前", "3時間前", "2日前", "1年前"
    function parseRelativeTime(str) {
        if (!str) return null;
        str = str.trim();

        // Match patterns like: 18分前, 3時間前, 2日前, 1か月前, 1ヶ月前, 1年前, 2週間前, 30秒前
        const match = str.match(/^(\d+)\s*(秒|分|時間|日|週間|週|か月|ヵ月|ヶ月|カ月|ケ月|月|年)\s*前?$/);
        if (!match) return null;

        const amount = parseInt(match[1]);
        const unit = match[2];

        const now = new Date();

        switch (unit) {
            case '秒':
                now.setSeconds(now.getSeconds() - amount);
                break;
            case '分':
                now.setMinutes(now.getMinutes() - amount);
                break;
            case '時間':
                now.setHours(now.getHours() - amount);
                break;
            case '日':
                now.setDate(now.getDate() - amount);
                break;
            case '週間':
            case '週':
                now.setDate(now.getDate() - amount * 7);
                break;
            case 'か月':
            case 'ヵ月':
            case 'ヶ月':
            case 'カ月':
            case 'ケ月':
            case '月':
                now.setMonth(now.getMonth() - amount);
                break;
            case '年':
                now.setFullYear(now.getFullYear() - amount);
                break;
            default:
                return null;
        }

        return now;
    }

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            inputSections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });

    // YouTube URL ID Extraction
    function extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // URL Fetch Logic (Using AllOrigins proxy to bypass CORS)
    fetchBtn.addEventListener('click', async () => {
        const url = videoUrlInput.value.trim();
        if (!url) return;

        showLoader();
        try {
            const videoId = extractYouTubeId(url);
            if (!videoId) throw new Error('有効なYouTube URLを入力してください。');

            const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

            const response = await fetch(proxyUrl);
            const data = await response.json();
            const html = data.contents;

            // Scrape view count and date from HTML meta tags
            const viewMatch = html.match(/itemprop="interactionCount" content="(\d+)"/);
            const dateMatch = html.match(/itemprop="datePublished" content="([\d-]+)"/);

            if (!viewMatch) throw new Error('再生回数の取得に失敗しました。手動で入力してください。');

            const views = parseInt(viewMatch[1]);
            const pubDate = dateMatch ? dateMatch[1] : null;

            // Fill manual fields as fallback / confirmation
            manualViewsInput.value = views;
            if (pubDate) manualDateInput.value = pubDate;

            // Switch to manual tab to show data
            tabBtns[1].click();

            hideLoader();
        } catch (err) {
            hideLoader();
            alert(err.message || 'エラーが発生しました。');
        }
    });

    // Calculate and Display Result
    analyzeBtn.addEventListener('click', () => {
        const views = parseInt(manualViewsInput.value);
        const dateStr = manualDateInput.value;
        const relativeStr = relativeTimeInput ? relativeTimeInput.value.trim() : '';

        // Try to get publishedAt from relative time first, then from date input
        let publishedAt = null;

        if (relativeStr) {
            publishedAt = parseRelativeTime(relativeStr);
            if (!publishedAt) {
                alert('相対時間の形式が正しくありません。例: 18分前, 3時間前, 2日前, 1年前');
                return;
            }
        } else if (dateStr) {
            publishedAt = new Date(dateStr);
        }

        if (isNaN(views) || views < 0 || !publishedAt) {
            alert('有効な再生回数と日付（または相対時間）を入力してください。');
            return;
        }

        const result = calculateRank(views, publishedAt);

        finalRank.textContent = `${result.pRank.rank}-${result.tRank.rank}`;
        rankDescription.textContent = `${result.pRank.icon} ${result.pRank.rank}級の${result.tRank.label}`;

        dailyViews.textContent = Math.floor(result.popularityIndex).toLocaleString();
        elapsedDays.textContent = `${result.diffDays} 日`;
        totalViews.textContent = views.toLocaleString();

        resultArea.classList.remove('hidden');
        resultArea.scrollIntoView({ behavior: 'smooth' });
    });

    function calculateRank(views, publishedAt) {
        const now = new Date();
        // Reset time to midnight for accurate day comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const pubDay = new Date(publishedAt.getFullYear(), publishedAt.getMonth(), publishedAt.getDate());

        const diffTime = Math.abs(today - pubDay);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        const popularityIndex = views / diffDays;

        const pRank = POPULARITY_RANKS.find(r => popularityIndex >= r.threshold);
        const tRank = TIMING_RANKS.find(r => diffDays <= r.maxDays);

        return { pRank, tRank, popularityIndex, diffDays };
    }

    function showLoader() { loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
});
