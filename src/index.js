import { version } from '../package.json'
import { get, getRequestReference } from './request-maker'
import { attachInterceptor } from './request-interceptor'
import { error } from './console'

attachInterceptor()

window.ParallelData = {
  version,
  get,
  getRequestReference
}
