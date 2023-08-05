let tourism = 'https://erdermus.github.io/tourism.csv';
let tourism_month = 'https://erdermus.github.io/tourism-month.csv';
let ubernacht_2020 = 'https://erdermus.github.io/2020-ubernacht.csv';
let ubernacht_2019 = 'https://erdermus.github.io/2019-ubernacht.csv';

let margin = {top: 80, right: 50, bottom: 40, left: 70};
var selectedYear = 2019,
    currentState = '-',
    currentAnkunft = 0,
    currentUebernachtung = 0,
    avgUebernachtung = 0,
    state_months_ank = [],
    state_months_ueb = [];

/* width and height for map */
var width = 585,
    height = 800,
    focused = null,
    geoPath;

var svg = d3.select("tmp")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")
    .append("g")
    .attr("id", "states");

let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let svgline = d3.select('#month-linechart').append('svg')
    .attr('width', 550 + margin.left + margin.right).attr('height', 420 + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);


d3.json("https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/1_sehr_hoch.geo.json", function (collection) {
    d3.select('#years').on('change', function (foo) {
        selectedYear = d3.select(this).property('value')
    })
    var bounds = d3.geoBounds(collection),
        bottomLeft = bounds[0],
        topRight = bounds[1],
        rotLong = -(topRight[0] + bottomLeft[0]) / 2,
        center = [(topRight[0] + bottomLeft[0]) / 2 + rotLong, (topRight[1] + bottomLeft[1]) / 2],

        projection = d3.geoAlbers()
            .parallels([bottomLeft[1], topRight[1]])
            .rotate([rotLong, 0, 0])
            .translate([width / 2, height / 2])
            .center(center),

        bottomLeftPx = projection(bottomLeft),
        topRightPx = projection(topRight),
        scaleFactor = 1.00 * Math.min(width / (topRightPx[0] - bottomLeftPx[0]), height / (-topRightPx[1] + bottomLeftPx[1])),

        projection = d3.geoAlbers()
            .parallels([bottomLeft[1], topRight[1]])
            .rotate([rotLong, 0, 0])
            .translate([width / 2, height / 2])
            .scale(scaleFactor * 0.975 * 1000)
            .center(center);

    geoPath = d3.geoPath().projection(projection);

    /* mouse hover effect on the map */
    let mouseOver = function (d) {
        d3.selectAll('.feature').transition().duration(200).style('opacity', .5)
        d3.select(this).transition().duration(200).style('opacity', 1)
    }
    let mouseLeave = function (d) {
        d3.selectAll('.feature').transition().duration(200).style('opacity', 1)
        d3.select(this).transition().duration(200).style('stroke', 'white')
    }
    g.selectAll("path.feature")
        .data(collection.features)
        .enter()
        .append("path")
        .attr("class", "feature")
        .attr("d", geoPath)
        .on("click", function (d) {
            currentState = d.properties.name;

            /*
            depending on selected 'federal state' and 'year' get:
            - total value of 'Ankuft' and 'Übernachtung' => currentAnkunft, currentUebernachtung
            - average Übernachtung => avgUebernachtung
            */
            d3.csv(tourism, function (data) {
                data.forEach(bundesland => {
                    if (bundesland.Label == d.properties.name && selectedYear == bundesland.Zeit) {
                        bundesland['Arrivals'] = +bundesland['Arrivals'];
                        bundesland['Overnight Stays'] = +bundesland['Overnight Stays'];
                        currentAnkunft = bundesland.Ankuenfte;
                        currentUebernachtung = bundesland.Uebernachtungen;
                    }
                })
                if (selectedYear == 2019) {
                    getAvg2019(d.properties.name);
                } else if (selectedYear == 2020) {
                    getAvg2020(d.properties.name);
                }

                if (currentState === "-") {
                    document.getElementById("month-linechart").style.opacity = "0";
                    document.getElementById("detail-Information").style.opacity = "0";
                    resetState();
                } else {
                    document.getElementById("month-linechart").style.opacity = "1";
                    document.getElementById("detail-Information").style.opacity = "1";
                }
            });
            visualizeChart();

            /*
            when 'year' is changed update values from above
            */
            d3.select('#years').on('change', function (foo) {
                selectedYear = d3.select(this).property('value')
                d3.csv(tourism, function (data) {
                    data.forEach(bundesland => {
                        if (bundesland.Label == d.properties.name && selectedYear == bundesland.Zeit) {
                            bundesland['Arrivals'] = +bundesland['Arrivals'];
                            bundesland['Overnight Stays'] = +bundesland['Overnight Stays'];
                            currentAnkunft = bundesland.Ankuenfte;
                            currentUebernachtung = bundesland.Uebernachtungen;
                        }
                    })
                    if (selectedYear == 2019) {
                        getAvg2019(d.properties.name);
                    } else if (selectedYear == 2020) {
                        getAvg2020(d.properties.name);
                    }
                })
                visualizeChart();
            });

            /* visualize chart content for selected 'year' and 'federal state' */
            function visualizeChart() {
                if (currentState != "-") {
                    d3.csv(tourism_month, function (data) {
                        data.forEach(bundesland => {
                            if (bundesland.Label == d.properties.name && selectedYear == bundesland.Zeit) {
                                bundesland['Arrivals'] = +bundesland['Arrivals'];
                                bundesland['Overnight Stays'] = +bundesland['Overnight Stays'];
                                bundesland['Code_Monat'] = +bundesland['Code_Monat'];
                                state_months_ank.push(bundesland.Ankuenfte);
                                state_months_ueb.push(bundesland.Uebernachtungen);
                            }
                        })
                        let filteredData = data.filter(bundesland => bundesland.Zeit == selectedYear && bundesland.Label == d.properties.name);

                        /* create new Array with filtered data and adjust its structure */
                        let to_display = [];
                        filteredData.forEach(da => {
                            let tempAnk = {};
                            tempAnk.Code_Monat = da.Code_Monat,
                                tempAnk.Art = "Arrivals",
                                tempAnk.Wert = da.Ankuenfte;
                            let tempUeb = {};
                            tempUeb.Code_Monat = da.Code_Monat,
                                tempUeb.Art = "Overnight Stays",
                                tempUeb.Wert = da.Uebernachtungen;
                            to_display.push(tempAnk);
                            to_display.push(tempUeb);
                        })

                        let sumdata = d3.nest()
                            .key(da => {
                                return da.Art
                            })
                            .entries(to_display);
                        /* create chart axis and labels */
                        let xLineChart = d3.scaleLinear().range([0, 550]).domain(d3.extent(filteredData, function (da, i) {
                                return da.Code_Monat
                            })),
                            yLineChart = d3.scaleLinear().range([400, 0]).domain([0, 12000000]),
                            xaxis = d3.axisBottom().scale(xLineChart).tickFormat((da, i) => months[i]),
                            yaxis = d3.axisLeft().scale(yLineChart),
                            res = sumdata.map(da => {
                                return da.key
                            }),
                            color = d3.scaleOrdinal().domain(res).range(['#D81B60', '#1E88E5', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999']);

                        svgline.append('g').attr('class', 'y axis').call(yaxis);
                        svgline.append('g').attr('transform', 'translate(0,400)').attr('class', 'x axis').call(xaxis)
                            .selectAll('text').attr('transform', 'translate(-10,0)rotate(-45)').style('text-anchor', 'end');
                        /* add legend information to the line chart */
                        svgline.append('text').attr("text-anchor", "end").attr('y', -20).attr('x', 0).style("font", "12px").text("Values")
                        // svgline.append('text').attr("text-anchor", "end").attr('x', 642).attr('y', 420).style("font", "12px times").text("Months")
                        svgline.append("circle").attr("cx", 20).attr("cy", 0).attr("r", 4).style("fill", "#e41a1c")
                        svgline.append("circle").attr("cx", 20).attr("cy", 20).attr("r", 4).style("fill", "#377eb8")
                        svgline.append("text").attr("x", 30).attr("y", 0).text("Arrivals").style("font-size", "11px",).attr("alignment-baseline", "middle")
                        svgline.append("text").attr("x", 30).attr("y", 20).text("Overnight Stays").style("font-size", "11px",).attr("alignment-baseline", "middle")
                        if (selectedYear == 2020) {
                            svgline.append("text").attr("class", "lockdownText").attr("x", 120).attr("y", 450).text("1. Lockdown").style("font-size", "12px").attr("alignment-baseline", "middle")
                            svgline.append("text").attr("class", "lockdownText").attr("x", 490).attr("y", 450).text("2. Lockdown").style("font-size", "12px").attr("alignment-baseline", "middle")
                            svgline.append("text").attr("class", "lockdownText").attr("x", 100).attr("y", 410).text("|").style("font-size", "24px").style('fill', 'red').attr("alignment-baseline", "middle")
                            svgline.append("text").attr("class", "lockdownText").attr("x", 200).attr("y", 410).text("|").style("font-size", "24px").style('fill', 'red').attr("alignment-baseline", "middle")
                            svgline.append("text").attr("class", "lockdownText").attr("x", 500).attr("y", 410).text("|").style("font-size", "24px").style('fill', 'red').attr("alignment-baseline", "middle")
                            svgline.append("text").attr("class", "lockdownText").attr("x", 550).attr("y", 410).text("|").style("font-size", "24px").style('fill', 'red').attr("alignment-baseline", "middle")
                        } else {
                            svgline.selectAll("text.lockdownText").remove()
                        }

                        /* create and update lines */
                        let lines = svgline.selectAll('.line').data(sumdata).attr('class', 'line');
                        lines.exit().remove();
                        lines.enter().append('path').attr('class', 'line')
                            .merge(lines).transition().duration(1000)
                            .attr('d', da => {
                                return d3.line().x(da => {
                                    return xLineChart(da.Code_Monat)
                                }).y(da => {
                                    return yLineChart(da.Wert)
                                })(da.values)
                            })
                            .attr('stroke', da => {
                                return color(da.key)
                            })
                            .attr('stroke-width', 1.5)
                            .attr('fill', 'none');
                    });
                }
            }

            var x = width / 2,
                y = height / 2,
                k = 1,
                name = d.properties.name;

            g.selectAll("text")
                .remove();
            if ((focused === null) || !(focused === d)) {
                var centroid = geoPath.centroid(d),
                    x = +centroid[0],
                    y = +centroid[1],
                    k = 1.75;
                focused = d;

                g.append("text")
                    .text(name)
                    .attr("x", x)
                    .attr("y", y)
                    .style("text-anchor", "middle")
                    .style("font-size", "11px")
                    .style("stroke-width", "0px")
                    .style("fill", "black")
                    .on("click", function (da) {
                        /* hide chart information */
                        resetState();
                        document.getElementById("month-linechart").style.opacity = "0";
                        document.getElementById("detail-Information").style.opacity = "0";
                        focused = null;
                        g.selectAll("text")
                            .remove();
                        g.selectAll("path")
                            .classed("active", 0);
                        g.transition()
                            .duration(1000)
                            .attr("transform", "scale(" + 1 + ")translate(" + 0 + "," + 0 + ")")
                    });
            } else {
                resetState();
                document.getElementById("month-linechart").style.opacity = "0";
                document.getElementById("detail-Information").style.opacity = "0";
                focused = null;
            }
            ;

            /* map zoom effect */
            g.selectAll("path")
                .classed("active", focused && function (d) {
                    return d === focused;
                });
            g.transition()
                .duration(1000)
                .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")scale(" + k + ")translate(" + (-x) + "," + (-y) + ")")
                .style("stroke-width", 1.75 / k + "px");

            if (currentState != "-") {
                document.getElementById("month-linechart").style.opacity = "1";
                document.getElementById("detail-Information").style.opacity = "1";
            } else {
                document.getElementById("month-linechart").style.opacity = "0";
                document.getElementById("detail-Information").style.opacity = "0";
                resetState();
            }
        })
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave);
});

