import { version } from '../package.json'
import { get, getRequestReference, configureAllRequests } from './request-maker'
import { attachInterceptor } from './request-interceptor'
import { error } from './console'

attachInterceptor()

window.ParallelData = {
  version,
  get,
  getRequestReference,

  configure: (config)=>{
    config = config || {}

    if(config.allRequests){
      configureAllRequests(config.allRequests)
    }
  }
}
