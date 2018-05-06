import { error } from './console'

export function attachInterceptor (){

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
      Object.defineProperty(XHRProto, prop, Object.assign({}, descriptor, {
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

    const parallelRequest = window.ParallelData.getRequestReference(this.__PDOpen__)
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
          Object.keys(XMLHttpRequestEventTarget.prototype).forEach((prop)=>{
            parallelXHR[prop] = this[prop]
          })

          this.__PDListeners__.forEach((listener)=>{
            parallelXHR[`${listener.action}EventListener`].apply(parallelXHR, listener.args)
          })

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
      originalSend.call(this, body)
    }
  }
}