function getAvg2019(federalState) {
    if (currentState != "-") {
        d3.csv(ubernacht_2019, function (data1) {
            data1.forEach(bundesland => {
                if (bundesland.Label == federalState) {
                    bundesland['Wert'] = +bundesland['Wert'];
                    avgUebernachtung = bundesland.Wert;
                }
            })
            changeState();
        })
    }
};

function getAvg2020(federalState) {
    if (currentState != "-") {
        d3.csv(ubernacht_2020, function (data2) {
            data2.forEach(bundesland => {
                if (bundesland.Label == federalState) {
                    bundesland['Wert'] = +bundesland['Wert'];
                    if (focused !== null) {
                        avgUebernachtung = bundesland.Wert;
                    }
                }
            })
            changeState();
        })
    }
};

function changeState() {
    const federal = document.querySelector('.federal-content');
    const ankunft = document.querySelector('.ankunft-content');
    const uebernacht = document.querySelector('.uebernachtung-content');
    const avg = document.querySelector('.avg-content');
    federal.textContent = currentState;
    ankunft.textContent = "Average arrivals: " + currentAnkunft;
    uebernacht.textContent = "Average overnight stays: " + currentUebernachtung;
    avg.textContent = "Average days spent overnight: " + avgUebernachtung;
};

function resetState() {
    currentState = "-";
    currentAnkunft = 0;
    currentUebernachtung = 0;
    avgUebernachtung = 0;
    changeState();
};