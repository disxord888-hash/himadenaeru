document.addEventListener('DOMContentLoaded', () => {
    const videoUrlInput = document.getElementById('videoUrl');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');
    const errorMsg = document.getElementById('errorMsg');
    
    const finalRank = document.getElementById('finalRank');
    const rankDescription = document.getElementById('rankDescription');
    const dailyViews = document.getElementById('dailyViews');
    const elapsedDays = document.getElementById('elapsedDays');
    const totalViews = document.getElementById('totalViews');

    const manualModal = document.getElementById('manualModal');
    const manualInputBtn = document.getElementById('manualInputBtn');
    const cancelManual = document.getElementById('cancelManual');
    const submitManual = document.getElementById('submitManual');

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

    analyzeBtn.addEventListener('click', analyzeVideo);

    async function analyzeVideo() {
        const url = videoUrlInput.value.trim();
        if (!url) return;

        showLoader();
        
        try {
            // YouTube URLからID抽出
            const videoId = extractYouTubeId(url);
            if (!videoId) {
                throw new Error('有効なYouTube URLを入力してください。');
            }

            // NOTE: Chrome拡張やサーバーを介さない場合、直接YouTubeから再生数を取得するのはCORS制限により困難です。
            // ここではデモとして、またはユーザーが特定のプロキシを使用している場合を想定した処理を記述します。
            // 実際の実装では YouTube Data API v3 を使用するか、バックエンドでスクレイピングを行う必要があります。
            
            // 今回はクライアントサイドのみで完結させるため、fetchを試行し、失敗した場合は手動入力を促します。
            const data = await fetchVideoData(videoId);
            displayResult(data.views, data.publishedAt);
        } catch (err) {
            showError(err.message || 'データの取得に失敗しました。');
        }
    }

    function extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    async function fetchVideoData(videoId) {
        // YouTube Data API がない場合、oEmbed や他の公開情報を試みるが、
        // 再生数は通常含まれないため、ここでは「取得できない」として手動入力を促すのが誠実なUIです。
        // もしユーザーがバックエンドを用意できるなら、そこにリクエストを投げます。
        
        // 代替案: 公開されているAPIの例 (Invidious API など)
        const invidiousInstances = [
            'https://invidious.snopyta.org',
            'https://yewtu.be',
            'https://invidious.kavin.rocks'
        ];
        
        for (const instance of invidiousInstances) {
            try {
                const response = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        views: data.viewCount,
                        publishedAt: new Date(data.published * 1000)
                    };
                }
            } catch (e) {
                console.warn(`Instance ${instance} failed`);
            }
        }
        
        throw new Error('自動取得に失敗しました。CORS制限またはAPIの制限により再生数が取得できません。');
    }

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

        hideLoader();
        errorArea.classList.add('hidden');
        resultArea.classList.remove('hidden');
        
        // スムーズなスクロール
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }

    function showLoader() {
        loader.classList.remove('hidden');
        resultArea.classList.add('hidden');
        errorArea.classList.add('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
    }

    function showError(msg) {
        hideLoader();
        errorMsg.textContent = msg;
        errorArea.classList.remove('hidden');
    }

    // Manual Input Handling
    manualInputBtn.addEventListener('click', () => {
        manualModal.classList.remove('hidden');
    });

    cancelManual.addEventListener('click', () => {
        manualModal.classList.add('hidden');
    });

    submitManual.addEventListener('click', () => {
        const views = parseInt(document.getElementById('manualViews').value);
        const dateStr = document.getElementById('manualDate').value;
        
        if (isNaN(views) || !dateStr) {
            alert('有効な値を入力してください。');
            return;
        }

        displayResult(views, new Date(dateStr));
        manualModal.classList.add('hidden');
    });
});
