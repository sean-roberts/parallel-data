// ParallelData v1.0.0 by Sean Roberts @DevelopSean
(function () {
  'use strict';

  var version = "1.0.0";

  var fetchedRequests = {};

  var getKey = function getKey(method, url) {
    return method.toUpperCase() + '-' + url;
  };

  var makeRequest = function makeRequest(method, url, headers, responseListener) {

    var key = getKey(method, url);

    // don't allow duplicate fetches for the same url/method combo
    if (fetchedRequests[key]) {
      return;
    }

    var xhr = new XMLHttpRequest();

    var storedRequest = fetchedRequests[key] = {
      url: url,
      method: method,
      headers: headers,
      xhrRef: xhr,
      events: {
        load: null,
        error: null,
        timeout: null
      }
    };

    xhr.__PDInternal__ = true;

    xhr.open(method, url);

    Object.keys(headers || {}).forEach(function (key) {
      xhr.setRequestHeader(key, headers[key]);
    });

    Object.keys(storedRequest.events).forEach(function (eventName) {
      xhr.addEventListener(eventName, function (event) {
        console.log('Event fired', eventName, event);
        storedRequest.events[eventName] = event;
      });
    });

    xhr.send();
  };

  function get(url, options) {
    options = options || {};
    makeRequest('GET', url, options.headers);
  }

  function getRequestReference(request) {
    var key = getKey(request.method, request.url);
    return fetchedRequests[key];
  }

  function attachInterceptor() {

    var XHRProto = XMLHttpRequest.prototype;

    XHRProto.__PDListeners__ = [];

    Object.keys(XHRProto).forEach(function (prop) {

      var descriptor = Object.getOwnPropertyDescriptor(XHRProto, prop);

      // Ignore the static fields which have value set already
      if (descriptor.value === undefined) {

        // map the existing descriptor while overriding the fields we need
        // Defining a new getter for xhr fields allows us to redirect where
        // values we return come from, allowing in app callbacks to reference
        // the ParallelData xhr values
        Object.defineProperty(XHRProto, prop, Object.assign({}, descriptor, {
          get: function get() {
            if (!this.__PDInternal__ && this.__PDRequest__) {
              return this.__PDRequest__[prop];
            }
            return descriptor.get.call(this);
          }
        }));
      }
    });

    var originalOpen = XHRProto.open;
    XHRProto.open = function (method, url) {
      this.__PDOpen__ = {
        method: method,
        url: url
      };
      originalOpen.apply(this, arguments);
    };

    var originalAddEventListener = XHRProto.addEventListener;
    XHRProto.addEventListener = function () {
      if (!this.__PDInternal__) {
        if (this.__PDRequest__) {
          // register events directly if request is available
          return this.__PDRequest__.addEventListener.apply(this.__PDRequest__, arguments);
        } else {
          // keep a memory of the register so we can apply them later
          this.__PDListeners__.push({ action: 'add', args: arguments });
        }
      }
      return originalAddEventListener.apply(this, arguments);
    };

    var originalRemoveEventListener = XHRProto.removeEventListener;
    XHRProto.removeEventListener = function () {
      if (!this.__PDInternal__) {
        if (this.__PDRequest__) {
          // register events directly if request is available
          return this.__PDRequest__.removeEventListener.apply(this.__PDRequest__, arguments);
        } else {
          // keep a memory of the register so we can apply them later
          this.__PDListeners__.push({ action: 'remove', args: arguments });
        }
      }
      return originalRemoveEventListener.apply(this, arguments);
    };

    var originalSend = XHRProto.send;
    XHRProto.send = function (body) {
      var _this = this;

      var parallelRequest = window.ParallelData.getRequestReference(this.__PDOpen__);
      var parallelXHR = parallelRequest && parallelRequest.xhrRef;

      if (!this.__PDInternal__ && parallelXHR && !parallelXHR.__PDConsumed__) {

        // currently we only want to allow ParallelData get req
        parallelXHR.__PDConsumed__ = true

        // execute the next set of controls asynchronously
        // NOTE: all reassignments should happen inside of this
        // async path so that the PD request does not start invoking
        // callbacks before we are ready for everything to start invoking
        ;(window.setImmediate || window.setTimeout)(function () {

          // map xhr functions over
          parallelXHR.onreadystatechange = _this.onreadystatechange;

          // map all event target functions over
          // If the XHR has not finished the request, these event reassignments
          // will be automatically picked up
          Object.keys(XMLHttpRequestEventTarget.prototype).forEach(function (prop) {
            parallelXHR[prop] = _this[prop];
          });

          _this.__PDListeners__.forEach(function (listener) {
            parallelXHR[listener.action + 'EventListener'].apply(parallelXHR, listener.args);
          });

          // access all properties from the original xhr (the current this context)
          // before we assign this property as it is the pivot property in accessors
          _this.__PDRequest__ = parallelXHR;

          // NOTE: The decision here is that we will not invoke the
          // onreadystatechange function for all states up to where it currently is
          if (parallelXHR.onreadystatechange) {
            parallelXHR.onreadystatechange();
          }

          Object.keys(parallelRequest.events).forEach(function (eventName) {
            if (parallelRequest.events[eventName]) {
              // dispatchin will fire the "on" events and registered event listeners
              _this.dispatchEvent(parallelRequest.events[eventName]);
            }
          });
        }, 0);
      } else {
        originalSend.call(this, body);
      }
    };
  }

  attachInterceptor();

  window.ParallelData = {
    version: version,
    get: get,
    getRequestReference: getRequestReference,
    config: function config(configuration) {}
  };

}());
