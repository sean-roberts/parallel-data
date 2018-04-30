# ParallelData

## The Problem
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


## A Solution
ParallelData gives you a drop in JavaScript snippet that allows you to define the data urls you want to request and it will request them immediately (in parallel with your main JS/CSS downloads). Without changing anything in your app code, your app's next requests for those endpoints will be given the responses as they were received when ParallelData received them. With that your app is now faster and no longer waiting for your app to load, parse, and initialize to start requesting it's data!


### Request/Response Scenarios

- If ParallelData **has received** the endpoint response before your app requests it, your app requests will immediately get the responses.
- If ParallelData **has not received** the endpoint response before your app requests it, your app requests will get the responses when the original ParallelData responses are received.

### Error Scenarios

If a ParallelData request receives a response with a non 2XX or 3XX status code, we consider that to be an error response.

- If an error response is detected before your app requests that endpoint, by default ParallelData will not give that response to your app's request response handler and will allow it to send its request normally. This allows a sort of retry logic and should help catch any misconfigured requesting on ParallelData.
- If an error response is detected after your app requests that endpoint, by default we will take your app's request and send it out. With that, make sure you configure ParallelData correctly for your endpoints to not add latency trying to speed it up.
