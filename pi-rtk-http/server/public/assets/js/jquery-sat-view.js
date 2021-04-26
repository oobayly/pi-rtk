/*eslint-env browser */
/*eslint-env jquery */

(function ($) {
  const template = `<svg viewBox="0 0 1000 1250" xmlns="http://www.w3.org/2000/svg" class="sat-view">
  <g transform="translate(500, 500)" class="view sky-view">
    <circle cx="0" cy="0" r="450"/>
    <circle cx="0" cy="0" r="337.5"/>
    <circle cx="0" cy="0" r="225"/>
    <circle cx="0" cy="0" r="112.5"/>
    <line x1="-450" y1="0" x2="450" y2="0"/>
    <line x1="0" y1="-450" x2="0" y2="450"/>
    
    <g class="sat-group">
      <!--<g class="sat sat-gps sat-unused" transform="translate(-100, 234)" data-prn="23">
        <circle cx="0" cy="0" r="20"/>
        <text x="20" y="40">23</text>
      </g>
      <g class="sat sat-galileo" transform="translate(20, -100)" data-prn="135">
        <title>Foo</title>
        <circle cx="0" cy="0" r="20"/>
        <text x="20" y="40">135</text>
      </g>-->
    </g>
  </g>
  
  <g transform="translate(50, 1200)" class="view snr-view">
    <line x1="900" y1="0" x2="900" y2="-200"/>
    <line x1="0" y1="0" x2="910" y2="0" />
    <text x="915" y="0">0</text>
    <line x1="0" y1="-50" x2="910" y2="-50"/>
    <text x="915" y="-50">15</text>
    <line x1="0" y1="-100" x2="910" y2="-100"/>
    <text x="915" y="-100">30</text>
    <line x1="0" y1="-150" x2="910" y2="-150"/>
    <text x="915" y="-150">45</text>
    <line x1="0" y1="-200" x2="910" y2="-200"/>
    <text x="915" y="-200">60</text>
    
    <g class="sat-group">
      <!--<g class="sat sat-gps sat-unused" transform="translate(0, 0)" data-prn="23">
        <title></title>
        <rect x="0" y="-134" width="30" height="134" />
        <text x="15" y="24">23</text>
      </g>
      <g class="sat sat-galileo" transform="translate(30, 0)" data-prn="135">
        <title></title>
        <rect x="0" y="-45" width="30" height="45" />
        <text x="15" y="24">135</text>
      </g>-->
    </g>
  </g>
</svg>`;

  $.satView = function (el, options) {
    // To avoid scope issues, use 'base' instead of 'this'
    // to reference this class from internal events and functions.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;

    // Access to jQuery and DOM versions of element
    base.$el = $(el);
    base.el = el;

    // Add a reverse reference to the DOM object
    base.$el.data("satView", base);

    base.init = function () {
      base.options = $.extend({}, $.satView.defaultOptions, options);

      // Put your initialization code here
      this.$el.html(template);
    };

    function createSkyItem(item) {
      const { constellation, gnssid, PRN, used } = item;

      const group = createSvgElement("g");
      const title = createSvgElement("title");
      const circle = createSvgElement("circle");
      const text = createSvgElement("text");

      // Group
      group.classList.add("sat");
      group.classList.add(`sat-${gnssid}`);
      group.setAttribute("data-prn", PRN);
      group.addEventListener("mouseenter", onMouseEnter);
      group.addEventListener("mouseout", onMouseOut);

      if (!used) {
        group.classList.add("sat-unused");
      }

      // Title
      title.textContent = constellation;

      // Circle marker
      circle.setAttribute("cx", 0);
      circle.setAttribute("cy", 0);
      circle.setAttribute("r", 20);

      // Text
      text.textContent = PRN;
      text.setAttribute("x", 20);
      text.setAttribute("y", 40);

      group.appendChild(title);
      group.appendChild(circle);
      group.appendChild(text);

      return group;
    }

    function createSnrItem(item) {
      const { constellation, gnssid, PRN, used } = item;

      const group = createSvgElement("g");
      const title = createSvgElement("title");
      const rect = createSvgElement("rect");
      const text = createSvgElement("text");

      // Group
      group.classList.add("sat");
      group.classList.add(`sat-${gnssid}`);
      group.setAttribute("data-prn", PRN);
      group.addEventListener("mouseenter", onMouseEnter);
      group.addEventListener("mouseout", onMouseOut);

      if (!used) {
        group.classList.add("sat-unused");
      }

      // Title
      title.textContent = constellation;

      // Circle marker
      rect.setAttribute("x", 0);

      // Text
      text.textContent = PRN;
      text.setAttribute("x", 15);
      text.setAttribute("y", 24);

      group.appendChild(title);
      group.appendChild(rect);
      group.appendChild(text);

      return group;
    }

    function createSvgElement(tagName) {
      return document.createElementNS("http://www.w3.org/2000/svg", tagName);
    }

    function onMouseEnter(_e) {
      const prn = $(this).data("prn");

      base.$el.find(`.sat[data-prn='${prn}']`).addClass("active");
    }

    function onMouseOut(_e) {
      const prn = $(this).data("prn");

      base.$el.find(`.sat[data-prn='${prn}']`).removeClass("active");
    }

    // Sample Function, Uncomment to use
    base.updateSatellites = function (satellites) {
      satellites = satellites || [];

      const snrWidth = Math.max(900 / satellites.length, 30);
      const skyView = this.$el.find(".sky-view .sat-group");
      const snrView = this.$el.find(".snr-view .sat-group");

      // Add or update the sky view
      satellites.forEach((item, index) => {
        const { az, el, PRN } = item;
        const radius = 450 * el / 90;
        const x = radius * Math.sin(az * Math.PI / 180);
        const y = radius * Math.cos(az * Math.PI / 180);

        let group = skyView.find(`.sat[data-prn='${PRN}'`)[0];

        if (!group) {
          const nextPRN = satellites[index + 1]?.PRN;
          const nextSat = skyView.find(`.sat[data-prn='${nextPRN}'`)[0];

          group = createSkyItem(item);

          if (nextSat) {
            skyView[0].insertBefore(group, nextSat);
          } else {
            skyView[0].appendChild(group);
          }
        }

        group.setAttribute("transform", `translate(${x}, ${y})`);
      });

      // Remove any satellite objects that are no longer available.
      skyView.children().each((_index, item) => {
        item = $(item);
        const prn = item.data("prn");

        if (!satellites.some((x) => x.PRN === prn)) {
          item.remove();
        }
      });

      // Add or update the SNR view
      satellites.forEach((item, index) => {
        const { PRN, ss } = item;
        const height = 200 * ss / 60;
        const x = snrWidth * index;

        let group = snrView.find(`.sat[data-prn='${PRN}'`)[0];

        if (!group) {
          const nextPRN = satellites[index + 1]?.PRN;
          const nextSat = snrView.find(`.sat[data-prn='${nextPRN}'`)[0];

          group = createSnrItem(item, snrWidth);

          if (nextSat) {
            snrView[0].insertBefore(group, nextSat);
          } else {
            snrView[0].appendChild(group);
          }
        }

        const rect = group.getElementsByTagName("rect")[0];
        const text = group.getElementsByTagName("text")[0];

        group.setAttribute("transform", `translate(${x}, 0)`);
        rect.setAttribute("width", snrWidth);
        rect.setAttribute("y", -height);
        rect.setAttribute("height", height);
        text.setAttribute("x", snrWidth / 2);
      });

      // Remove any satellite objects that are no longer available.
      snrView.children().each((_index, item) => {
        item = $(item);
        const prn = item.data("prn");

        if (!satellites.some((x) => x.PRN === prn)) {
          item.remove();
        }
      });
    };

    // Run initializer
    base.init();
  };

  $.satView.defaultOptions = {
  };

  $.fn.satView = function (options) {
    return this.each(function () {
      (new $.satView(this, options));
    });
  };
})(jQuery);
