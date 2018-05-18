import { getRequestReference } from './request-maker'
import { error } from './console'
import { assign } from './utils'

export function XHRInterceptor (){
  try {
    const XHRProto = XMLHttpRequest.prototype

    XHRProto.__PDListeners__ = []

    Object.keys(XHRProto).forEach((prop)=>{

      const descriptor = Object.getOwnPropertyDescriptor(XHRProto, prop)

      // Ignore the static fields which have value set already
      if(descriptor.value === undefined){

        // map the existing descriptor while overriding the fields we need
        // Defining a new getter for xhr fields allows us to redirect where
        // values we return come from, allowing in app callbacks to reference
        // the ParallelData xhr values
        Object.defineProperty(XHRProto, prop, assign({}, descriptor, {
          get: function(){
            if(!this.__PDInternal__ && this.__PDRequest__){
              return this.__PDRequest__[prop]
            }
            return descriptor.get.call(this)
          }
        }))
      }
    })

    const originalOpen = XHRProto.open
    XHRProto.open = function(method, url){
      this.__PDOpen__ = {
        method,
        url
      }
      originalOpen.apply(this, arguments)
    }

    const originalAddEventListener = XHRProto.addEventListener
    XHRProto.addEventListener = function(){
      if(!this.__PDInternal__){
        if(this.__PDRequest__){
          // register events directly if request is available
          return this.__PDRequest__.addEventListener.apply(this.__PDRequest__, arguments)
        }else {
          // keep a memory of the register so we can apply them later
          this.__PDListeners__.push({ action: 'add', args: arguments })
        }
      }
      return originalAddEventListener.apply(this, arguments)
    }

    const originalRemoveEventListener = XHRProto.removeEventListener
    XHRProto.removeEventListener = function(){
      if(!this.__PDInternal__){
        if(this.__PDRequest__){
          // register events directly if request is available
          return this.__PDRequest__.removeEventListener.apply(this.__PDRequest__, arguments)
        }else {
          // keep a memory of the register so we can apply them later
          this.__PDListeners__.push({ action: 'remove', args: arguments })
        }
      }
      return originalRemoveEventListener.apply(this, arguments)
    }

    const originalSend = XHRProto.send
    XHRProto.send = function(body){

      const parallelRequest = getRequestReference(this.__PDOpen__, 'xhr')
      const parallelXHR = parallelRequest && parallelRequest.xhrRef

      if(!this.__PDInternal__ && parallelXHR && !parallelXHR.__PDConsumed__){

        // currently we only want to allow ParallelData get req
        parallelXHR.__PDConsumed__ = true

        // execute the next set of controls asynchronously
        // NOTE: all reassignments should happen inside of this
        // async path so that the PD request does not start invoking
        // callbacks before we are ready for everything to start invoking
        ;(window.setImmediate || window.setTimeout)(()=>{
          try {

            // map xhr functions over
            parallelXHR.onreadystatechange = this.onreadystatechange

            // map all event target functions over
            // If the XHR has not finished the request, these event reassignments
            // will be automatically picked up
            const onEventProps = ['onloadstart', 'onprogress', 'onabort', 'onerror', 'onload', 'ontimeout', 'onloadend']

            onEventProps.forEach((prop)=>{
              parallelXHR[prop] = this[prop]
            })

            while(this.__PDListeners__.length){
              const listener = this.__PDListeners__.shift()
              parallelXHR[`${listener.action}EventListener`].apply(parallelXHR, listener.args)
            }

            // access all properties from the original xhr (the current this context)
            // before we assign this property as it is the pivot property in accessors
            this.__PDRequest__ = parallelXHR

            // NOTE: The decision here is that we will not invoke the
            // onreadystatechange function for all states up to where it currently is
            if(parallelXHR.onreadystatechange){
              parallelXHR.onreadystatechange()
            }

            Object.keys(parallelRequest.events).forEach((eventName)=>{
              if(parallelRequest.events[eventName]){
                // dispatchin will fire the "on" events and registered event listeners
                this.dispatchEvent(parallelRequest.events[eventName])
              }
            })
          }catch(e){
            error('transferring events failed', e)
          }
        }, 0)
      }else {
        // empty the watching of new event listeners to not block GC
        this.__PDListeners__ = []
        originalSend.call(this, body)
      }
    }
  }catch (e){
    error('failed to run XHRInterceptor', e)
  }
}

export function fetchInterceptor (){

  try {

    const originalFetch = window.fetch

    if(!originalFetch || !window.Promise){
      // fetch is not available
      return
    }

    window.fetch = function(input, init){

      input = input || {}
      init = init || {}

      let url;
      let method;

      if(typeof input === 'string'){
        url = input
      }else if(input.url) {
        url = input.url
      }

      if(init.method){
        method = init.method
      }else if(input.method){
        method = input.method
      }else {
        method = 'GET'
      }

      const parallelFetch = getRequestReference({method, url}, 'fetch')

      if(!init.__PDFetch__ && parallelFetch){
        return parallelFetch
      }

      return originalFetch.apply(window, arguments)
    }

  }catch (e) {
    error('failed to run fetchInterceptor', e)
  }

}
