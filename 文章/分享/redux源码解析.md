# redux
用了两天时间，把redux（3.6.0）和react-redux（4.4.5）源码注释了一遍。注释文件分别在[redux-doc][1]与[react-redux-doc][2]中。

redux源码很简单，react-redux有些复杂，但只要花点心思仔细阅读，你会发现，还是那么难懂。

废话不多说，这篇文章详解redux源码。看源码之前一定要熟读KPI，不用倒背如流但一定要清楚不同传参形式与柯里化调用（其实看源码之前看一遍API就行了）。

## 核心概念

redux的核心思想来自于flux，可以说flux是规范，而state是实现。flux 的提出主要是针对现有前端 MVC 框架的局限总结出来的一套基于 dispatcher 的前端应用架构模式。如果用 MVC 的命名习惯，它应该叫 ADSV（Action Dispatcher Store View）。正如其名，Flux 的核心思想就是数据和逻辑永远单向流动。

redux 参考了 flux 的设计，但是对 flux 许多冗余的部分（如 dispatcher）做了简化，同时将函数式编程的思想融合其中。
<img src='../img/redux.png' />

* state: 通过store.getState函数返回，当前store的数据状态。
* store: 通过createStore函数创建,又包含了下面4个核心方法。
    * getState()：获取 store 中当前的状态。
    * dispatch(action)：分发一个 action，并返回这个action，这是唯一能改变 store 中数据的方式。
    * subscribe(listener)：注册一个监听者，它在 store 发生变化时被调用。
    * replaceReducer(nextReducer)：更新当前 store 里的 reducer，一般只会在开发模式中调用该方法。
* reducer: reducer是一个处理函数，用来处理每个动作的函数集合。
* action: action 是一个普通的 JavaScript 对象，一般包含 type、payload 等字段，用于描述一个事件以及需要改变的相关数据。
* middleware: 它提供了一个分类处理 action 的机会。在 middleware 中，你可以检阅每一个流过的 action，挑选出特定类型的 action 进行相应操作，给你一次改变 action 的机会。

## createStore
createStore函数用来创建store，而store是redux的核心，几乎redux所有概念都跟store有关。

首先我们看看createStore的函数签名：
```
function createStore(reducer, preloadedState, enhancer) {
  // ...
}
```

我们在使用createStore时候，通常只传递reducer，剩下的两个参数是3.1.0以后才加入的。preloadedState是初始化state值。enhancer是上文提到的middleware，这个思想来自于koa-middleware。

我们看看接下来是如何工作的
```
  // 如果初始化传入的是函数并且没有传入中间件，则初始化函数设为中间件
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
```

这种接口设计模式类似于jquery，即不定向函数签名。

接下来声明了一些列变量
```
  // currentState: 当前数据
  var currentReducer = reducer                      // 当前reducer
  var currentState = preloadedState                 // 初始化状态
  var currentListeners = []                         // 当前订阅的事件
  var nextListeners = currentListeners              // 下次订阅的事件
  var isDispatching = false                         // 是否正在分配事件
```
这里为什么要区分当前订阅事件与下次订阅事件呢？后面我们会给出答案

```
  /* 获得当前store的所有数据 */
  function getState() {
    return currentState
  }

  /* 订阅函数 */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.')
    }

    var isSubscribed = true

    ensureCanMutateNextListeners()
    // 更新下次订阅函数，每次发布时候，执行订阅函数
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      var index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }
```
getState没什么好说的。订阅函数也很清楚明了，订阅一系列要执行的方法，返回一个函数，再次执行取消订阅。这与原生js的设计完全不同。原生js的removeEventListener需要指定原绑定函数。

ensureCanMutateNextListeners函数会把当前订阅的函数拷贝给下次订阅的函数，为什么这么做，带上刚才的问题，一会再讲（现在真的没法讲，讲了你也听不懂。）

下面是store中最重要的的函数dispatch，整个redux的数据变化都是靠它完成，包括一部分界面render，我们看下dispatch的源码
```
  /* 发布函数 */
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      )
    }

    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    // 执行当前reducer,当前reducer可以被replace掉
    try {
      // 执行的过程中，记录状态，如果执行的过程中再执行，会报错
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // 每次发布时候，更新当前订阅函数。发布的时候再订阅，会把下次订阅的函数从当前函数拷贝一份，防止当前执行发布函数受影响
    var listeners = currentListeners = nextListeners

    // 依次执行每个订阅函数
    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i]
      listener()
    }

    return action
  }
```
我们可以清晰的看到这里把当前的状态和action传递给reducer，并且把返回结果重新赋值给currentState。用isDispatching来控制执行发布中不能再次发布。

这里解释一下刚才的疑问，为什么每次订阅时候都放在nextListeners中。

