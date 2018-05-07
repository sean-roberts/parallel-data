import { version } from '../package.json'
import { getForXHR, getForFetch, configureAllRequests } from './request-maker'
import { XHRInterceptor, fetchInterceptor } from './request-interceptor'
import { error } from './console'

XHRInterceptor()
fetchInterceptor()

window.ParallelData = {
  version,
  getForXHR,
  getForFetch,

  configure: (config)=>{
    config = config || {}

    if(config.allRequests){
      configureAllRequests(config.allRequests)
    }
  }
}
