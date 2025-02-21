class TimelineView {
  constructor(svg, container, config) {
    this.svg = svg;
    this.container = container;
    this.config = config;
    this.id = "timeline-" + Math.random().toString(36).substr(2, 9);
    this.container.attr("data-timeline-id", this.id);
  }

  clear() {
    this.svg.html("");
    d3.selectAll(`.event-tooltip[data-timeline-id="${this.id}"]`).remove();
  }

  calculateDimensions(entities) {
    const containerNode = this.container.node();
    const containerWidth = containerNode.clientWidth;
    const containerHeight = containerNode.clientHeight;

    if (this.config.orientation === "vertical") {
      return {
        width:
          entities.length * this.config.entity.spacing +
          this.config.margin.left +
          this.config.margin.right,
        height:
          containerHeight - this.config.margin.top - this.config.margin.bottom,
      };
    }

    return {
      width:
        containerWidth - this.config.margin.left - this.config.margin.right,
      height:
        entities.length * this.config.entity.spacing +
        this.config.margin.top +
        this.config.margin.bottom,
    };
  }

  initializeSVG(dimensions) {
    return this.svg
      .attr(
        "width",
        dimensions.width + this.config.margin.left + this.config.margin.right
      )
      .attr("height", dimensions.height)
      .append("g")
      .attr(
        "transform",
        `translate(${this.config.margin.left},${this.config.margin.top})`
      );
  }

  drawEntityLines(svg, entities, width) {
    if (this.config.orientation === "vertical") {
      svg
        .selectAll(".metro-line")
        .data(entities)
        .enter()
        .append("line")
        .attr("class", "metro-line")
        .style("stroke", (d) => d.color)
        .style("stroke-width", this.config.entity.lineStrokeWidth)
        .attr("x1", (d) => d.x)
        .attr("y1", 0)
        .attr("x2", (d) => d.x)
        .attr("y2", width);
    } else {
      svg
        .selectAll(".metro-line")
        .data(entities)
        .enter()
        .append("line")
        .attr("class", "metro-line")
        .style("stroke", (d) => d.color)
        .style("stroke-width", this.config.entity.lineStrokeWidth)
        .attr("x1", 0)
        .attr("y1", (d) => d.y)
        .attr("x2", width)
        .attr("y2", (d) => d.y);
    }
  }

  drawEntityLabels(svg, entities) {
    // Add utility method to measure text width
    const getTextWidth = (text) => {
      const temp = svg.append("text").attr("class", "entity-label").text(text);
      const width = temp.node().getComputedTextLength();
      temp.remove();
      return width;
    };

    if (this.config.orientation === "vertical") {
      svg
        .selectAll(".entity-label")
        .data(entities)
        .enter()
        .append("text")
        .attr("class", "entity-label")
        .text((d) => d.name)
        .attr("x", (d) => d.x)
        .attr("y", (d) => {
          const textWidth = getTextWidth(d.name);
          return -textWidth / 2 - 10; // Dynamic spacing based on text width
        })
        .attr("text-anchor", "middle")
        .attr("transform", (d) => {
          const textWidth = getTextWidth(d.name);
          return `rotate(-90, ${d.x}, ${-textWidth / 2 - 10})`;
        });
    } else {
      svg
        .selectAll(".entity-label")
        .data(entities)
        .enter()
        .append("text")
        .attr("class", "entity-label")
        .text((d) => d.name)
        .attr("x", (d) => {
          const textWidth = getTextWidth(d.name);
          return -textWidth - 20; // Dynamic spacing based on text width
        })
        .attr("y", (d) => d.y)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle");
    }
  }

  drawNode(group, pos, isVertical = false) {
    const nodeGroup = group.append("g").attr("class", "node-set");

    if (isVertical) {
      nodeGroup
        .append("circle")
        .attr("class", "node")
        .attr("cx", pos)
        .attr("cy", 0)
        .attr("r", this.config.node.outerRadius);

      nodeGroup
        .append("circle")
        .attr("class", "node-inner")
        .attr("cx", pos)
        .attr("cy", 0)
        .attr("r", this.config.node.innerRadius);
    } else {
      nodeGroup
        .append("circle")
        .attr("class", "node")
        .attr("cx", 0)
        .attr("cy", pos)
        .attr("r", this.config.node.outerRadius);

      nodeGroup
        .append("circle")
        .attr("class", "node-inner")
        .attr("cx", 0)
        .attr("cy", pos)
        .attr("r", this.config.node.innerRadius);
    }
  }

  drawEventBox(event, minPos) {
    const tooltip = this.container
      .append("div")
      .attr("class", "event-tooltip")
      .attr("data-timeline-id", this.id)
      .text(event.text)
      .on("mouseenter", function () {
        d3.select(this).classed("expanded", true);
      })
      .on("mouseleave", function () {
        d3.select(this).classed("expanded", false);
      });

    const svgNode = this.svg.node();
    const svgRect = svgNode.getBoundingClientRect();
    const containerRect = this.container.node().getBoundingClientRect();

    let xPos, yPos;

    if (this.config.orientation === "vertical") {
      xPos = minPos - 10;
      yPos = svgRect.top - containerRect.top + event.x + this.config.margin.top;

      tooltip
        .style("transform", "translate(0, -50%)")
        .style("left", xPos + "px")
        .style("top", yPos + "px");
    } else {
      xPos =
        svgRect.left - containerRect.left + this.config.margin.left + event.x;
      yPos =
        svgRect.top - containerRect.top + minPos + this.config.margin.top - 10;

      tooltip
        .style("transform", "translate(-50%, -100%)")
        .style("left", xPos + "px")
        .style("top", yPos + "px");
    }
  }

  drawEvent(group, event, getEntityY) {
    const getPosition = (entityId) => {
      if (this.config.orientation === "vertical") {
        return getEntityY(entityId);
      }
      return getEntityY(entityId);
    };

    const yPoints = event.entities.map((entityId) => getPosition(entityId));
    const minY = d3.min(yPoints);
    const maxY = d3.max(yPoints);

    if (this.config.orientation === "vertical") {
      group
        .append("path")
        .attr("class", "connector")
        .style("stroke-width", this.config.connector.outerWidth)
        .attr("d", `M${minY},0 L${maxY},0`);

      event.entities.forEach((entityId) => {
        this.drawNode(group, getPosition(entityId), true);
      });

      group
        .append("path")
        .attr("class", "connector-inner")
        .style("stroke-width", this.config.connector.innerWidth)
        .attr("d", `M${minY},0 L${maxY},0`);
    } else {
      group
        .append("path")
        .attr("class", "connector")
        .style("stroke-width", this.config.connector.outerWidth)
        .attr("d", `M0,${minY} L0,${maxY}`);

      event.entities.forEach((entityId) => {
        this.drawNode(group, getPosition(entityId));
      });

      group
        .append("path")
        .attr("class", "connector-inner")
        .style("stroke-width", this.config.connector.innerWidth)
        .attr("d", `M0,${minY} L0,${maxY}`);
    }

    this.drawEventBox(event, minY);
  }

  updateTooltipPosition(tooltip, x, y) {
    const containerRect = this.container.node().getBoundingClientRect();
    const svgRect = this.svg.node().getBoundingClientRect();

    // Calculate the scroll offset
    const scrollLeft = this.container.node().scrollLeft;
    const scrollTop = this.container.node().scrollTop;

    // Calculate position relative to container
    let tooltipX, tooltipY;

    if (this.config.orientation === "horizontal") {
      tooltipX = x - svgRect.left + containerRect.left - scrollLeft;
      tooltipY = y - svgRect.top + containerRect.top - scrollTop;
    } else {
      // For vertical timeline, swap x and y coordinates
      tooltipX = y - svgRect.left + containerRect.left - scrollLeft;
      tooltipY = x - svgRect.top + containerRect.top - scrollTop;
    }

    // Adjust tooltip position to prevent overflow
    const tooltipWidth = 120; // Width from CSS
    const tooltipHeight = tooltip.classed("expanded") ? 200 : 20; // Height from CSS

    // Ensure tooltip stays within container bounds
    tooltipX = Math.min(
      Math.max(tooltipX, containerRect.left),
      containerRect.right - tooltipWidth
    );
    tooltipY = Math.min(
      Math.max(tooltipY, containerRect.top),
      containerRect.bottom - tooltipHeight
    );

    tooltip.style("left", `${tooltipX}px`).style("top", `${tooltipY}px`);
  }
}
