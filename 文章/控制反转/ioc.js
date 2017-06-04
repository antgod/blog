const render = ({ title, options }, children) =>
  `
    <div>标题：${title}-参数：${options}</div>
    ${children}
  `

const Menu = () => {
  return {
    dependency: {},
    render,
  }
}

const Store = () => {
  return {
    dependency: {},
    render,
  }
}

const Layout = () => {
  return {
    dependency: {
      Menu: {
        title: 'menus',
        options: 'menus options',
      }
    },
    render,
  }
}

const Ide = () => {
  return {
    dependency: {
      Layout: {
        title: 'layout',
        options: 'layout options',
      },
      Store: {
        title: 'store',
        options: 'store options',
      },
    },
    render,
  }
}

const options = {
  dependency: {
    Ide: {
      title: 'ide',
      options: 'ide options',
    },
  },
}

const frame = iocFrame(options, { Ide, Layout, Store, Menu } )