**发布的过程中，会依次执行所有订阅函数，如果发布的过程中再次订阅，那么当前发布时所执行的订阅数组也会有影响。**

**redux如何解决这个问题呢？所以每次发布过程中，拿到的是订阅的一个副本（currentListeners=nextListeners），而再次订阅（或者取消订阅）时，会拿这个副本拷贝给订阅的函数（ nextListeners = currentListeners.slice()。也就是之前说过的ensureCanMutateNextListeners函数。）**

接下来替换掉reducer函数。源码清晰可见，不做过多解释。
```
  // 替换掉当前 reducer
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    // 替换后，重新执行init函数
    dispatch({ type: ActionTypes.INIT })
  }
```
最后是 observable 函数，配合其他库使用。
```
  function observable() {
    // subscribe 就是上面的那个 subscribe订阅函数
    var outerSubscribe = subscribe
    return {
      subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          // 调用 observer 的 next 方法，获取当前 state。
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        // 将 observeState 当作一个 listener，dispatch 之后自动调用 observer 的 next 方法。
        var unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }
```
observable 是为了配合 Rxjs 这样 observable/reactive 库，不久的将来 EMCAScript 可能会支持原生的 observable/reactive 对象。[tc39/proposal-observable][3]

最后执行一下初始化
```
dispatch({ type: ActionTypes.INIT })
```

## bindActionCreateors
这个函数可以把dispatch(action)动作直接作为属性传递给react组件，而不用在组件内部再次dispatch(action),这么做的好处是做到react与redux完全分离，组件内部无感知redux的存在。

拿todo list举例：
```
// actions.js
function addTodo(text) {
  return {
    type: 'ADD_TODO',
    text
  }
}

function removeTodo(id) {
  return {
    type: 'REMOVE_TODO',
    id
  }
}

const actions = { addTodo, removeTodo }

// App.js
class App extends Component {
  render() {
    const { visibleTodos, visibilityFilter, actions } = this.props
    return (
      <div>
        <AddTodo
          onAddClick={text =>
            actions.addTodo(text)
          }/>
        <TodoList
          todos={visibleTodos}
          onTodoClick={index =>
            actions.completeTodo(index)
          }/>
        <Footer
          filter={visibilityFilter}
          onFilterChange={nextFilter =>
            actions.setVisibilityFilter(nextFilter)
          }/>
      </div>
    )
  }
}

function mapDispatchToProps(dispatch, a) {
  return { actions: bindActionCreators(actions, dispatch) }
}

const FinalApp = connect(select, mapDispatchToProps)(App)

ReactDOM.render(
  <Provider store={createStore(reducer)}>
    <FinalApp />
  </Provider>,
  document.getElementById('app')
)
```
这样就可以把dispatch包装后的actions直接传递给app，而app内部无需再diapatch(action)

源码实现也非常简单
```
function bindActionCreator(actionCreator, dispatch) {
  // 包装一层dispatch，返回高阶函数，因为原来的actionCreator是可以传递参数的函数，包装后不能破坏原结构
  return (...args) => dispatch(actionCreator(...args))
}

export default function bindActionCreators(actionCreators, dispatch) {
  // 拿到 actionName: addTodo removeTodo
  var keys = Object.keys(actionCreators)
  var boundActionCreators = {}
  for (var i = 0; i < keys.length; i++) {
    // 第一次执行key = addTodo(string)
    var key = keys[i]
    // actionCreator = addTodo(function)
    var actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      // 包装函数：在原函数上增加dispatch包装。
      // 我们直接把经过dispatch包装过函数传递给子组件，而不是让子组件拿到传递过去dispatch再去执行，这样子组件只通过传递过去的函数调用即可，完全不知道有redux的存在
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
```

### combineReducers
这个函数有两个用途

* 把多个reducers合并成一个，既做到reducer解构
* 按照解构的名称，把不同的数据分发到不同的state键下。

举例来说，我们有两个reducer，现在要合成一个。
```
function r1(state, action) {}
function r2(state, action) {}

const reducer = combineReducers({
  r1,
  r2
})
```
这样store就有两个键：r1和r2，分别存储每个reducer的返回结果。
也就是说，使用combineReducers把全局store按命名空间进行隔离。隔离的方式就是reducer的名字： { r1: state, r2: state }。

