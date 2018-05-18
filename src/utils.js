export function assign(target, varArgs){
  if(typeof Object.assign === 'function'){
    return Object.assign.apply(Object, arguments)
  }

  // adapted from Object.assign polyfill:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

  if (target == null) { // TypeError if undefined or null
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) { // Skip over if undefined or null
      for (let nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}
