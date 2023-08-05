let year_info = 'https://erdermus.github.io/tourism-month.csv',
    states = ['Please Choose', 'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'],
    selectedState = 'Please Choose',
    margin_two = {top: 100, right: 100, bottom: 100, left: 100},
    width_two = 600 - margin_two.left - margin_two.right,
    height_two = 600 - margin_two.top - margin_two.bottom,
    radarChartOptions = {
        w: 300,
        h: 350,
        margin: margin_two,
        levels: 12,
        roundStrokes: true,
        color: d3.scaleOrdinal().range(["#FFC107", "#004D40"]),
        format: '.0f',
        legend: {title: 'Comparison between', translateX: 100, translateY: 40},
    },
    svgOvernight = RadarChart(".compareOve", radarChartOptions);

const max = Math.max,
    sin = Math.sin,
    cos = Math.cos,
    half_pi = Math.PI / 2;

function RadarChart(id, options) {

    d3.csv(year_info, function (data) {
        d3.select('#selectstate')
            .selectAll('myOptions')
            .data(states)
            .enter()
            .append('option')
            .text(function (d) {
                return d;
            })
            .attr("value", function (d) {
                return d;
            })

        /* upon selecting a new State from dropdown update visualisation */
        d3.select('#selectstate').on('change', function (d) {
            let selectedOption = d3.select(this).property('value');
            selectedState = selectedOption;
            (selectedState !== 'Please Choose') ? document.getElementById("compareOve").style.opacity = "1" : document.getElementById("compareOve").style.opacity = "0";
            updateValues(selectedState);
        })

        /* upon selecting via radio button update visualisation */
        d3.select('#radio').on('change', () => {
            updateValues(selectedState);
        })

        function updateValues(newState) {
            data.forEach(bundesland => {
                bundesland['Zeit'] = +bundesland['Zeit'];
                bundesland['Ankuenfte'] = +bundesland['Ankuenfte'];
                bundesland['Uebernachtungen'] = +bundesland['Uebernachtungen'];
                bundesland['Code_Monat'] = +bundesland['Code_Monat'];
            })

            /* variable 'to_display' contain all relevant data information */
            let filteredData = data.filter(bundesland => bundesland.Label === newState),
                to_display = [],
                month2019 = [],
                month2020 = [];

            /* filter data depending on what 'state' and 'radio-value' are selected */
            filteredData.forEach(bundesland => {
                let temp2019 = {},
                    temp2020 = {};
                if (bundesland.Zeit === 2019) {
                    temp2019.axis = bundesland.Monat;
                    document.getElementById('overnight').checked ? temp2019.value = bundesland.Uebernachtungen : temp2019.value = bundesland.Ankuenfte;
                    month2019.push(temp2019);
                } else if (bundesland.Zeit === 2020) {
                    temp2020.axis = bundesland.Monat;
                    document.getElementById('overnight').checked ? temp2020.value = bundesland.Uebernachtungen : temp2020.value = bundesland.Ankuenfte;
                    month2020.push(temp2020);
                }
            })
            let temp1 = {},
                temp2 = {};
            temp1.name = '2019';
            temp1.axes = month2019;
            to_display.push(temp1);
            temp2.name = '2020';
            temp2.axes = month2020;
            to_display.push(temp2);

            let wrap = (text, width_wrap) => {
                text.each(function () {
                    var text = d3.select(this),
                        words = text.text().split(/\s+/).reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.4,
                        yradar = text.attr('y'),
                        xradar = text.attr('x'),
                        dy = parseFloat(text.attr('dy')),
                        tspan = text.text(null).append('tspan').attr('x', xradar).attr('y', yradar).attr('dy', dy + 'em');

                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(' '));
                        if (tspan.node().getComputedTextLength() > width_wrap) {
                            line.pop();
                            tspan.text(line.join(' '));
                            line = [word];
                            tspan = text.append('tspan').attr('x', xradar).attr('y', yradar).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
                        }
                    }
                })
            };

            /* contain configuratoins for the spider chart */
            let cfg = {
                w: 600,
                h: 600,
                margin: {top: 50, right: 50, bottom: 50, left: 50},
                levels: 4,
                maxValue: 0,
                labelFactor: 1.30,
                wrapWidth: 60,
                opacityArea: 0.35,
                dotRadius: 0,
                opacityCircles: 0,
                strokeWidth: 1,
                roundStrokes: false,
                color: d3.scaleOrdinal(d3.schemeCategory10),
                format: '.2%',
                unit: '',
                legend: false
            };

            if ('undefined' !== typeof options) {
                for (var i in options) {
                    if ('undefined' !== typeof options[i]) {
                        cfg[i] = options[i];
                    }
                }
            }
            ;

            let maxValue = 0;
            for (let j = 0; j < to_display.length; j++) {
                for (let i = 0; i < to_display[j].axes.length; i++) {
                    to_display[j].axes[i]['id'] = to_display[j].name;
                    if (to_display[j].axes[i]['value'] > maxValue) {
                        maxValue = to_display[j].axes[i]['value'];
                    }
                }
            }
            maxValue = max(cfg.maxValue, maxValue);

            /* initiate spider chart and its parameters */
            let allAxis = to_display[0].axes.map((i, j) => i.axis),
                total = allAxis.length,
                radius = Math.min(cfg.w / 2, cfg.h / 2),
                Format = d3.format(cfg.format),
                angleSlice = Math.PI * 2 / total;

            let rScale = d3.scaleLinear()
                .range([0, radius])
                .domain([0, maxValue]);

            let parent = d3.select(id);
            parent.selectAll('svg').remove();

            let svgradar = parent.append('svg')
                .attr('width', cfg.w + cfg.margin.left + cfg.margin.right)
                .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
                .attr('class', 'radar');

            let g = svgradar.append('g')
                .attr('transform', 'translate(' + (cfg.w / 2 + cfg.margin.left) + ',' + (cfg.h / 2 + cfg.margin.top) + ')');

            /* draw the grid */
            let axisGrid = g.append('g').attr('class', 'axisWrapper');
            axisGrid.selectAll('.levels')
                .data(d3.range(1, (cfg.levels + 1)).reverse())
                .enter()
                .append('circle')
                .attr('class', 'gridCircle')
                .attr('r', (d, i) => radius / cfg.levels * d)
                .style('fill', '#CDCDCD')
                .style('stroke', '#CDCDCD')
                .style('fill-opacity', cfg.opacityCircles)
                .style('filter', 'url(#glow)');

            // axisGrid.selectAll('.axisLabel')
            //     .data(d3.range(1, (cfg.levels+1)).reverse())
            //     .enter().append('text')
            //     .attr('class', 'axisLabel')
            //     .attr('x', 4)
            //     .attr('y', d => -d*radius/cfg.levels)
            //     .attr('dy', '0.4em')
            //     .style('font-size', '10px')
            //     .attr('fill', '#737373')
            //     .text(d => Format(maxValue * d/cfg.levels) + cfg.unit);

            /* draw the axis */
            let axis = axisGrid.selectAll('.axis')
                .data(allAxis)
                .enter()
                .append('g')
                .attr('class', 'axis');

            axis.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - half_pi))
                .attr('y2', (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - half_pi))
                .attr('class', 'line')
                .style('stroke', 'white')
                .style('stroke-width', '2px');

            axis.append('text')
                .attr('class', 'legend')
                .style('font-size', '11px')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('x', (d, i) => rScale(maxValue * cfg.labelFactor) * cos(angleSlice * i - half_pi))
                .attr('y', (d, i) => rScale(maxValue * cfg.labelFactor) * sin(angleSlice * i - half_pi))
                .text(d => d)
                .call(wrap, cfg.wrapWidth);

            let radarLine = d3.radialLine()
                .curve(d3.curveLinearClosed)
                .radius(d => rScale(d.value))
                .angle((d, i) => i * angleSlice);

            if (cfg.roundStrokes) {
                radarLine.curve(d3.curveCardinalClosed)
            }

            /* draw the radar chart - the visual colored areas */
            let blobWrapper = g.selectAll('.radarWrapper')
                .data(to_display)
                .enter().append('g')
                .attr('class', 'radarWrapper');

            blobWrapper
                .append('path')
                .attr('class', 'radarArea')
                .attr('d', d => radarLine(d.axes))
                .style('fill', (d, i) => cfg.color(i))
                .style('fill-opacity', cfg.opacityArea)
                .on('mouseover', function (d, i) {
                    parent.selectAll('.radarArea')
                        .transition().duration(200)
                        .style('fill-opacity', 0.1);
                    d3.select(this)
                        .transition().duration(200)
                        .style('fill-opacity', 0.7);
                })
                .on('mouseout', function () {
                    parent.selectAll('.radarArea')
                        .transition().duration(200)
                        .style('fill-opacity', cfg.opacityArea);
                });

            blobWrapper.append('path')
                .attr('class', 'radarStroke')
                .attr('d', d => radarLine(d.axes))
                .style('stroke-width', cfg.strokeWidth + 'px')
                .style('stroke', (d, i) => cfg.color(i))
                .style('fill', 'none')
                .style('filter', 'url(#glow)');

            blobWrapper.selectAll('.radarCircle')
                .data(d => d.axes)
                .enter().append('circle')
                .attr('class', 'radarCircle')
                .attr('r', cfg.dotRadius)
                .attr('cx', (d, i) => rScale(d.value) * cos(angleSlice * i - half_pi))
                .attr('cy', (d, i) => rScale(d.value) * sin(angleSlice * i - half_pi))
                .style('fill', (d, i, j) => cfg.color(j))
                .style('fill-opacity', 0.8);

            if (cfg.legend !== false && typeof cfg.legend === "object") {
                let legendZone = svgradar.append('g');
                let names = to_display.map(el => el.name);
                if (cfg.legend.title) {
                    legendZone.append("text")
                        .attr("class", "title")
                        .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`)
                        .attr("x", cfg.w - 70)
                        .attr("y", 10)
                        .attr("font-size", "12px")
                        .attr("fill", "#404040")
                        .text(cfg.legend.title);
                }
                let legend = legendZone.append("g")
                    .attr("class", "legend")
                    .attr("height", 100)
                    .attr("width", 200)
                    .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY + 20})`);
                legend.selectAll('rect')
                    .data(names)
                    .enter()
                    .append("rect")
                    .attr("x", cfg.w - 65)
                    .attr("y", (d, i) => i * 20)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", (d, i) => cfg.color(i));
                legend.selectAll('text')
                    .data(names)
                    .enter()
                    .append("text")
                    .attr("x", cfg.w - 52)
                    .attr("y", (d, i) => i * 20 + 9)
                    .attr("font-size", "11px")
                    .attr("fill", "#737373")
                    .text(d => d);
            }
            return svgradar;
        }

        updateValues(selectedState);
    })

}
