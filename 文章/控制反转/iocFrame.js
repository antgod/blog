const { assign, keys } = Object
const dependencyField = 'dependency'

const iocFrame = (options, modules) => {
  const { dependency } = options

  const concat = (items, sep) => Array.isArray(items) ? items.join(sep) : items

  // 依赖汇总
  const collectDependency = (depend, modules) => {
    if (!depend || !keys(depend).length) return []
    return keys(depend).map((moduleId) => {
      const { dependency, render } = modules[moduleId]()
      return assign(depend[moduleId], { render, dependency: collectDependency(dependency, modules) })
    })
  }
  const dependencyTree = collectDependency(dependency, modules)

  // 分析依赖
  const analyzeDependency = (options, childrenName) => {
    if (Array.isArray(options[childrenName])) {
      const renderArgs = concat(options[childrenName].map((child, index) =>
        analyzeDependency(child, childrenName)), '')
      return options.render(options, renderArgs)
    }
    return options.render(options)
  }

  return {
    render: () => analyzeDependency(dependencyTree[0], dependencyField),
  }
}


