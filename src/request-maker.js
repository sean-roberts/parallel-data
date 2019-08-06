import { error } from './console'
import { assign } from './utils'

let xhrRequests = {}
let fetchRequests = {}

let allRequestsOptions = {}

const getKey = (method, url)=>{
  return `${method.toUpperCase()}-${url}`
}

const makeXHRRequest = (method, url, headers, options )=>{

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
  headers = assign({}, allRequestsOptions.headers, headers || {})

  Object.keys(headers).forEach((key)=>{
    xhr.setRequestHeader(key, headers[key])
  })


  if (options && options.onParallelDataResponse) {
    console.log('set');
    xhr.addEventListener('readystatechange', () => {
      console.log('internal', xhr.readyState);
      if (xhr.readyState === 4) {
        options.onParallelDataResponse(xhr, {
          transferredToApp: !!xhr.__PDConsumed__
        })
      }
    })
  }

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

  const fetchSent = fetchRequests[key] = fetch(url, assign({}, options, {

    __PDFetch__: true,

    method,

    // combine with allRequests configuration
    headers: assign({}, allRequestsOptions.headers, options.headers || {}),

    // forced if not defined
    credentials: options.credentials || 'include',
    redirect: options.redirect || 'follow'
  })).then( response => {
    if (options && options.onParallelDataResponse) {
      options.onParallelDataResponse(response, {
        transferredToApp: !!fetchSent.__PDConsumed__
      })
    }
    return response
  }).catch((e)=>{
    error('fetch request failed', e);
    throw e
  })
}


export function getForXHR (url, options){
  options = options || {}
  try {
    makeXHRRequest('GET', url, options.headers, options)
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
  allRequestsOptions = assign({}, allRequestsOptions, options || {})
}