combineReducers实现有些繁琐，不过也不难。
```
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers)
  // 内部创建保存reducers的变量
  var finalReducers = {}

  // 保存reducer到finalReducers中，也做了数据过滤
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i]

    if (NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  // 获得所有key, 也就是[ 'r1', 'r2' ]
  var finalReducerKeys = Object.keys(finalReducers)

  if (NODE_ENV !== 'production') {
    var unexpectedKeyCache = {}
  }

  // 检验每个reducer是否有返回值
  var sanityError
  try {
    assertReducerSanity(finalReducers)
  } catch (e) {
    sanityError = e
  }

  return function combination(state = {}, action) {
    if (sanityError) {
      throw sanityError
    }

    if (NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache)
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    var hasChanged = false
    var nextState = {}
    for (var i = 0; i < finalReducerKeys.length; i++) {
      // 每个reducer的key, r1
      var key = finalReducerKeys[i]
      // 每个reducer的值, r1函数
      var reducer = finalReducers[key]
      // key的上一次状态，也就是state['r1']
      var previousStateForKey = state[key]
      // 执行每个reducer，把上一次的状态和action传入，返回一个新的状态
      var nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // 下次的状态更新
      nextState[key] = nextStateForKey
      // 判断是否变化
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 如果有变化，返回变化后的状态
    return hasChanged ? nextState : state
  }
}
```
看注释并不难理解，在dispatch时候，依次执行每个reducer，因为每个reducer都可以对action.type做处理。取得上次的状态值，执行reducer并且更新数据。

以上就是对redux所有源代码进行的分析，接下来，我们看看react-redux是如何玩耍的。

# react-redux
本文所有文件位于[react-redux-doc][4]中。

之前说过，react-redux有些复杂，其实react-redux只有两个核心概念，Provider和connect。Provider的源码不是傻子都能轻松阅读（不严谨，别较真~），唯一有点难度的，就是connect了。

## Provider

provider用来给react组件提供数据，数据放在context中的store键。源码非常简单。

```
function createProvider(storeKey = 'store', subKey) {
    const subscriptionKey = subKey || `${storeKey}Subscription`

    class Provider extends Component {
        // getChildContext: 将store传递给子孙component
        getChildContext() {
          return { [storeKey]: this[storeKey], [subscriptionKey]: null }
        }

        // 拿到传入的store直接挂在到当前store上
        constructor(props, context) {
          super(props, context)
          this[storeKey] = props.store;
        }

        render() {
          return Children.only(this.props.children)
        }
    }

    if (process.env.NODE_ENV !== 'production') {
      Provider.prototype.componentWillReceiveProps = function (nextProps) {
        // 如果store有改变，则发出警告
        if (this[storeKey] !== nextProps.store) {
          warnAboutReceivingStore()
        }
      }
    }

    Provider.propTypes = {
        store: storeShape.isRequired,
        children: PropTypes.element.isRequired,
    }
    Provider.childContextTypes = {
        [storeKey]: storeShape.isRequired,
        [subscriptionKey]: subscriptionShape,
    }
    Provider.displayName = 'Provider'

    return Provider
}
```
我们看到，仅仅是把传入的store放在this[storeKey]，又在getChildContext中把这个store返回给子组件而已。这里为了可扩展，storeKey当成参数（默认值store）传递进去。此外，子组件还能在context中获得另外一个值：key = storeSubscription ，值为null的属性。目前并没有什么卵用。

另外，每次改变store属性时候，都会报出一个警告。第二次改变时候不会警告，直接退出。也就是说Provider不支持动态修改store。

## connect
connect通过传入mapStateToProps, mapDispatchToProps，mergeProps, options。动态计算出应该传递给react组件具体的哪些属性。

```
const FinalApp = connect(select, mapDispatchToProps)(App)
```
这是一个柯里化函数。第一级传入刚才4个参数，第二层传入要连接的lianreact组件。([示例链接][5])

我们依然先看看connect的函数签名
```
function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {})
```
mapStateToProps是一个函数，接受state并且返回一个对象，对象包括要传递给组件的属性，这里我们可以对state做筛选与过滤。因为我们只需要全局数据的部分数据传递给组件。

如：
```
function mapStateToProps(state) {
  return {
    visibleTodos: selectTodos(state.todos, state.visibilityFilter),
    visibilityFilter: state.visibilityFilter
  }
}
```

mapDispatchToProps同样也是一个函数，返回要传递给组件的函数对象。
```
// actions.js
export function addTodo(text) {
  return { type: ADD_TODO, text }
}

export function completeTodo(index) {
  return { type: COMPLETE_TODO, index }
}

export function setVisibilityFilter(filter) {
  return { type: SET_VISIBILITY_FILTER, filter }
}

export default {
  addTodo, completeTodo, setVisibilityFilter,
}

// App.js
function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actions, dispatch) }
}
```
这样我们就把addTodo， completeTodo， setVisibilityFilter当做事件传递给组件，组件内使用事件时，只需要actions.addTodo即可。这么做的好处是，第一，组件只拿到了自己关心的事件，而不用担心被全局污染。第二，组件不用感知redux的存在，不需要dispatch，只需要当做普通事件使用即可。第三，事件与组件完全分离，既减少了代码量，又做到了高可维护性。

