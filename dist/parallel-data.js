// ParallelData v1.0.0 by Sean Roberts @DevelopSean
(function () {
  'use strict';

  var version = "1.0.0";

  var LIB = 'ParallelData';

  function error() {
    try {
      var _console2;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      (_console2 = console).error.apply(_console2, [LIB].concat(args));
    } catch (e) {}
  }

  function assign(target, varArgs) {
    if (typeof Object.assign === 'function') {
      return Object.assign.apply(Object, arguments);
    }

    // adapted from Object.assign polyfill:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

    if (target == null) {
      // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) {
        // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  }

  var xhrRequests = {};
  var fetchRequests = {};

  var allRequestsOptions = {};

  var getKey = function getKey(method, url) {
    return method.toUpperCase() + '-' + url;
  };

  var makeXHRRequest = function makeXHRRequest(method, url, headers, responseListener) {

    var key = getKey(method, url);

    // don't allow duplicate fetches for the same url/method combo
    if (xhrRequests[key]) {
      return;
    }

    var xhr = new XMLHttpRequest();

    var storedRequest = xhrRequests[key] = {
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

    // merge in the allRequests headers with the request specific headers
    headers = assign({}, allRequestsOptions.headers, headers || {});

    Object.keys(headers).forEach(function (key) {
      xhr.setRequestHeader(key, headers[key]);
    });

    Object.keys(storedRequest.events).forEach(function (eventName) {
      xhr.addEventListener(eventName, function (event) {
        storedRequest.events[eventName] = event;
      });
    });

    xhr.send();
  };

  var makeFetchRequest = function makeFetchRequest(method, url, options) {
    var key = getKey(method, url);

    // don't allow duplicate fetches for the same url/method combo
    if (fetchRequests[key]) {
      return;
    }

    fetchRequests[key] = fetch(url, assign({}, options, {

      __PDFetch__: true,

      method: method,

      // combine with allRequests configuration
      headers: assign({}, allRequestsOptions.headers, options.headers || {}),

      // forced if not defined
      credentials: options.credentials || 'include',
      redirect: options.redirect || 'follow'
    })).catch(function (e) {
      error('fetch request failed', e);
      throw e;
    });
  };

  function getForXHR(url, options) {
    options = options || {};
    try {
      makeXHRRequest('GET', url, options.headers);
    } catch (e) {
      error('makeXHRRequest failed', e);
    }
  }

  function getForFetch(url, options) {
    options = options || {};
    try {

      if ('fetch' in window && 'Promise' in window) {
        makeFetchRequest('GET', url, options);
      } else {
        // falling back to XHR if it is not supported
        getForXHR(url, options);
      }
    } catch (e) {
      error('fetch request failed', e);
    }
  }

  function getRequestReference(request, type) {
    if (request && request.method && request.url) {
      var key = getKey(request.method, request.url);
      return type === 'xhr' ? xhrRequests[key] : fetchRequests[key];
    }
  }

  function configureAllRequests(options) {
    allRequestsOptions = assign({}, allRequestsOptions, options || {});
  }

  function XHRInterceptor() {
    try {
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
          Object.defineProperty(XHRProto, prop, assign({}, descriptor, {
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

        var parallelRequest = getRequestReference(this.__PDOpen__, 'xhr');
        var parallelXHR = parallelRequest && parallelRequest.xhrRef;

        if (!this.__PDInternal__ && parallelXHR && !parallelXHR.__PDConsumed__) {

          // currently we only want to allow ParallelData get req
          parallelXHR.__PDConsumed__ = true

          // execute the next set of controls asynchronously
          // NOTE: all reassignments should happen inside of this
          // async path so that the PD request does not start invoking
          // callbacks before we are ready for everything to start invoking
          ;(window.setImmediate || window.setTimeout)(function () {
            try {

              // map xhr functions over
              parallelXHR.onreadystatechange = _this.onreadystatechange;

              // map all event target functions over
              // If the XHR has not finished the request, these event reassignments
              // will be automatically picked up
              var onEventProps = ['onloadstart', 'onprogress', 'onabort', 'onerror', 'onload', 'ontimeout', 'onloadend'];

              onEventProps.forEach(function (prop) {
                parallelXHR[prop] = _this[prop];
              });

              while (_this.__PDListeners__.length) {
                var listener = _this.__PDListeners__.shift();
                parallelXHR[listener.action + 'EventListener'].apply(parallelXHR, listener.args);
              }

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
            } catch (e) {
              error('transferring events failed', e);
            }
          }, 0);
        } else {
          // empty the watching of new event listeners to not block GC
          this.__PDListeners__ = [];
          originalSend.call(this, body);
        }
      };
    } catch (e) {
      error('failed to run XHRInterceptor', e);
    }
  }

  function fetchInterceptor() {

    try {

      var originalFetch = window.fetch;

      if (!originalFetch || !window.Promise) {
        // fetch is not available
        return;
      }

      window.fetch = function (input, init) {

        input = input || {};
        init = init || {};

        var url = void 0;
        var method = void 0;

        if (typeof input === 'string') {
          url = input;
        } else if (input.url) {
          url = input.url;
        }

        if (init.method) {
          method = init.method;
        } else if (input.method) {
          method = input.method;
        } else {
          method = 'GET';
        }

        var parallelFetch = getRequestReference({ method: method, url: url }, 'fetch');

        if (!init.__PDFetch__ && parallelFetch) {
          return parallelFetch;
        }

        return originalFetch.apply(window, arguments);
      };
    } catch (e) {
      error('failed to run fetchInterceptor', e);
    }
  }

  XHRInterceptor();
  fetchInterceptor();

  window.ParallelData = {
    version: version,
    getForXHR: getForXHR,
    getForFetch: getForFetch,

    configure: function configure(config) {
      config = config || {};

      if (config.allRequests) {
        configureAllRequests(config.allRequests);
      }
    }
  };

}());
