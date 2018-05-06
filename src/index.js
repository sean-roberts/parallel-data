import { version } from '../package.json'
import { getForXHR, getRequestReference, configureAllRequests } from './request-maker'
import { attachInterceptor } from './request-interceptor'
import { error } from './console'

attachInterceptor()

window.ParallelData = {
  version,
  getForXHR,
  getRequestReference,

  configure: (config)=>{
    config = config || {}

    if(config.allRequests){
      configureAllRequests(config.allRequests)
    }
  }
}