mergeProps还是一个函数，用来筛选哪些参数传递给组件。这个函数接受3个参数。
```
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})
```
stateProps是mapStateToProps的返回值，dispatchProps是mapDispatchToProps返回值，parentProps是当前组件自己的属性。这个函数默认把这三个返回值拼装到一起传递给组件。当然，我们也可以随意做修改过滤等操作。

最后一个是options,这个是一个对象，有两个布尔，一个是pure，一个是withRef。
如果pure为false，只要connect接受到属性，不管是否有变化，必然刷新connect组件。withRef为true时，在装饰传入的 React 组件时，Connect 会保存一个对该组件的 refs 引用，可以通过 getWrappedInstance 方法来获得该 refs，并最终获得原始的 DOM 节点。

我们看下源码实现
```
function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  // 是否应该订阅，根据传入的map决定，事实上，基本都会订阅
  const shouldSubscribe = Boolean(mapStateToProps)

  // mapState: 传入的函数或者空函数
  const mapState = mapStateToProps || defaultMapStateToProps

  // mapState: 传入的函数或者空函数或者包装函数
  let mapDispatch
  if (typeof mapDispatchToProps === 'function') {
    mapDispatch = mapDispatchToProps
  } else if (!mapDispatchToProps) {
    mapDispatch = defaultMapDispatchToProps
  } else {
    mapDispatch = wrapActionCreators(mapDispatchToProps)
  }

  // mergeProps 参数也是一个函数，接受 stateProps、dispatchProps 和ownProps 作为参数。
  // 实际上， stateProps 就是我们传给 connect 的第一个参数 mapStateToProps 最终返回的 props。同理，
  // dispatchProps 是第二个参数的最终产物，而 ownProps 则是组件自己的 props。
  // 这个方法更大程度上只是为了方便对三种来源的 props 进行更好的分类、命名和重组。
  const finalMergeProps = mergeProps || defaultMergeProps


  // pure配置为 false 时，connect组件接受到属性时，必然刷新。
  // withRef布尔值，默认为 false。如果设置为 true，在装饰传入的 React 组件时，Connect 会保存一个对该组件的 refs 引用，
  // 你可以通过 getWrappedInstance 方法来获得该 refs，并最终获得原始的 DOM 节点。
  const { pure = true, withRef = false } = options
  const checkMergedEquals = pure && finalMergeProps !== defaultMergeProps

  // Helps track hot reloading.
  const version = nextVersion++
```
一级柯里化主要对默认值做了一些处理，defaultMapStateToProps是个空函数，也就是默认不会往react传redux数据的任何属性。而defaultMapDispatchToProps只会往react传递一个属性，就是dispatch，另外mapDispatchToProps也可以传入actionCreator。defaultMergeProps刚才说过，就是把mapStateToProps与mapDispatchToProps和组件自己的属性合并传递给组件。

接着，计算一个叫做checkMergedEquals的变量，如果pure并且传入了mergeProps函数（这块为什么加mergeProps判断我有疑问），那么组件就不需要重新渲染。

