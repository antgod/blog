const keys = Object.keys
const json2Str = 'stringify'
const drawHandleName = 'render'

const Util = {
  resolve: (string, handle)  => eval(string)[handle](),
  tranlateJSON: (object, type) => JSON[type](object),
  concat: (items, sep) => Array.isArray(items) ? items.join(sep) : items,
}

const { resolve, tranlateJSON, concat } = Util


const Frame = () => {
  const renderModule = (children, funName) => {
    const finalFunArgs = tranlateJSON(children[funName], json2Str)
    return resolve(`${funName}(${finalFunArgs})`, drawHandleName)
  }

  const analyzeDependency = (dependency = {} ) =>
    concat(keys(dependency).map(childrenName => renderModule(dependency, childrenName)), '')

  const render = ({ title, options, dependency }) =>
    `
        <div>标题：${title}-参数：${options}</div>
        ${analyzeDependency(dependency)}
    `

  return {
    render,
  }
}



