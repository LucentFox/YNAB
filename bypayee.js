function parseCSV(str, delimiter = ',') {
    const pattern = new RegExp(
        ("(\\" + delimiter + "|\r?\n|\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\" + delimiter + "\r\n]*))"),
        'gi'
    );
    const data = [[]];
    let matches = null;
    while ((matches = pattern.exec(str))) {
        const matchedDelimiter = matches[1];
        if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
            data.push([]);
        }
        let value = matches[2] ? matches[2].replace(/\"\"/g, '"') : matches[3];
        data[data.length - 1].push(value);
    }
    return data;
}

function loadChart() {
    fetch('transactions.csv')
        .then(res => res.text())
        .then(text => {
            const rows = parseCSV(text);
            if (rows.length <= 1) return;
            const headers = rows[0];
            const payeeIndex = headers.indexOf('Payee');
            const outIndex = headers.indexOf('Outflow');
            const inIndex = headers.indexOf('Inflow');
            const totals = {};
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0) continue;
                const payee = row[payeeIndex];
                const out = parseFloat(row[outIndex].replace(/[$,]/g, '')) || 0;
                const inflow = parseFloat(row[inIndex].replace(/[$,]/g, '')) || 0;
                const sum = out + inflow;
                totals[payee] = (totals[payee] || 0) + sum;
            }
            const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
            const labels = entries.map(e => e[0]);
            const data = entries.map(e => e[1]);
            const colors = labels.map((_, i) => `hsl(${(i * 360 / labels.length) % 360},70%,60%)`);
            const ctx = document.getElementById('payeeChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.label}: $${ctx.parsed.toFixed(2)}`
                            }
                        }
                    }
                },
                plugins: [labelPlugin]
            });
        });
}

const labelPlugin = {
    id: 'labelPlugin',
    afterDatasetDraw(chart, args, options) {
        const {ctx} = chart;
        chart.getDatasetMeta(0).data.forEach((arc, index) => {
            const center = arc.getCenterPoint();
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = chart.data.labels[index];
            const value = chart.data.datasets[0].data[index];
            ctx.fillText(`${label}: $${value.toFixed(2)}`, center.x, center.y);
            ctx.restore();
        });
    }
};

document.addEventListener('DOMContentLoaded', loadChart);