接下来我们看下二级柯里化代码
```
function wrapWithConnect(WrappedComponent) {
    const connectDisplayName = `Connect(${getDisplayName(WrappedComponent)})`

    function checkStateShape(props, methodName) {
      if (!isPlainObject(props)) {
        warning(
          `${methodName}() in ${connectDisplayName} must return a plain object. ` +
          `Instead received ${props}.`
        )
      }
    }

    function computeMergedProps(stateProps, dispatchProps, parentProps) {
      const mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps)
      if (process.env.NODE_ENV !== 'production') {
        checkStateShape(mergedProps, 'mergeProps')
      }
      return mergedProps
    }

    class Connect extends Component {

      // 生命周期函数
      constructor(props, context) {
        super(props, context)
        this.version = version
        // Provider提供的store
        this.store = props.store || context.store

        // 如果没有传入store并且也没有Provider包装，提出提示
        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${connectDisplayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${connectDisplayName}".`
        )

        // 获取store的state
        const storeState = this.store.getState()
        // 把store的state作为组件的state，后面通过更新state更新组件
        this.state = { storeState }
        // 清空缓存值，这里为初始化this信息
        this.clearCache()
      }

      shouldComponentUpdate() {
        // 这里通常都是hasStoreStateChanged = true, 其他两项很少生效
        return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged
      }

      componentDidMount() {
        this.trySubscribe()
      }

      // 接受参数，connect属性(目前只有store),很少能用到，因为都是用Provider传递store的
      componentWillReceiveProps(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true
        }
      }

      // 组件卸载时候取消订阅，并且清空缓存
      componentWillUnmount() {
        this.tryUnsubscribe()
        this.clearCache()
      }

      isSubscribed() {
        return typeof this.unsubscribe === 'function'
      }

      handleChange() {
        // 判断是否已经取消订阅
        if (!this.unsubscribe) {
          return
        }

        // 如果当前状态和上次状态相同，退出
        const storeState = this.store.getState()
        const prevStoreState = this.state.storeState
        if (pure && prevStoreState === storeState) {
          return
        }

        if (pure && !this.doStatePropsDependOnOwnProps) {
          // 当前状态和上次状态深度比较
          const haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this)
          // 如果没有变化，退出
          if (!haveStatePropsChanged) {
            return
          }
          // 比较出错
          if (haveStatePropsChanged === errorObject) {
            this.statePropsPrecalculationError = errorObject.value
          }
          // 需要预计算
          this.haveStatePropsBeenPrecalculated = true
        }

        // 标记store发生变化
        this.hasStoreStateChanged = true
        // 重新改变state,也就重新触发render
        this.setState({ storeState })
      }

      /* 订阅函数， didUpdate调用 */
      trySubscribe() {
        if (shouldSubscribe && !this.unsubscribe) {
          // store订阅this.handleChange
          this.unsubscribe = this.store.subscribe(this.handleChange.bind(this))
          this.handleChange()
        }
      }

      /* 取消订阅函数, willUnMount调用 */
      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe()
          this.unsubscribe = null
        }
      }

      /* 清空缓存信息, 加载，卸载以及connect属性变化时候触发，connect属性通常不会变化 */
      clearCache() {
        this.dispatchProps = null
        this.stateProps = null
        this.mergedProps = null
        this.haveOwnPropsChanged = true
        this.hasStoreStateChanged = true
        this.haveStatePropsBeenPrecalculated = false
        this.statePropsPrecalculationError = null
        this.renderedElement = null
        this.finalMapDispatchToProps = null
        this.finalMapStateToProps = null
      }

      // 这个逻辑和计算state相同
      configureFinalMapDispatch(store, props) {
        const mappedDispatch = mapDispatch(store.dispatch, props)
        const isFactory = typeof mappedDispatch === 'function'

        this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch
        // 需要计算的属性依赖自己的属性，当传入两个参数时候重新计算
        this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1

        if (isFactory) {
          return this.computeDispatchProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedDispatch, 'mapDispatchToProps')
        }
        return mappedDispatch
      }

      // 深度比较 props是否有变化
      computeDispatchProps(store, props) {
        if (!this.finalMapDispatchToProps) {
          return this.configureFinalMapDispatch(store, props)
        }

        const { dispatch } = store
        const dispatchProps = this.doDispatchPropsDependOnOwnProps ?
          this.finalMapDispatchToProps(dispatch, props) :
          this.finalMapDispatchToProps(dispatch)

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(dispatchProps, 'mapDispatchToProps')
        }
        return dispatchProps
      }

      // 获得组件当前的state(经过mapPropsToState)的值
      configureFinalMapState(store, props) {
        // mapState是当前组件的mapPropsToState的函数， mappedState是函数的计算结果，也就是当前组件state
        const mappedState = mapState(store.getState(), props)
        const isFactory = typeof mappedState === 'function'

        // 缓存mapStateToProps，如果返回的是函数，就用返回值再当mapStateToProps
        this.finalMapStateToProps = isFactory ? mappedState : mapState

        // 如果参数的长度为不为1，那么依赖于props
        this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1

        if (isFactory) {    // 如果返回的是函数，返回computeStateProps再计算值
          return this.computeStateProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedState, 'mapStateToProps')
        }

        // 返回map后的state
        return mappedState
      }

      // 深度比较 props是否有变化
      computeStateProps(store, props) {
        // 如果不是第一次计算，从缓存中读取mapPropsToState
        if (!this.finalMapStateToProps) {
          return this.configureFinalMapState(store, props)
        }

        const state = store.getState()

        // 判断mapPropsToState是否依赖自己的属性,如果有，传递自己的属性执行函数
        const stateProps = this.doStatePropsDependOnOwnProps ?
          this.finalMapStateToProps(state, props) :
          this.finalMapStateToProps(state)

        if (process.env.NODE_ENV !== 'production') {
          // 如果stateProps格式不符合要求给出提示
          checkStateShape(stateProps, 'mapStateToProps')
        }
        return stateProps
      }

      // 深度比较 props是否有变化
      updateStatePropsIfNeeded() {
        const nextStateProps = this.computeStateProps(this.store, this.props)
        if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
          return false
        }

        // 更新stateProps为下一个计算后的state
        this.stateProps = nextStateProps
        return true
      }

      /* 计算需要传递给组件的所有事件 */
      updateDispatchPropsIfNeeded() {
        const nextDispatchProps = this.computeDispatchProps(this.store, this.props)
        if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false
        }

        this.dispatchProps = nextDispatchProps
        return true
      }

      /* 计算需要传递给组件的所有属性 */
      updateMergedPropsIfNeeded() {
        const nextMergedProps = computeMergedProps(this.stateProps, this.dispatchProps, this.props)
        if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps)) {
          return false
        }

        this.mergedProps = nextMergedProps
        return true
      }

      render() {
        const {
          haveOwnPropsChanged,
          hasStoreStateChanged,
          haveStatePropsBeenPrecalculated,
          statePropsPrecalculationError,
          renderedElement
        } = this

        this.haveOwnPropsChanged = false
        this.hasStoreStateChanged = false
        this.haveStatePropsBeenPrecalculated = false
        this.statePropsPrecalculationError = null

        // 如果组件预计算属性发生异常，报出异常
        if (statePropsPrecalculationError) {
          throw statePropsPrecalculationError
        }

        let shouldUpdateStateProps = true
        let shouldUpdateDispatchProps = true

        // 判断是否应该更新state与dispatch的属性
        if (pure && renderedElement) {
          // 如果组件自己属性变化，state变化并且经过浅对比 || 组件自己的属性变化并且mapPropsToState依赖自己的属性
          shouldUpdateStateProps = hasStoreStateChanged || (
            haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
          )

          // 如果组件自己属性变化，并且传入的mapDispatchToProps有两个参数时，会重新触发计算
          shouldUpdateDispatchProps =
            haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps
        }

        let haveStatePropsChanged = false
        let haveDispatchPropsChanged = false

        // 如果已经预计算，那组store的state肯定发生过变化，详见 handleChange
        if (haveStatePropsBeenPrecalculated) {
          haveStatePropsChanged = true
        } else if (shouldUpdateStateProps) {          // 如果没有预计算，重新计算
          haveStatePropsChanged = this.updateStatePropsIfNeeded()
        }

        // 是否应该重新计算dispatch props
        if (shouldUpdateDispatchProps) {
          haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded()
        }

        let haveMergedPropsChanged = true

        // 如果属性变化，dispatch属性变化或者组件自己的属性变化，任一一个都可能触发重新渲染
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          haveOwnPropsChanged
        ) {
          // 计算最终的mergeProps，并且返回是否需要更新组件
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded()
        } else {
          haveMergedPropsChanged = false
        }

        // 如果状态没有任何改变，显示原来的组件
        if (!haveMergedPropsChanged && renderedElement) {
          return renderedElement
        }

        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: 'wrappedInstance'
          })
        } else {
          this.renderedElement = createElement(WrappedComponent,
            this.mergedProps
          )
        }

        return this.renderedElement
      }
    }

    Connect.displayName = connectDisplayName
    Connect.WrappedComponent = WrappedComponent

    // 从context中获取Provider放的store
    Connect.contextTypes = {
      store: storeShape
    }
    Connect.propTypes = {
      store: storeShape
    }

    if (process.env.NODE_ENV !== 'production') {
      Connect.prototype.componentWillUpdate = function componentWillUpdate() {
        if (this.version === version) {
          return
        }

        // We are hot reloading!
        this.version = version
        this.trySubscribe()
        this.clearCache()
      }
    }

    return hoistStatics(Connect, WrappedComponent)
  }
