import { version } from '../package.json'
import { get, getRequestReference } from './request-maker'
import { attachInterceptor } from './request-interceptor'
import { error } from './console'

try {
  attachInterceptor()
}catch (e){
  error('failed to run attachInterceptor', e)
}

window.ParallelData = {
  version,
  get,
  getRequestReference
}
