const LIB = 'ParallelData'

export function log (...args){
  try{
    console.log(LIB, ...args)
  }catch(e){}
}

export function error (...args){
  try{
    console.error(LIB, ...args)
  }catch(e){}
}