```
二级柯里化代码非常长，而且杂乱无章，看的我头疼（亲爱的读者你看到的是我重新排版后的connect顺序，已经非常非常清晰，如果你还是看不懂的话，请考虑换个姿势看）。

从生命周期开始，分布解说：

* constructor
    我们可以看到this.store = context.store，这里拿到了Provider提供的store。赋给了state的storeState属性，所以后面通过更新state更新组件，并且清空了缓存信息，这里为了初始化this信息。

* componentDidMount
    这里执行订阅，如果传入了mapStateToProps事件，并且没有取消订阅（组件卸载时候执行），那就执行订阅函数。订阅了this.handleChange，每当数据有变化时候，会自动执行这个订阅函数。并且初始化时候也执行了this.handleChange。

    那么这个handleChange做了什么呢？
    * 首先判断是否取消订阅 或者 当前状态和上次状态是否相同。如果是的话，返回。
    * 我们拿当前状态和上次状态做浅对比，如果没有变化，返回。
    * 如果比较出错，记录错误。
    * 记录预计算标示与storeState变化标示（稍后会用到）
    * 重新改变state,也就重新触发render

* componentWillReceiveProps
    如果pure为false 或者 组件自己的属性与上次属性做浅对比，如果发生变化，把this.haveOwnPropsChanged设置成true,为了shouldComponentUpdate使用

* shouldComponentUpdate
    如果pure为false 或者 组件自己的属性有变化 或者 storeState有变化，返回true，更新组件。大家注意下，dispatch的事件发生变化时候，并不会刷新组件。

* componentWillUnmount
    取消订阅this.handleChange,并且清空this上的属性。

* render
    * 如果之前handleChange预计算发生错误，直接抛出
    * 然后，根据条件（如果pure = true，并且不是第一次渲染），判断是否再次计算state属性与计算事件属性。
        * 是否需要再次计算state属性：如果组件storeState发生变化 || 组件自己的属性变化并且mapPropsToState依赖自己的属性
        * 是否计算事件属性，事件属性依赖自己的属性
    * 接着声明两个变量记录stateProps与dispatchProps是否需要更新
        * stateProps是否需要更新：如果重计算标示为true，则有变化。如果为false，调用updateStatePropsIfNeeded方法来判断属性是否有变化，这个方法执行了最先传入的mapStateToProps函数，并把结果返回的组件属性与之前的storeState做了浅对比。如果为true，则stateProps需要更新。
        * dispatchProps是否需要更新：同上，原理差不多，注释很清楚，自己看实现吧。
    * 如果 stateProps 或者 dispatchProps 或者组件自己的属性任意一个需要更新则更新组件，否则返回缓存的组件也就是上次渲染的connect组件。
    * 渲染更新组件时候，传入this.mergedProps，也就是之前多次强调的三者合成属性（stateProps,dispatchProps与ownProps）。如果withRef = true，则还传入了ref为wrappedInstance的属性。
    * 接着我们在Connect组件上赋了displayName和（展示名称，也就是组件类型）和WrappedComponent（被包装组件类）。最后返回的时候用hoistStatics将react组件中的所有属性拷贝到Connect组件中。

以上就是对react-redux核心源码的理解，其实看懂了也蛮简单的。下面我们看下redux最难理解的部分middleware。

# middleware
### applyMiddleware
这是redux最出彩的地方，类似于koa的middleware。也是redux中最难懂的一部分。

一共有三种方式注入middleware。
```
// 1. const store = compose(applyMiddleware(logger, write))(createStore)(reducer)
// 2. const store = Redux.applyMiddleware(logger, write ...)(Redux.createStore)(reducer)
// 3. const store = Redux.createStore(reducer, null, applyMiddleware(logger, write))

