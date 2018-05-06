import { error } from './console'

const fetchedRequests = {};

const getKey = (method, url)=>{
  return `${method.toUpperCase()}-${url}`
}

const makeRequest = (method, url, headers, responseListener)=>{

  const key = getKey(method, url)

  // don't allow duplicate fetches for the same url/method combo
  if(fetchedRequests[key]){
    return;
  }

  const xhr = new XMLHttpRequest()

  const storedRequest = fetchedRequests[key] = {
    url,
    method,
    headers,
    xhrRef: xhr,
    events: {
      load: null,
      error: null,
      timeout: null
    }
  }

  xhr.__PDInternal__ = true

  xhr.open(method, url)

  Object.keys(headers || {}).forEach((key)=>{
    xhr.setRequestHeader(key, headers[key])
  })

  Object.keys(storedRequest.events).forEach((eventName)=>{
    xhr.addEventListener(eventName, (event) => {
      storedRequest.events[eventName] = event
    })
  })

  xhr.send()
}

export function get (url, options){
  options = options || {}
  try {
    makeRequest('GET', url, options.headers)
  }catch(e){
    error('could not makeRequest', e)
  }
}

export function getRequestReference (request){
  const key = getKey(request.method, request.url)
  return fetchedRequests[key]
}