const render = Frame().render

const dispatchOptions = options => ({ render: () => render(options) })

const Menu = dispatchOptions
const Store = dispatchOptions
const Layout = dispatchOptions
const Ide = dispatchOptions

// 声明式
const options = {
  title: 'ide',
  options: 'ide options',
  dependency: {
    Layout: {
      title: 'layout',
      options: 'layout options',
      dependency: {
        Menu: {
          title: 'menus',
          options: 'menus options',
        }
      },
    },
    Store: {
      title: 'store',
      options: 'store options',
    },
  },
}