// 拿第一种方式举例
const logger = store => next => action => {
  console.log('logger: ', action);
  next(action);
  console.log('logger finish: ', action);
}

const write = store => next => action => {
  console.log('write:', action);
  next(action);
  console.log('write finish:', action);
}

const finalCreateStore = Redux.compose(
  Redux.applyMiddleware(logger, write)
)(Redux.createStore)

const store = finalCreateStore(reducer)

/*
=>
logger:  { type: 'INCREMENT' }
write: { type: 'INCREMENT' }
...
write finish: { type: 'INCREMENT' }
logger finish:  { type: 'INCREMENT' }
*/
```

applyMiddleware是三级柯里化函数。需要传递中间件列表->store->createStore参数。直接看代码。

```
applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    var middlewareAPI = {
      getState: store.getState,
      // 这样中间件拿到store 可以再次 dispatch
      dispatch: (action) => dispatch(action)
    }

    // middlewareAPI作为参数执行中间件最外层。得到中间件 返回数组，既为[next => action => {...}]
    chain = middlewares.map(middleware => middleware(middlewareAPI))

    // 注意compose是逆序，也就是说，store.dispatch传递给最后一个middleware的next,执行完之后，把最后一个中间件返回给倒数第二个，next是最后一个...以此类推，最后返回第一个中间件，next为第二个中间件。
    // 执行的时候，先执行第一个中间件，next执行第二个...以此类推，最后执行store.dispatch.
    dispatch = compose(...chain)(store.dispatch)

    // 中间件依次执行。中间件任意位置可以自己手动执行next（包括初始化部分）
    return {
      ...store,
      dispatch
    }
  }
}
```
先看这段代码：
```
 var middlewareAPI = {
  getState: store.getState,
  // 这样中间件拿到store 可以再次 dispatch
  dispatch: (action) => dispatch(action)
}
// middlewareAPI作为参数执行中间件最外层。得到中间件 返回数组，既为next => action => {...}
chain = middlewares.map(middleware => middleware(middlewareAPI))
```
middlewareAPI作为参数传递给每个middleware的store中，但是只有两个函数（还记得之前说过store返回4个函数么？）。中间件里可以拿到store做getState，也可以再次dispatch。

接下来，依次执行每个中间件，并且把返回结果赋给dispatch。不熟悉compose的同学可以单独参考我之前写的函数式编程之compose。
```
dispatch = compose(...chain)(store.dispatch)
```
注意compose是逆序，也就是说，store.dispatch传递给最后一个middleware的next,执行完之后，把最后一个中间件返回给倒数第二个，next是最后一个...以此类推，最后返回第一个中间件，next为第二个中间件。

执行的时候，先执行第一个中间件，next执行第二个...以此类推，最后执行store.dispatch。

就拿第一个例子来说，先执行logger,write,dispatch,write end ,logger end。

这样，再次dispatch时候，会依次执行每个中间件。顺如如上所说。

### redux-thunk
如果你使用redux中，遇到需要异步的事件怎么办？比如你想请求后台，根据后台返回的结果刷新表格。

在redux，dispatch中的action只能返回一个object对象的。我们可以在dispatch源码中看到这样一句话
```
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      )
    }
  ...
