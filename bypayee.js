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

let chart;
let allRows;
let payeeIndex;
let outIndex;
let inIndex;
let categoryIndex;
let groupIndex;

function loadChart() {
    fetch('transactions.csv')
        .then(res => res.text())
        .then(text => {
            const rows = parseCSV(text);
            if (rows.length <= 1) return;
            allRows = rows;
            const headers = rows[0];
            payeeIndex = headers.indexOf('Payee');
            outIndex = headers.indexOf('Outflow');
            inIndex = headers.indexOf('Inflow');
            categoryIndex = headers.indexOf('Category');
            if (categoryIndex === -1) {
                categoryIndex = headers.indexOf('Category Group/Category');
            }
            groupIndex = headers.indexOf('Category Group');
            createCategoryFilter();
            updateChart();
        });
}

function createCategoryFilter() {
    const groups = {};
    for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        if (row.length === 0) continue;
        const group = groupIndex !== -1 ? row[groupIndex] : (row[categoryIndex].split(':')[0] || '');
        const cat = row[categoryIndex];
        if (!groups[group]) groups[group] = new Set();
        groups[group].add(cat);
    }
    const container = document.getElementById('categoryFilter');
    container.innerHTML = '';
    Object.keys(groups).sort().forEach(g => {
        const section = document.createElement('div');
        section.className = 'group';
        const title = document.createElement('div');
        title.className = 'group-title';
        title.textContent = g;
        section.appendChild(title);
        Array.from(groups[g]).sort().forEach(cat => {
            const label = document.createElement('label');
            const box = document.createElement('input');
            box.type = 'checkbox';
            box.value = cat;
            box.checked = false;
            box.addEventListener('change', updateChart);
            label.appendChild(box);
            label.appendChild(document.createTextNode(cat));
            section.appendChild(label);
        });
        container.appendChild(section);
    });
}

function updateChart() {
    const selected = Array.from(document.querySelectorAll('#categoryFilter input:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        }
        return;
    }
    const totals = {};
    for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        if (row.length === 0) continue;
        if (selected.length && !selected.includes(row[categoryIndex])) continue;
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
    if (!chart) {
        const ctx = document.getElementById('payeeChart').getContext('2d');
        chart = new Chart(ctx, {
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: $${ctx.parsed.toFixed(2)}`
                        }
                    }
                }
            },
            plugins: [labelPlugin]
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();
    }
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
