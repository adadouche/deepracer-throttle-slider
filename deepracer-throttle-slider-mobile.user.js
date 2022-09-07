// ==UserScript==
// @name		deepracer-throttle-slider-mobile
// @namespace	https://gitlab.aws.dev/aws-sa-global-auto/deepracer-throttle-slider
// @version		0.1
// @description	Alter the DeepRacer Throttle Control to a Slider for mobile/tablet device
// @author		adadouch
// @include         https://192.168.*/*
// @include         https://172.*/*
// @include         https://10.*/*
// @icon		data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require		http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @require     http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.1/jquery-ui.min.js
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_setClipboard
// @grant       GM_info
// @grant       unsafeWindow
// @run-at		document-end
// ==/UserScript==
(function() {
    'use strict';

    // this is the threshold between 2 calls to the throttle API to prevent the server from going nuts
    const throttleMs = 500;

    // the slider style sheet
    const sliderCSSStyle = `
    .sliderContainer {
      width: 100%;
    }

    .slider {
      -webkit-appearance: none;
      width: 100%;
      height: 50px;
      outline: none;
      opacity: 0.57;
      -webkit-transition: .2s;
      transition: opacity .2s;
      background: #d3d3d3;
    }

    .slider:hover {
      opacity: 1;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 25px;
      height: 50px;
      background: #04AA6D;
      cursor: pointer;
    }

    .slider::-moz-range-thumb {
      width: 25px;
      height: 50px;
      background: #04AA6D;
      cursor: pointer;
    }
    `;

    // the function that will put the throttle value using axios
    function setCarThrottle(throttle) {
        const payload = "{ \"throttle\": "+ throttle + " }";
        console.log("throttle with fetch : " + throttle);
        return fetch("/api/max_nav_throttle", {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
                "Accept": "*/*",
                "Accept-Language": "en-GB,en;q=0.5",
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                "Content-Type": "application/json;charset=utf-8",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            "body": "{\"throttle\": " + throttle + "}",
            "method": "PUT",
            "mode": "cors"
        });

        var options = {
            method: "PUT",
            url: '/api/max_nav_throttle',
            data: payload,
            credentials: "include",
            mode: "cors",
            headers: {
                "Content-Type": "application/json;charset=utf-8",
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN' : document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Pragma": "no-cache",
                "Cache-Control": "no-cache"
            },
            onload : function(response) {
                console.log(" onload  " + response.responseText );
            },
            onerror: function(response) {
                console.log(" onerror " + response.responseText );
            },
            onabort: function(response) {
                console.log(" onabort " + response.responseText );
            },
            onprogress: function(response) {
                console.log(" onprogress " + response.responseText );
            },
            onreadystatechange: function(response) {
                console.log(" onreadystatechange " + response.responseText );
            },
            ontimeout: function(response) {
                console.log(" ontimeout " + response.responseText );
            },
        };

        if (GM != null) {
            console.log("GM.");
            return GM.xmlHttpRequest(options);
        } else {
            console.log("GM_");
            return GM_xmlhttpRequest(options);
        }
    };

    // the debounce functions allows you to throttle the request execution
    function debounce(func, wait) {
        let waiting;
        let sharedResult;
        return function() {
            // first call will create the promise|value here
            if (!waiting) {
                setTimeout(clearWait, wait)
                waiting = true
                sharedResult = func.apply(this, arguments);
            }
            // else new calls within waitTime will be discarded but shared the result from first call

            function clearWait() {
                waiting = null
                sharedResult = null
            }

            return sharedResult
        };
    }

    const debouncedSetCarThrottle = debounce(setCarThrottle, throttleMs)

    function addSliderStyle() {
        const sliderStyle = document.createElement('style');
        sliderStyle.type = 'text/css';
        sliderStyle.id = 'sliderCSSStyle';
        sliderStyle.innerHTML = sliderCSSStyle;
        document.getElementsByTagName("head")[0].appendChild( sliderStyle );
    }

    function addSliderDOM(element) {
        const sliderInput = document.createElement("input");
        sliderInput.className = "slider";
        sliderInput.type = 'range';
        sliderInput.min = 0;
        sliderInput.max = 100;
        sliderInput.value = 35;
        sliderInput.step = 1;

        const sliderDiv = document.createElement("div");
        sliderDiv.className = "sliderContainer";
        sliderDiv.appendChild(sliderInput);

        const speedLabelH = document.createElement("h2");
        speedLabelH.innerHTML = "Speed";

        const speedLabelInstruction = document.createElement("div");
        speedLabelInstruction.className = "awsui-util-label";
        speedLabelInstruction.innerHTML = "Adjust maximum speed";

        const speedLabelValue = document.createElement("div");
        speedLabelValue.className = "awsui-util-f-r";
        speedLabelValue.id = "speedLabelValue";
        speedLabelValue.innerHTML = sliderInput.value;

        const speedLabelSpeedUnit = document.createElement("div");
        speedLabelSpeedUnit.className = "awsui-util-f-r";
        speedLabelSpeedUnit.innerHTML = "&nbsp;%";

        speedLabelInstruction.appendChild(speedLabelSpeedUnit);
        speedLabelInstruction.appendChild(speedLabelValue);

        const speedLabelDiv = document.createElement("div");
        speedLabelDiv.className = "speedLabelContainer";
        speedLabelDiv.appendChild(speedLabelH);
        speedLabelDiv.appendChild(speedLabelInstruction);

        element.append(speedLabelDiv);
        element.append(sliderDiv);

        sliderInput.oninput = function(event) {
            var output = document.getElementById("speedLabelValue");
            output.innerHTML = sliderInput.value;
            debouncedSetCarThrottle(sliderInput.value);
        };

        debouncedSetCarThrottle(sliderInput.value);
    }

    function init() {
        try {
            // if the observerExistElement exists then don't add a new observer
            // this is to prevent multiple execution in parallel
            const observerExistElement = document.getElementById('observer');
            if (observerExistElement) {
                console.log("monkey script already started");
                return;
            } else {
                const element = document.createElement('observer');
                element.id = 'observer';
                document.getElementsByTagName("head")[0].appendChild( element );
            }

            // TODO: check if the page title is "AWS DeepRacer"
            // check if there is a "root" element as the page else quit
            const rootElement = document.getElementById('root');
            if (!rootElement) {
                console.log("no root to use yet");
                return;
            }
            const observerElement = rootElement.childNodes[0];
            if (!observerElement) {
                console.log("no child to use yet");
                return;
            }
          
            const rangeSelector = document.querySelector('.awsui-util-pt-s');
          	console.log(rangeSelector);
            if(!rangeSelector) {
                console.log("no rangeSelector to use yet");
                return;
            }

            console.log("hiding the current control");
            const throttleDOM = rangeSelector.parentElement;
            for(var x = 0; x < throttleDOM.childNodes.length; x++) {
                throttleDOM.childNodes[x].style.display = 'none';
            }
          	console.log("hiding the current control completed");

          	console.log("adding slider style");
            addSliderStyle();
            console.log("adding slider style completed");
            console.log("adding slider");
            addSliderDOM(throttleDOM);
          	console.log("adding slider completed");
            
        } catch (error) {
            console.error(error);
        }
    }

    // now the serious stuff
    console.log("monkey script started");

    init();

    console.log("monkey script completed!!!");
})();