```
也就是说，dispatch会把这个action当做reducer的数据传递下去，根本不给我们任何异步请求的机会。

这里我们必须使用中间件，可以手写，也可以使用redux-thunk或者redux-promise等中间件。

我们先来看看如何手写，还记得这段代码吗？
```
 var middlewareAPI = {
  getState: store.getState,
  // 这样中间件拿到store 可以再次 dispatch
  dispatch: (action) => dispatch(action)
}
```
**中间件的一阶函数柯里化函数的参数中，可以拿到dispatch函数，我们可以再次dispatch。OK，思路来了，我们完全可以等异步函数执行完毕再次dispatch嘛。**

那么我们如何知道异步函数何时执行完呢？这个问题很好解决，给异步让用户去处理，把dispatch传递给用户，用户处理完了直接调用dispatch就好了。代码如下：
[源码][6]
```
const thunk = ({ dispatch }) => next => action => {
  // action必须是个函数，而不能是object对象
  if (typeof action === 'function') {
    // 把dispatch传递给用户，让用户自己处理
    return action(dispatch);
  }

  return next(action);
}
```

这样，我们的ActionCreator中的返回必须是个函数，而不是之前的action（因为中间件判断action是函数才会有特殊处理，见上）。

使用的地方就很简单了。如上所说ActionCreator直接返回一个函数，函数的参数是dispatch，函数里做异步请求，请求完毕后dispatch即可。

```
export function addTodoAsync(text) {
  return dispatch => {
    // 模拟异步请求
    setTimeout(() => {
      dispatch(addTodo(text));
    }, 1000);
  }
}
```

我们再来看看redux-thunk的[源码][7]，和我们的代码如出一辙。谁抄谁的我就不吹牛了，我想读者一定心知肚明。


### redux-promise

既然 ActionCreator可以返回函数，当然也可以返回其他值。另一种异步操作的解决方案，就是让 ActionCreator返回一个 Promise 对象。
[源码][8]
```
const promise = ({ dispatch }) => next => action => {
  function isPromise(val) {
    return val && typeof val.then === 'function';
  }
  // 如果action是异步函数，则dispatch后直接返回数据，当然数据需要经过ActionCreate包装处理
  return isPromise(action)
    ? action.then(dispatch)
    : next(action);

  return next(action)
}
```
使用时候，可以这么使用
```
export function addTodoFetch(dispatch, postTitle) {
  return fetch(`/api/v1/getText.json?text=${text}`).then(response => {
    type: 'ADD_TODO',
    payload: response.json()
  })
}
```
代码非常简单明确，如果action是promise函数，那么直接调用then，把上次的返回值传递给dispatch执行。也就是说，这个promise的回调应该返回一个action，或者说，这个回调就是个接收response的ActionCreator。

我们再来看看redux-promise是如何实现的。
```
import { isFSA } from 'flux-standard-action';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (!isFSA(action)) {
      return isPromise(action)
        ? action.then(dispatch)
        : next(action);
    }

    return isPromise(action.payload)
      ? action.payload.then(
          result => dispatch({ ...action, payload: result }),
          error => {
            dispatch({ ...action, payload: error, error: true });
            return Promise.reject(error);
          }
        )
      : next(action);
  };
}
```
从上面代码可以看出，如果 ActionCreator 返回的action是一个 Promise，它resolve 以后的值应该是一个 Action 对象，会被dispatch当做事件执行（action.then(dispatch)）（注意，reject 以后不会有任何动作）。如果 action对象的payload属性是一个Promise对象，那么无论 resolve 和 reject，dispatch方法都会发出action,失败后会多一个error属性，payload也会变成失败信息。



  [1]: https://github.com/antgod/redux-doc/tree/master/src
  [2]: https://github.com/antgod/react-redux-doc/tree/master/src
  [3]: https://github.com/zenparsing/es-observable
  [4]: https://github.com/antgod/react-redux-doc/blob/master/src
  [5]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js
  [6]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js
  [7]: https://github.com/gaearon/redux-thunk/blob/master/src/index.js
  [8]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js