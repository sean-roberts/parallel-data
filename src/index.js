import { version } from '../package.json'
import { getForXHR, getForFetch, configureAllRequests } from './request-maker'
import { XHRInterceptor, fetchInterceptor } from './request-interceptor'
import { error } from './console'


window.ParallelData = {
  version,

  configure: (config) => {
    config = config || {}

    if (config.allRequests) {
      configureAllRequests(config.allRequests)
    }
  }
}

if(INCLUDE_XHR){
  window.ParallelData.getForXHR = getForXHR
  XHRInterceptor()
}
if(INCLUDE_FETCH){
  window.ParallelData.getForFetch = getForFetch;
  fetchInterceptor()
}