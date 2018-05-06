import { version } from '../package.json'
import { get, getRequestReference } from './request-maker'
import { attachInterceptor } from './request-interceptor'

attachInterceptor()

window.ParallelData = {
  version,
  get,
  getRequestReference,
  config: (configuration)=>{

  }
}
