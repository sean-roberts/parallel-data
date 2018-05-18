var URL1 = 'https://jsonplaceholder.typicode.com/users/1'
var URL2 = 'https://jsonplaceholder.typicode.com/posts'

var originalSend = XMLHttpRequest.prototype.send
var sendCounts = 0
XMLHttpRequest.prototype.send = function(body){
  sendCounts++
  originalSend.call(this, body)
}

var originalFetch = window.fetch
var fetchCounts = 0
if(originalFetch){
  window.fetch = function(){
    fetchCounts++
    return originalFetch.apply(this, arguments)
  }
}


function pass(testClass){
  var el = document.querySelector('.test.' + testClass)
  if(!el.classList.contains('fail')){
    el.classList.add('pass')
  }
}
function fail(testClass){
  document.querySelector('.test.' + testClass).classList.add('fail')
}

function getRequiredDataXHR(url, options){

  var x = new XMLHttpRequest()

  x.open('GET', url)

  x.onreadystatechange = options.onReadyStateChange || null
  x.onload = options.onLoad || null

  if(options.loadEventListener){
    x.addEventListener('load', options.loadEventListener)
  }
  if(options.errorEventListener){
    x.addEventListener('error', options.errorEventListener)
  }

  const testListener = function(e){
    throw 'A load event listener was never removed - this is broken'
    alert('A load event listener was never removed - this is broken')
  }

  x.addEventListener('load', testListener)
  x.removeEventListener('load', testListener)

  x.send()

  return x
}


window.TestApp = {};
window.TestApp.runXHRTests = function(testOptions){
  var runTest = function(url, loadCb, initialReadyState){
    // This scenario mimics: we need the user, then get the user's posts
    // Though, there are better ways to structure this scenario in your app
    // but these waterfall dependencies happen for a lot of interdependent requests

    var allEventsFired = []
    var eventFired = function(eventType){
      allEventsFired.push(eventType)

      if(allEventsFired.length === 3){
        pass('all-events-fired')
      }
    }

    var verifyLoadProperties = function(thisRef, xhrRef){
      var props = ['readyState', 'responseText', 'responseType', 'status'];
      var failure = false;
      for(var i = 0; i < props.length; i++){
        var prop = props[i];
        var thisPropVal = thisRef[ prop ];
        var xhrPropVal = xhrRef[ prop ];

        if(thisPropVal !== xhrPropVal){
          fail('correct-properties')
          console.error('thisRef ' + prop + ' is not the same as xhrRef ' + prop, thisPropVal, xhrPropVal)
          failure = true;
          return;
        }
      }

      if(!failure){
        pass('correct-properties')
      }
    }

    var verifyNetworkCalls = function(){
      if(sendCounts === 2){
        pass('num-requests')
      }else if(sendCounts > 0) {
        fail('num-requests')
        console.error('Send counts are wrong', sendCounts)
        return
      }
    }

    var xhrStatus
    var xhr = getRequiredDataXHR(url, {

      onReadyStateChange: function(){
        if(xhrStatus === undefined){

          xhrStatus = this.readyState

          if(initialReadyState !== undefined){

            // we expect this to run well before we get a response so we want to assert we are getting
            // all of the readyState sequencing
            if(this.readyState !== initialReadyState){
              fail('correct-properties')
              console.error('The onreadystatechange\'s intial readyState for immediate is wrong', initialReadyState, this.readyState)
              return
            }
          }
        }else if(this.readyState !== xhrStatus && this.readyState !== ++xhrStatus){
          fail('all-events-fired')
          console.error('The transition for onreadystatechange\'s readyState was not sequentially called', this.readyState, xhrStatus)
          return
        }

        if(xhr.readyState !== this.readyState){
          fail('correct-properties')
          console.error('The onreadystatechange\'s access readyState was not sequentially called')
          return
        }

        if(this.readyState === this.DONE){
          eventFired('onreadystatechange')
          verifyLoadProperties(this, xhr)
          verifyNetworkCalls()
        }
      },

      onLoad: function(){
        eventFired('onload')

        verifyLoadProperties(this, xhr)
        verifyNetworkCalls()

        if(loadCb){
          loadCb()
        }
      },

      loadEventListener: function(){
        eventFired('loadEventListener')
        verifyLoadProperties(this, xhr)
        verifyNetworkCalls()
      }
    })
  }

  testOptions = testOptions || {}

  if(testOptions.delay){
    setTimeout(function(){
      runTest(URL1, function(){
        runTest(URL2)
      })
    }, testOptions.delay)
  }else {
    runTest(URL1, function(){
      runTest(URL2)
    }, /*initialReadyState*/ XMLHttpRequest.prototype.OPENED)
  }
}


window.TestApp.runFetchTests = function(testOptions){

  const checkData = function(data){
    if( !data || typeof data !== 'object' ){
      fail('data-resolved')
      console.error('fetch data resolve failure', data)
    }
  }

  var verifyNetworkCalls = function(){
    if(fetchCounts === 2){
      pass('num-requests')
    }else if(fetchCounts > 0) {
      fail('num-requests')
      console.error('Send counts are wrong', sendCounts)
      return
    }
  }

  var runTest = function(){
    fetch(URL1).then( function(r){
      return r.json()
    }).then( function(responseData){
      checkData(responseData)
      return fetch( new Request(URL2) )
    }).then( function(r){
      return r.json()
    }).then( function(responseData){
      checkData(responseData)
      verifyNetworkCalls()
      pass('data-resolved')
    }).catch( function(e){
      fail('data-resolved')
      console.error('fetch error caught', e)
    })
  }

  testOptions = testOptions || {}

  if(testOptions.delay){
    setTimeout(runTest, testOptions.delay)
  }else {
    runTest()
  }
}
