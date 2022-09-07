// ==UserScript==
// @name		deepracer-throttle-slider
// @namespace	https://gitlab.aws.dev/aws-sa-global-auto/deepracer-throttle-slider
// @version		0.1
// @description	Alter the DeepRacer Throttle Control to a Slider
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
        console.log("throttle : " + throttle);
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

    // using HTML observer we can detect change in the document
    // as most content is dynamically generated, we need to use observer as the document will complete its load
    // before the control to be changed are added
    function observerFunc(mutations, observer) {
        console.log(" observerFunc ==> MutationObserver childList change script started");
        for(var i=0; i<mutations.length; ++i) {
            if( mutations[i].type === "childList" && mutations[i].addedNodes.length > 0){
                for(var j = 0; j < mutations[i].addedNodes.length; j++) {
                    const element = mutations[i].addedNodes[j];

                    const rangeSelector = element.querySelector('.awsui-util-pt-s');
                    if(!rangeSelector) {
                        observer.disconnect();
                        return;
                    }

                    const throttleDOM = rangeSelector.parentElement;

                    for(var x = 0; x < throttleDOM.childNodes.length; x++) {
                        throttleDOM.childNodes[x].style.display = 'none';
                    }

                    addSliderStyle();
                    addSliderDOM(throttleDOM);
                }
            }
        }
        console.log(" observerFunc ==> MutationObserver childList change script completed");
    }

    function init() {
        const observer = new MutationObserver(observerFunc);

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

        // now the serious stuff: observe the DOM!
        observer.observe(observerElement, {childList : true});
    }

    // now the serious stuff
    console.log("monkey script started");

    init();

    console.log("monkey script completed");

})();
