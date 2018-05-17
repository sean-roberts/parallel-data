import { error } from './console'

let xhrRequests = {}
let fetchRequests = {}

let allRequestsOptions = {}

const getKey = (method, url)=>{
  return `${method.toUpperCase()}-${url}`
}

const makeXHRRequest = (method, url, headers, responseListener)=>{

  const key = getKey(method, url)

  // don't allow duplicate fetches for the same url/method combo
  if(xhrRequests[key]){
    return;
  }

  const xhr = new XMLHttpRequest()

  const storedRequest = xhrRequests[key] = {
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

  // merge in the allRequests headers with the request specific headers
  headers = Object.assign({}, allRequestsOptions.headers, headers || {})

  Object.keys(headers).forEach((key)=>{
    xhr.setRequestHeader(key, headers[key])
  })

  Object.keys(storedRequest.events).forEach((eventName)=>{
    xhr.addEventListener(eventName, (event) => {
      storedRequest.events[eventName] = event
    })
  })

  xhr.send()
}

const makeFetchRequest = (method, url, options) => {
  const key = getKey(method, url)

  // don't allow duplicate fetches for the same url/method combo
  if(fetchRequests[key]){
    return;
  }

  fetchRequests[key] = fetch(url, Object.assign({}, options, {

    __PDFetch__: true,

    method,

    // combine with allRequests configuration
    headers: Object.assign({}, allRequestsOptions.headers, options.headers || {}),

    // forced if not defined
    credentials: options.credentials || 'include',
    redirect: options.redirect || 'follow'
  })).catch((e)=>{
    error('fetch request failed', e);
    throw e
  })
}


export function getForXHR (url, options){
  options = options || {}
  try {
    makeXHRRequest('GET', url, options.headers)
  }catch(e){
    error('makeXHRRequest failed', e)
  }
}

export function getForFetch (url, options){
  options = options || {}
  try {

    if('fetch' in window && 'Promise' in window){
      makeFetchRequest('GET', url, options)
    }else {
      // falling back to XHR if it is not supported
      getForXHR(url, options)
    }
  }catch(e){
    error('fetch request failed', e)
  }
}

export function getRequestReference (request, type){
  if(request && request.method && request.url){
    const key = getKey(request.method, request.url)
    return type === 'xhr' ? xhrRequests[key] : fetchRequests[key]
  }
}

export function configureAllRequests (options){
  allRequestsOptions = Object.assign({}, allRequestsOptions, options || {})
}
