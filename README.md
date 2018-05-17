# ParallelData

## The Problem 🐌
When building client heavy apps or single page apps (SPAs), the most common way to structure the load of your application is:

```
-> Request HTML
...
---> Request all CSS
---> Request all Javascript
...
------> JS is ready and executing; app is initializing
-------> Request Required App Data
...
-----------> App Data is all ready, present the full app to the user
```

The requesting of JS and CSS is usually handled in parallel - whoohoo. When that's ready, your app parses and starts executing but you have logic that requires some data to be loaded before it continues to present the full version of the app. That data could be user info/permissions data, app/domain specific data, or any type of data that you require before presenting the final version of your app. But if you look at the flows, we keep the information about fetching the data inside the app code meaning we require the user to wait until the app code is executing, requests the data, and processes the data request before it can continue.

What if we could speed up our app and request the required app data at the same time as when you request the app assets?

## HTTP2 Push 🌟
The HTTP2 Push capabilities are 100% targeted at solving these problems and that's awesome. But for some, using HTTP2 is not a available or a practical option - that's where ParallelData comes in.

## A Solution ⚡️
ParallelData gives you a drop in JavaScript snippet that allows you to define the data urls you want to request and it will request them immediately (in parallel with your main JS/CSS downloads). Without changing anything in your app code, your app's next requests for those endpoints will be given the responses as they were received when ParallelData received them. With that your app is now faster and no longer waiting for your app to load, parse, and initialize to start requesting it's data!

### Note 🗒
The scope of ParallelData is limited to loading data in parallel. For prefetching/preloading assets (css, js, images, etc.) I would look into resource hints/prioritization: [spec](https://www.w3.org/TR/resource-hints/) and [web fundamentals](https://developers.google.com/web/fundamentals/performance/resource-prioritization)

### Request/Response Scenarios 🔄

- If ParallelData **has received** the endpoint response before your app requests it, your app requests will immediately get the responses and respective events.
- If ParallelData **has not received** the endpoint response before your app requests it, your app requests will get the responses and respective events when the original ParallelData responses are received.

## Networking Options Support ✅
- [x] XHR support (GET requests only)
- [x] Sending Headers (per request or for all requests)
- [x] Fetch support (GET requests only)

_Please create an issue if there are more use-cases that make sense for ParallelData to support_

---------

## How To Use 👍🏻

- Pick the version you want to use on your site from the [dist directory](/dist/)
- Copy that version's code into your HTML file for your app
- Below that, start using the `ParallelData` API



## The API ⚒

### `ParallelData.getForXHR( url, options )`
This method immediately kicks off a GET request to the specified URL with the provided options. Note, **this only matches requests that are `XMLHttpRequest` based**.

**Function Parameters**
- `url` - the url to load in parallel. This must **exactly** match the url used when requesting data in the app
- `options` - an object specifying request configuration
  - `options.headers` - an object specifying the request headers to be added


### `ParallelData.getForFetch( url, options )`
This method immediately kicks off a GET request to the specified URL with the provided options. Note, **this only matches requests that are `window.fetch` based**. By using this function, we assume that your app uses `window.fetch` if it is available and falls back to `XMLHttpRequest` for requests if it is not. With that, ParallelData will do the same. If you use this function and `window.fetch` is not available, we will automatically fallback to calling `ParallelData.getForXHR` internally for you.

**Function Parameters**
- `url` - the url to load in parallel. This must **exactly** match the url used when requesting data in the app.
- `options` - an object specifying request configuration. We allow the full set of options that `window.fetch` allows.
  - Note, `options.credentials` is set to `"include"` by default and `options.redirect` is set to `"follow"` by default


### `ParallelData.configure( configOptions )`
This method immediately kicks off a GET request to the specified URL with the provided options.

**Function Parameters**
- `configOptions` - an object specifying configuration for ParallelData
  - `configOptions.allRequests` - an object specifying options to be applied to all requests
    - `configOptions.allRequests.headers` - an object specifying the headers to be added to all requests

-------

## Running examples 🏃

*Web*
- Visit [https://parallel-data.now.sh/examples/xhr.html](https://parallel-data.now.sh/examples/xhr.html) or [https://parallel-data.now.sh/examples/fetch.html](https://parallel-data.now.sh/examples/fetch.html)

*Locally*
- Clone this repo locally
- Run `npm run examples`
- Visit [http://localhost:8080/examples/xhr.html](http://localhost:8080/examples/xhr.html) or [http://localhost:8080/examples/fetch.html](http://localhost:8080/examples/fetch.html)

## Building library locally 🔨
- Clone this repo locally
- Build options:
  - Run `npm run dev` to watch files and perform a build
  - Run `npm run build` to run a single build
- Run examples locally to have quick access to sites that are running the built library

## Testing library 🔍
The tests for this library are interactive visual tests. This was decided because I did not want any testing framework to override anything in an non-browser fashion causing the results of the tests to hide something.

*Web*
- Visit [https://parallel-data.now.sh/examples/interactive-tests/](https://parallel-data.now.sh/examples/interactive-tests/)

*Locally*
- Clone this repo locally
- Run `npm run examples`
- Visit [http://localhost:8080/examples/interactive-tests/](http://localhost:8080/examples/interactive-tests/)
- You should expect to find everything green
