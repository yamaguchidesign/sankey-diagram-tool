// サンキーダイアグラム作成ツール
class SankeyDiagramTool {
    constructor() {
        this.links = [];
        this.currentInputMethod = 'csv';
        this.chartData = null;

        this.initializeEventListeners();
        this.loadSampleData();
    }

    initializeEventListeners() {
        // 入力方法の切り替え
        document.getElementById('csv-input-btn').addEventListener('click', () => {
            this.switchInputMethod('csv');
        });

        document.getElementById('manual-input-btn').addEventListener('click', () => {
            this.switchInputMethod('manual');
        });

        document.getElementById('sample-data-btn').addEventListener('click', () => {
            this.loadSampleData();
        });

        // 手動入力
        document.getElementById('add-link-btn').addEventListener('click', () => {
            this.addLink();
        });

        // エンターキーでリンク追加
        ['source-input', 'target-input', 'value-input'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addLink();
                }
            });
        });

        // スタイル設定
        document.getElementById('opacity-slider').addEventListener('input', (e) => {
            document.getElementById('opacity-value').textContent = e.target.value;
            this.updateChartStyle();
        });

        document.getElementById('node-color').addEventListener('change', () => {
            this.updateChartStyle();
        });

        document.getElementById('link-color').addEventListener('change', () => {
            this.updateChartStyle();
        });

        // アクション
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateDiagram();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportSVG();
        });
    }

    switchInputMethod(method) {
        this.currentInputMethod = method;

        // ボタンのアクティブ状態を更新
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${method}-input-btn`).classList.add('active');

        // 入力エリアの表示切替
        document.querySelectorAll('.input-container').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(`${method}-input`).classList.add('active');
    }

    loadSampleData() {
        const sampleData = `source,target,value
Web広告,サイト訪問,1000
検索エンジン,サイト訪問,800
SNS,サイト訪問,600
サイト訪問,商品閲覧,1200
サイト訪問,離脱,1200
商品閲覧,カート追加,400
商品閲覧,離脱,800
カート追加,購入完了,300
カート追加,離脱,100`;

        document.getElementById('csv-data').value = sampleData;
        this.switchInputMethod('csv');
    }

    addLink() {
        const source = document.getElementById('source-input').value.trim();
        const target = document.getElementById('target-input').value.trim();
        const value = parseFloat(document.getElementById('value-input').value);

        if (!source || !target || isNaN(value) || value <= 0) {
            alert('すべての項目を正しく入力してください');
            return;
        }

        const linkId = Date.now();
        this.links.push({ id: linkId, source, target, value });

        this.updateLinksList();
        this.clearManualInputs();
    }

    updateLinksList() {
        const linksList = document.getElementById('links-list');
        linksList.innerHTML = '';

        this.links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            linkItem.innerHTML = `
                <span>${link.source} → ${link.target} (${link.value})</span>
                <button onclick="tool.removeLink(${link.id})">削除</button>
            `;
            linksList.appendChild(linkItem);
        });
    }

    removeLink(linkId) {
        this.links = this.links.filter(link => link.id !== linkId);
        this.updateLinksList();
    }

    clearManualInputs() {
        document.getElementById('source-input').value = '';
        document.getElementById('target-input').value = '';
        document.getElementById('value-input').value = '';
    }

    parseCSVData() {
        const csvData = document.getElementById('csv-data').value.trim();
        if (!csvData) {
            alert('CSVデータを入力してください');
            return null;
        }

        const lines = csvData.split('\n');
        const data = [];

        // ヘッダー行をスキップ
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [source, target, value] = line.split(',').map(item => item.trim());
            const numValue = parseFloat(value);

            if (source && target && !isNaN(numValue) && numValue > 0) {
                data.push({ source, target, value: numValue });
            }
        }

        return data.length > 0 ? data : null;
    }

    prepareChartData() {
        let data;

        if (this.currentInputMethod === 'csv') {
            data = this.parseCSVData();
        } else {
            data = this.links.map(link => ({
                source: link.source,
                target: link.target,
                value: link.value
            }));
        }

        if (!data || data.length === 0) {
            alert('有効なデータがありません');
            return null;
        }

        // ノードを抽出
        const nodeSet = new Set();
        data.forEach(d => {
            nodeSet.add(d.source);
            nodeSet.add(d.target);
        });

        const nodes = Array.from(nodeSet).map(name => ({ name }));
        const links = data.map(d => ({
            source: d.source,
            target: d.target,
            value: d.value
        }));

        return { nodes, links };
    }

    generateDiagram() {
        this.chartData = this.prepareChartData();
        if (!this.chartData) return;

        this.createSankeyChart(this.chartData);

        // プレースホルダーを隠してチャートを表示
        document.getElementById('chart-placeholder').classList.add('hidden');
        document.getElementById('sankey-chart').classList.add('active');
    }

    createSankeyChart(data) {
        const chartContainer = document.getElementById('sankey-chart');
        chartContainer.innerHTML = '';

        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = chartContainer.clientHeight - margin.top - margin.bottom;

        const svg = d3.select('#sankey-chart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // サンキーレイアウトを作成
        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(20)
            .extent([[1, 1], [width - 1, height - 6]]);

        const { nodes, links } = sankey({
            nodes: data.nodes.map(d => Object.assign({}, d)),
            links: data.links.map(d => Object.assign({}, d))
        });

        // 色の設定
        const nodeColor = document.getElementById('node-color').value;
        const linkColor = document.getElementById('link-color').value;
        const opacity = parseFloat(document.getElementById('opacity-slider').value);

        // リンクを描画
        g.append('g')
            .selectAll('path')
            .data(links)
            .enter().append('path')
            .attr('class', 'sankey-link')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', linkColor)
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('stroke-opacity', opacity)
            .attr('fill', 'none')
            .append('title')
            .text(d => `${d.source.name} → ${d.target.name}\n値: ${d.value}`);

        // ノードを描画
        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'sankey-node');

        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', nodeColor)
            .append('title')
            .text(d => `${d.name}\n値: ${d.value}`);

        // ノードのラベル
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .text(d => d.name)
            .filter(d => d.x0 < width / 2)
            .attr('x', d => d.x1 + 6)
            .attr('text-anchor', 'start');
    }

    updateChartStyle() {
        if (!this.chartData) return;

        const links = d3.selectAll('.sankey-link');
        const nodes = d3.selectAll('.sankey-node rect');

        const linkColor = document.getElementById('link-color').value;
        const nodeColor = document.getElementById('node-color').value;
        const opacity = parseFloat(document.getElementById('opacity-slider').value);

        links.attr('stroke', linkColor)
            .attr('stroke-opacity', opacity);

        nodes.attr('fill', nodeColor);
    }

    exportSVG() {
        const svg = document.querySelector('#sankey-chart svg');
        if (!svg) {
            alert('エクスポートするダイアグラムがありません');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'sankey-diagram.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    }
}

// アプリケーションを初期化
const tool = new SankeyDiagramTool(); 