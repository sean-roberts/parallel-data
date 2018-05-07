import { getForXHR, getRequestReference, configureAllRequests } from '../src/request-maker'
import { XHRInterceptor } from '../src/request-interceptor'

describe('ParallelData.getForXHR', ()=>{

  const userUrl = 'https://jsonplaceholder.typicode.com/users/1'

  const XHR = (url, beforeSend, onLoad)=>{
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.addEventListener('load', onLoad || function (){})
    beforeSend && beforeSend(xhr)
    xhr.send()
  }

  test('parallel loading a request that returns after the app requests it', (done)=>{

    const XHRProto = XMLHttpRequest.prototype
    jest.spyOn(XHRProto, 'send')
    const sendSpy = XHRProto.send

    // start intercepting XHR requests
    XHRInterceptor()

    getForXHR(userUrl)

    XHR(userUrl, null, function(){
      expect(this.readyState).toEqual(4)
      expect(sendSpy.mock.calls).toHaveLength(1)

      // send another and make sure we get through to the network as expected
      XHR(userUrl, null, function(){
        expect(this.readyState).toEqual(4)
        expect(sendSpy.mock.calls).toHaveLength(2)
        done()
      })
    })
  })

  test('parallel loading a request that returns before the app requests it', (done)=>{

    const XHRProto = XMLHttpRequest.prototype
    jest.spyOn(XHRProto, 'send')
    const sendSpy = XHRProto.send

    // start intercepting XHR requests
    XHRInterceptor()

    getForXHR(userUrl)

    setTimeout(()=>{
      XHR(userUrl, null, function(){
        expect(this.readyState).toEqual(4)
        expect(sendSpy.mock.calls).toHaveLength(1)

        // send another and make sure we get through to the network as expected
        XHR(userUrl, null, function(){
          expect(this.readyState).toEqual(4)
          expect(sendSpy.mock.calls).toHaveLength(2)
          done()
        })
      })
    }, 300)
  })

  // these are all manually verified but need automtated tests
  test.skip('test onreadystatechange')
  test.skip('test error listeners')

})
