# redux
��������ʱ�䣬��redux��3.6.0����react-redux��4.4.5��Դ��ע����һ�顣ע���ļ��ֱ���[redux-doc][1]��[react-redux-doc][2]�С�

reduxԴ��ܼ򵥣�react-redux��Щ���ӣ���ֻҪ������˼��ϸ�Ķ�����ᷢ�֣�������ô�Ѷ���

�ϻ�����˵����ƪ�������reduxԴ�롣��Դ��֮ǰһ��Ҫ���KPI�����õ���������һ��Ҫ�����ͬ������ʽ����ﻯ���ã���ʵ��Դ��֮ǰ��һ��API�����ˣ���

## ���ĸ���

redux�ĺ���˼��������flux������˵flux�ǹ淶����state��ʵ�֡�flux �������Ҫ���������ǰ�� MVC ��ܵľ����ܽ������һ�׻��� dispatcher ��ǰ��Ӧ�üܹ�ģʽ������� MVC ������ϰ�ߣ���Ӧ�ý� ADSV��Action Dispatcher Store View��������������Flux �ĺ���˼��������ݺ��߼���Զ����������

redux �ο��� flux ����ƣ����Ƕ� flux �������Ĳ��֣��� dispatcher�����˼򻯣�ͬʱ������ʽ��̵�˼���ں����С�
<img src='../img/redux.png' />

* state: ͨ��store.getState�������أ���ǰstore������״̬��
* store: ͨ��createStore��������,�ְ���������4�����ķ�����
    * getState()����ȡ store �е�ǰ��״̬��
    * dispatch(action)���ַ�һ�� action�����������action������Ψһ�ܸı� store �����ݵķ�ʽ��
    * subscribe(listener)��ע��һ�������ߣ����� store �����仯ʱ�����á�
    * replaceReducer(nextReducer)�����µ�ǰ store ��� reducer��һ��ֻ���ڿ���ģʽ�е��ø÷�����
* reducer: reducer��һ������������������ÿ�������ĺ������ϡ�
* action: action ��һ����ͨ�� JavaScript ����һ����� type��payload ���ֶΣ���������һ���¼��Լ���Ҫ�ı��������ݡ�
* middleware: ���ṩ��һ�����ദ�� action �Ļ��ᡣ�� middleware �У�����Լ���ÿһ�������� action����ѡ���ض����͵� action ������Ӧ����������һ�θı� action �Ļ��ᡣ

## createStore
createStore������������store����store��redux�ĺ��ģ�����redux���и����store�йء�

�������ǿ���createStore�ĺ���ǩ����
```
function createStore(reducer, preloadedState, enhancer) {
  // ...
}
```

������ʹ��createStoreʱ��ͨ��ֻ����reducer��ʣ�µ�����������3.1.0�Ժ�ż���ġ�preloadedState�ǳ�ʼ��stateֵ��enhancer�������ᵽ��middleware�����˼��������koa-middleware��

���ǿ�������������ι�����
```
  // �����ʼ��������Ǻ�������û�д����м�������ʼ��������Ϊ�м��
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
```

���ֽӿ����ģʽ������jquery������������ǩ����

������������һЩ�б���
```
  // currentState: ��ǰ����
  var currentReducer = reducer                      // ��ǰreducer
  var currentState = preloadedState                 // ��ʼ��״̬
  var currentListeners = []                         // ��ǰ���ĵ��¼�
  var nextListeners = currentListeners              // �´ζ��ĵ��¼�
  var isDispatching = false                         // �Ƿ����ڷ����¼�
```
����ΪʲôҪ���ֵ�ǰ�����¼����´ζ����¼��أ��������ǻ������

```
  /* ��õ�ǰstore���������� */
  function getState() {
    return currentState
  }

  /* ���ĺ��� */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.')
    }

    var isSubscribed = true

    ensureCanMutateNextListeners()
    // �����´ζ��ĺ�����ÿ�η���ʱ��ִ�ж��ĺ���
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
getStateûʲô��˵�ġ����ĺ���Ҳ��������ˣ�����һϵ��Ҫִ�еķ���������һ���������ٴ�ִ��ȡ�����ġ�����ԭ��js�������ȫ��ͬ��ԭ��js��removeEventListener��Ҫָ��ԭ�󶨺�����

ensureCanMutateNextListeners������ѵ�ǰ���ĵĺ����������´ζ��ĵĺ�����Ϊʲô��ô�������ϸղŵ����⣬һ���ٽ����������û������������Ҳ����������

������store������Ҫ�ĵĺ���dispatch������redux�����ݱ仯���ǿ�����ɣ�����һ���ֽ���render�����ǿ���dispatch��Դ��
```
  /* �������� */
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

    // ִ�е�ǰreducer,��ǰreducer���Ա�replace��
    try {
      // ִ�еĹ����У���¼״̬�����ִ�еĹ�������ִ�У��ᱨ��
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // ÿ�η���ʱ�򣬸��µ�ǰ���ĺ�����������ʱ���ٶ��ģ�����´ζ��ĵĺ����ӵ�ǰ��������һ�ݣ���ֹ��ǰִ�з���������Ӱ��
    var listeners = currentListeners = nextListeners

    // ����ִ��ÿ�����ĺ���
    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i]
      listener()
    }

    return action
  }
```
���ǿ��������Ŀ�������ѵ�ǰ��״̬��action���ݸ�reducer�����Ұѷ��ؽ�����¸�ֵ��currentState����isDispatching������ִ�з����в����ٴη�����

�������һ�¸ղŵ����ʣ�Ϊʲôÿ�ζ���ʱ�򶼷���nextListeners�С�

**�����Ĺ����У�������ִ�����ж��ĺ�������������Ĺ������ٴζ��ģ���ô��ǰ����ʱ��ִ�еĶ�������Ҳ����Ӱ�졣**

**redux��ν����������أ�����ÿ�η��������У��õ����Ƕ��ĵ�һ��������currentListeners=nextListeners�������ٴζ��ģ�����ȡ�����ģ�ʱ����������������������ĵĺ����� nextListeners = currentListeners.slice()��Ҳ����֮ǰ˵����ensureCanMutateNextListeners��������**

�������滻��reducer������Դ�������ɼ�������������͡�
```
  // �滻����ǰ reducer
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    // �滻������ִ��init����
    dispatch({ type: ActionTypes.INIT })
  }
```
����� observable ���������������ʹ�á�
```
  function observable() {
    // subscribe ����������Ǹ� subscribe���ĺ���
    var outerSubscribe = subscribe
    return {
      subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          // ���� observer �� next ��������ȡ��ǰ state��
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        // �� observeState ����һ�� listener��dispatch ֮���Զ����� observer �� next ������
        var unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }
```
observable ��Ϊ����� Rxjs ���� observable/reactive �⣬���õĽ��� EMCAScript ���ܻ�֧��ԭ���� observable/reactive ����[tc39/proposal-observable][3]

���ִ��һ�³�ʼ��
```
dispatch({ type: ActionTypes.INIT })
```

## bindActionCreateors
����������԰�dispatch(action)����ֱ����Ϊ���Դ��ݸ�react�����������������ڲ��ٴ�dispatch(action),��ô���ĺô�������react��redux��ȫ���룬����ڲ��޸�֪redux�Ĵ��ڡ�

��todo list������
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
�����Ϳ��԰�dispatch��װ���actionsֱ�Ӵ��ݸ�app����app�ڲ�������diapatch(action)

Դ��ʵ��Ҳ�ǳ���
```
function bindActionCreator(actionCreator, dispatch) {
  // ��װһ��dispatch�����ظ߽׺�������Ϊԭ����actionCreator�ǿ��Դ��ݲ����ĺ�������װ�����ƻ�ԭ�ṹ
  return (...args) => dispatch(actionCreator(...args))
}

export default function bindActionCreators(actionCreators, dispatch) {
  // �õ� actionName: addTodo removeTodo
  var keys = Object.keys(actionCreators)
  var boundActionCreators = {}
  for (var i = 0; i < keys.length; i++) {
    // ��һ��ִ��key = addTodo(string)
    var key = keys[i]
    // actionCreator = addTodo(function)
    var actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      // ��װ��������ԭ����������dispatch��װ��
      // ����ֱ�ӰѾ���dispatch��װ���������ݸ����������������������õ����ݹ�ȥdispatch��ȥִ�У����������ֻͨ�����ݹ�ȥ�ĺ������ü��ɣ���ȫ��֪����redux�Ĵ���
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
```

### combineReducers
���������������;

* �Ѷ��reducers�ϲ���һ����������reducer�⹹
* ���ս⹹�����ƣ��Ѳ�ͬ�����ݷַ�����ͬ��state���¡�

������˵������������reducer������Ҫ�ϳ�һ����
```
function r1(state, action) {}
function r2(state, action) {}

const reducer = combineReducers({
  r1,
  r2
})
```
����store������������r1��r2���ֱ�洢ÿ��reducer�ķ��ؽ����
Ҳ����˵��ʹ��combineReducers��ȫ��store�������ռ���и��롣����ķ�ʽ����reducer�����֣� { r1: state, r2: state }��

combineReducersʵ����Щ����������Ҳ���ѡ�
```
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers)
  // �ڲ���������reducers�ı���
  var finalReducers = {}

  // ����reducer��finalReducers�У�Ҳ�������ݹ���
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
  // �������key, Ҳ����[ 'r1', 'r2' ]
  var finalReducerKeys = Object.keys(finalReducers)

  if (NODE_ENV !== 'production') {
    var unexpectedKeyCache = {}
  }

  // ����ÿ��reducer�Ƿ��з���ֵ
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
      // ÿ��reducer��key, r1
      var key = finalReducerKeys[i]
      // ÿ��reducer��ֵ, r1����
      var reducer = finalReducers[key]
      // key����һ��״̬��Ҳ����state['r1']
      var previousStateForKey = state[key]
      // ִ��ÿ��reducer������һ�ε�״̬��action���룬����һ���µ�״̬
      var nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // �´ε�״̬����
      nextState[key] = nextStateForKey
      // �ж��Ƿ�仯
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // ����б仯�����ر仯���״̬
    return hasChanged ? nextState : state
  }
}
```
��ע�Ͳ�������⣬��dispatchʱ������ִ��ÿ��reducer����Ϊÿ��reducer�����Զ�action.type������ȡ���ϴε�״ֵ̬��ִ��reducer���Ҹ������ݡ�

���Ͼ��Ƕ�redux����Դ������еķ����������������ǿ���react-redux�������ˣ�ġ�

# react-redux
���������ļ�λ��[react-redux-doc][4]�С�

֮ǰ˵����react-redux��Щ���ӣ���ʵreact-reduxֻ���������ĸ��Provider��connect��Provider��Դ�벻��ɵ�Ӷ��������Ķ������Ͻ��������~����Ψһ�е��Ѷȵģ�����connect�ˡ�

## Provider

provider������react����ṩ���ݣ����ݷ���context�е�store����Դ��ǳ��򵥡�

```
function createProvider(storeKey = 'store', subKey) {
    const subscriptionKey = subKey || `${storeKey}Subscription`

    class Provider extends Component {
        // getChildContext: ��store���ݸ�����component
        getChildContext() {
          return { [storeKey]: this[storeKey], [subscriptionKey]: null }
        }

        // �õ������storeֱ�ӹ��ڵ���ǰstore��
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
        // ���store�иı䣬�򷢳�����
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
���ǿ����������ǰѴ����store����this[storeKey]������getChildContext�а����store���ظ���������ѡ�����Ϊ�˿���չ��storeKey���ɲ�����Ĭ��ֵstore�����ݽ�ȥ�����⣬�����������context�л������һ��ֵ��key = storeSubscription ��ֵΪnull�����ԡ�Ŀǰ��û��ʲô���á�

���⣬ÿ�θı�store����ʱ�򣬶��ᱨ��һ�����档�ڶ��θı�ʱ�򲻻ᾯ�棬ֱ���˳���Ҳ����˵Provider��֧�ֶ�̬�޸�store��

## connect
connectͨ������mapStateToProps, mapDispatchToProps��mergeProps, options����̬�����Ӧ�ô��ݸ�react����������Щ���ԡ�

```
const FinalApp = connect(select, mapDispatchToProps)(App)
```
����һ�����ﻯ��������һ������ղ�4���������ڶ��㴫��Ҫ���ӵ�lianreact�����([ʾ������][5])

������Ȼ�ȿ���connect�ĺ���ǩ��
```
function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {})
```
mapStateToProps��һ������������state���ҷ���һ�����󣬶������Ҫ���ݸ���������ԣ��������ǿ��Զ�state��ɸѡ����ˡ���Ϊ����ֻ��Ҫȫ�����ݵĲ������ݴ��ݸ������

�磺
```
function mapStateToProps(state) {
  return {
    visibleTodos: selectTodos(state.todos, state.visibilityFilter),
    visibilityFilter: state.visibilityFilter
  }
}
```

mapDispatchToPropsͬ��Ҳ��һ������������Ҫ���ݸ�����ĺ�������
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
�������ǾͰ�addTodo�� completeTodo�� setVisibilityFilter�����¼����ݸ�����������ʹ���¼�ʱ��ֻ��Ҫactions.addTodo���ɡ���ô���ĺô��ǣ���һ�����ֻ�õ����Լ����ĵ��¼��������õ��ı�ȫ����Ⱦ���ڶ���������ø�֪redux�Ĵ��ڣ�����Ҫdispatch��ֻ��Ҫ������ͨ�¼�ʹ�ü��ɡ��������¼��������ȫ���룬�ȼ����˴��������������˸߿�ά���ԡ�

mergeProps����һ������������ɸѡ��Щ�������ݸ�����������������3��������
```
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})
```
stateProps��mapStateToProps�ķ���ֵ��dispatchProps��mapDispatchToProps����ֵ��parentProps�ǵ�ǰ����Լ������ԡ��������Ĭ�ϰ�����������ֵƴװ��һ�𴫵ݸ��������Ȼ������Ҳ�����������޸Ĺ��˵Ȳ�����

���һ����options,�����һ������������������һ����pure��һ����withRef��
���pureΪfalse��ֻҪconnect���ܵ����ԣ������Ƿ��б仯����Ȼˢ��connect�����withRefΪtrueʱ����װ�δ���� React ���ʱ��Connect �ᱣ��һ���Ը������ refs ���ã�����ͨ�� getWrappedInstance ��������ø� refs�������ջ��ԭʼ�� DOM �ڵ㡣

���ǿ���Դ��ʵ��
```
function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  // �Ƿ�Ӧ�ö��ģ����ݴ����map��������ʵ�ϣ��������ᶩ��
  const shouldSubscribe = Boolean(mapStateToProps)

  // mapState: ����ĺ������߿պ���
  const mapState = mapStateToProps || defaultMapStateToProps

  // mapState: ����ĺ������߿պ������߰�װ����
  let mapDispatch
  if (typeof mapDispatchToProps === 'function') {
    mapDispatch = mapDispatchToProps
  } else if (!mapDispatchToProps) {
    mapDispatch = defaultMapDispatchToProps
  } else {
    mapDispatch = wrapActionCreators(mapDispatchToProps)
  }

  // mergeProps ����Ҳ��һ������������ stateProps��dispatchProps ��ownProps ��Ϊ������
  // ʵ���ϣ� stateProps �������Ǵ��� connect �ĵ�һ������ mapStateToProps ���շ��ص� props��ͬ��
  // dispatchProps �ǵڶ������������ղ���� ownProps ��������Լ��� props��
  // �����������̶���ֻ��Ϊ�˷����������Դ�� props ���и��õķ��ࡢ���������顣
  const finalMergeProps = mergeProps || defaultMergeProps


  // pure����Ϊ false ʱ��connect������ܵ�����ʱ����Ȼˢ�¡�
  // withRef����ֵ��Ĭ��Ϊ false���������Ϊ true����װ�δ���� React ���ʱ��Connect �ᱣ��һ���Ը������ refs ���ã�
  // �����ͨ�� getWrappedInstance ��������ø� refs�������ջ��ԭʼ�� DOM �ڵ㡣
  const { pure = true, withRef = false } = options
  const checkMergedEquals = pure && finalMergeProps !== defaultMergeProps

  // Helps track hot reloading.
  const version = nextVersion++
```
һ�����ﻯ��Ҫ��Ĭ��ֵ����һЩ����defaultMapStateToProps�Ǹ��պ�����Ҳ����Ĭ�ϲ�����react��redux���ݵ��κ����ԡ���defaultMapDispatchToPropsֻ����react����һ�����ԣ�����dispatch������mapDispatchToPropsҲ���Դ���actionCreator��defaultMergeProps�ղ�˵�������ǰ�mapStateToProps��mapDispatchToProps������Լ������Ժϲ����ݸ������

���ţ�����һ������checkMergedEquals�ı��������pure���Ҵ�����mergeProps���������Ϊʲô��mergeProps�ж��������ʣ�����ô����Ͳ���Ҫ������Ⱦ��

���������ǿ��¶������ﻯ����
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

      // �������ں���
      constructor(props, context) {
        super(props, context)
        this.version = version
        // Provider�ṩ��store
        this.store = props.store || context.store

        // ���û�д���store����Ҳû��Provider��װ�������ʾ
        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${connectDisplayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${connectDisplayName}".`
        )

        // ��ȡstore��state
        const storeState = this.store.getState()
        // ��store��state��Ϊ�����state������ͨ������state�������
        this.state = { storeState }
        // ��ջ���ֵ������Ϊ��ʼ��this��Ϣ
        this.clearCache()
      }

      shouldComponentUpdate() {
        // ����ͨ������hasStoreStateChanged = true, �������������Ч
        return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged
      }

      componentDidMount() {
        this.trySubscribe()
      }

      // ���ܲ�����connect����(Ŀǰֻ��store),�������õ�����Ϊ������Provider����store��
      componentWillReceiveProps(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true
        }
      }

      // ���ж��ʱ��ȡ�����ģ�������ջ���
      componentWillUnmount() {
        this.tryUnsubscribe()
        this.clearCache()
      }

      isSubscribed() {
        return typeof this.unsubscribe === 'function'
      }

      handleChange() {
        // �ж��Ƿ��Ѿ�ȡ������
        if (!this.unsubscribe) {
          return
        }

        // �����ǰ״̬���ϴ�״̬��ͬ���˳�
        const storeState = this.store.getState()
        const prevStoreState = this.state.storeState
        if (pure && prevStoreState === storeState) {
          return
        }

        if (pure && !this.doStatePropsDependOnOwnProps) {
          // ��ǰ״̬���ϴ�״̬��ȱȽ�
          const haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this)
          // ���û�б仯���˳�
          if (!haveStatePropsChanged) {
            return
          }
          // �Ƚϳ���
          if (haveStatePropsChanged === errorObject) {
            this.statePropsPrecalculationError = errorObject.value
          }
          // ��ҪԤ����
          this.haveStatePropsBeenPrecalculated = true
        }

        // ���store�����仯
        this.hasStoreStateChanged = true
        // ���¸ı�state,Ҳ�����´���render
        this.setState({ storeState })
      }

      /* ���ĺ����� didUpdate���� */
      trySubscribe() {
        if (shouldSubscribe && !this.unsubscribe) {
          // store����this.handleChange
          this.unsubscribe = this.store.subscribe(this.handleChange.bind(this))
          this.handleChange()
        }
      }

      /* ȡ�����ĺ���, willUnMount���� */
      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe()
          this.unsubscribe = null
        }
      }

      /* ��ջ�����Ϣ, ���أ�ж���Լ�connect���Ա仯ʱ�򴥷���connect����ͨ������仯 */
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

      // ����߼��ͼ���state��ͬ
      configureFinalMapDispatch(store, props) {
        const mappedDispatch = mapDispatch(store.dispatch, props)
        const isFactory = typeof mappedDispatch === 'function'

        this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch
        // ��Ҫ��������������Լ������ԣ���������������ʱ�����¼���
        this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1

        if (isFactory) {
          return this.computeDispatchProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedDispatch, 'mapDispatchToProps')
        }
        return mappedDispatch
      }

      // ��ȱȽ� props�Ƿ��б仯
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

      // ��������ǰ��state(����mapPropsToState)��ֵ
      configureFinalMapState(store, props) {
        // mapState�ǵ�ǰ�����mapPropsToState�ĺ����� mappedState�Ǻ����ļ�������Ҳ���ǵ�ǰ���state
        const mappedState = mapState(store.getState(), props)
        const isFactory = typeof mappedState === 'function'

        // ����mapStateToProps��������ص��Ǻ��������÷���ֵ�ٵ�mapStateToProps
        this.finalMapStateToProps = isFactory ? mappedState : mapState

        // ��������ĳ���Ϊ��Ϊ1����ô������props
        this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1

        if (isFactory) {    // ������ص��Ǻ���������computeStateProps�ټ���ֵ
          return this.computeStateProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedState, 'mapStateToProps')
        }

        // ����map���state
        return mappedState
      }

      // ��ȱȽ� props�Ƿ��б仯
      computeStateProps(store, props) {
        // ������ǵ�һ�μ��㣬�ӻ����ж�ȡmapPropsToState
        if (!this.finalMapStateToProps) {
          return this.configureFinalMapState(store, props)
        }

        const state = store.getState()

        // �ж�mapPropsToState�Ƿ������Լ�������,����У������Լ�������ִ�к���
        const stateProps = this.doStatePropsDependOnOwnProps ?
          this.finalMapStateToProps(state, props) :
          this.finalMapStateToProps(state)

        if (process.env.NODE_ENV !== 'production') {
          // ���stateProps��ʽ������Ҫ�������ʾ
          checkStateShape(stateProps, 'mapStateToProps')
        }
        return stateProps
      }

      // ��ȱȽ� props�Ƿ��б仯
      updateStatePropsIfNeeded() {
        const nextStateProps = this.computeStateProps(this.store, this.props)
        if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
          return false
        }

        // ����statePropsΪ��һ��������state
        this.stateProps = nextStateProps
        return true
      }

      /* ������Ҫ���ݸ�����������¼� */
      updateDispatchPropsIfNeeded() {
        const nextDispatchProps = this.computeDispatchProps(this.store, this.props)
        if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false
        }

        this.dispatchProps = nextDispatchProps
        return true
      }

      /* ������Ҫ���ݸ�������������� */
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

        // ������Ԥ�������Է����쳣�������쳣
        if (statePropsPrecalculationError) {
          throw statePropsPrecalculationError
        }

        let shouldUpdateStateProps = true
        let shouldUpdateDispatchProps = true

        // �ж��Ƿ�Ӧ�ø���state��dispatch������
        if (pure && renderedElement) {
          // �������Լ����Ա仯��state�仯���Ҿ���ǳ�Ա� || ����Լ������Ա仯����mapPropsToState�����Լ�������
          shouldUpdateStateProps = hasStoreStateChanged || (
            haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
          )

          // �������Լ����Ա仯�����Ҵ����mapDispatchToProps����������ʱ�������´�������
          shouldUpdateDispatchProps =
            haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps
        }

        let haveStatePropsChanged = false
        let haveDispatchPropsChanged = false

        // ����Ѿ�Ԥ���㣬����store��state�϶��������仯����� handleChange
        if (haveStatePropsBeenPrecalculated) {
          haveStatePropsChanged = true
        } else if (shouldUpdateStateProps) {          // ���û��Ԥ���㣬���¼���
          haveStatePropsChanged = this.updateStatePropsIfNeeded()
        }

        // �Ƿ�Ӧ�����¼���dispatch props
        if (shouldUpdateDispatchProps) {
          haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded()
        }

        let haveMergedPropsChanged = true

        // ������Ա仯��dispatch���Ա仯��������Լ������Ա仯����һһ�������ܴ���������Ⱦ
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          haveOwnPropsChanged
        ) {
          // �������յ�mergeProps�����ҷ����Ƿ���Ҫ�������
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded()
        } else {
          haveMergedPropsChanged = false
        }

        // ���״̬û���κθı䣬��ʾԭ�������
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

    // ��context�л�ȡProvider�ŵ�store
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
�������ﻯ����ǳ����������������£�������ͷ�ۣ��װ��Ķ����㿴�������������Ű���connect˳���Ѿ��ǳ��ǳ�����������㻹�ǿ������Ļ����뿼�ǻ������ƿ�����

���������ڿ�ʼ���ֲ���˵��

* constructor
    ���ǿ��Կ���this.store = context.store�������õ���Provider�ṩ��store��������state��storeState���ԣ����Ժ���ͨ������state�����������������˻�����Ϣ������Ϊ�˳�ʼ��this��Ϣ��

* componentDidMount
    ����ִ�ж��ģ����������mapStateToProps�¼�������û��ȡ�����ģ����ж��ʱ��ִ�У����Ǿ�ִ�ж��ĺ�����������this.handleChange��ÿ�������б仯ʱ�򣬻��Զ�ִ��������ĺ��������ҳ�ʼ��ʱ��Ҳִ����this.handleChange��

    ��ô���handleChange����ʲô�أ�
    * �����ж��Ƿ�ȡ������ ���� ��ǰ״̬���ϴ�״̬�Ƿ���ͬ������ǵĻ������ء�
    * �����õ�ǰ״̬���ϴ�״̬��ǳ�Աȣ����û�б仯�����ء�
    * ����Ƚϳ�����¼����
    * ��¼Ԥ�����ʾ��storeState�仯��ʾ���Ժ���õ���
    * ���¸ı�state,Ҳ�����´���render

* componentWillReceiveProps
    ���pureΪfalse ���� ����Լ����������ϴ�������ǳ�Աȣ���������仯����this.haveOwnPropsChanged���ó�true,Ϊ��shouldComponentUpdateʹ��

* shouldComponentUpdate
    ���pureΪfalse ���� ����Լ��������б仯 ���� storeState�б仯������true��������������ע���£�dispatch���¼������仯ʱ�򣬲�����ˢ�������

* componentWillUnmount
    ȡ������this.handleChange,�������this�ϵ����ԡ�

* render
    * ���֮ǰhandleChangeԤ���㷢������ֱ���׳�
    * Ȼ�󣬸������������pure = true�����Ҳ��ǵ�һ����Ⱦ�����ж��Ƿ��ٴμ���state����������¼����ԡ�
        * �Ƿ���Ҫ�ٴμ���state���ԣ�������storeState�����仯 || ����Լ������Ա仯����mapPropsToState�����Լ�������
        * �Ƿ�����¼����ԣ��¼����������Լ�������
    * ������������������¼stateProps��dispatchProps�Ƿ���Ҫ����
        * stateProps�Ƿ���Ҫ���£�����ؼ����ʾΪtrue�����б仯�����Ϊfalse������updateStatePropsIfNeeded�������ж������Ƿ��б仯���������ִ�������ȴ����mapStateToProps���������ѽ�����ص����������֮ǰ��storeState����ǳ�Աȡ����Ϊtrue����stateProps��Ҫ���¡�
        * dispatchProps�Ƿ���Ҫ���£�ͬ�ϣ�ԭ���࣬ע�ͺ�������Լ���ʵ�ְɡ�
    * ��� stateProps ���� dispatchProps ��������Լ�����������һ����Ҫ�����������������򷵻ػ�������Ҳ�����ϴ���Ⱦ��connect�����
    * ��Ⱦ�������ʱ�򣬴���this.mergedProps��Ҳ����֮ǰ���ǿ�������ߺϳ����ԣ�stateProps,dispatchProps��ownProps�������withRef = true���򻹴�����refΪwrappedInstance�����ԡ�
    * ����������Connect����ϸ���displayName�ͣ�չʾ���ƣ�Ҳ����������ͣ���WrappedComponent������װ����ࣩ����󷵻ص�ʱ����hoistStatics��react����е��������Կ�����Connect����С�

���Ͼ��Ƕ�react-redux����Դ�����⣬��ʵ������Ҳ���򵥵ġ��������ǿ���redux�������Ĳ���middleware��

# middleware
### applyMiddleware
����redux����ʵĵط���������koa��middleware��Ҳ��redux�����Ѷ���һ���֡�

һ�������ַ�ʽע��middleware��
```
// 1. const store = compose(applyMiddleware(logger, write))(createStore)(reducer)
// 2. const store = Redux.applyMiddleware(logger, write ...)(Redux.createStore)(reducer)
// 3. const store = Redux.createStore(reducer, null, applyMiddleware(logger, write))

// �õ�һ�ַ�ʽ����
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

applyMiddleware���������ﻯ��������Ҫ�����м���б�->store->createStore������ֱ�ӿ����롣

```
applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    var middlewareAPI = {
      getState: store.getState,
      // �����м���õ�store �����ٴ� dispatch
      dispatch: (action) => dispatch(action)
    }

    // middlewareAPI��Ϊ����ִ���м������㡣�õ��м�� �������飬��Ϊ[next => action => {...}]
    chain = middlewares.map(middleware => middleware(middlewareAPI))

    // ע��compose������Ҳ����˵��store.dispatch���ݸ����һ��middleware��next,ִ����֮�󣬰����һ���м�����ظ������ڶ�����next�����һ��...�Դ����ƣ���󷵻ص�һ���м����nextΪ�ڶ����м����
    // ִ�е�ʱ����ִ�е�һ���м����nextִ�еڶ���...�Դ����ƣ����ִ��store.dispatch.
    dispatch = compose(...chain)(store.dispatch)

    // �м������ִ�С��м������λ�ÿ����Լ��ֶ�ִ��next��������ʼ�����֣�
    return {
      ...store,
      dispatch
    }
  }
}
```
�ȿ���δ��룺
```
 var middlewareAPI = {
  getState: store.getState,
  // �����м���õ�store �����ٴ� dispatch
  dispatch: (action) => dispatch(action)
}
// middlewareAPI��Ϊ����ִ���м������㡣�õ��м�� �������飬��Ϊnext => action => {...}
chain = middlewares.map(middleware => middleware(middlewareAPI))
```
middlewareAPI��Ϊ�������ݸ�ÿ��middleware��store�У�����ֻ���������������ǵ�֮ǰ˵��store����4������ô�������м��������õ�store��getState��Ҳ�����ٴ�dispatch��

������������ִ��ÿ���м�������Ұѷ��ؽ������dispatch������Ϥcompose��ͬѧ���Ե����ο���֮ǰд�ĺ���ʽ���֮compose��
```
dispatch = compose(...chain)(store.dispatch)
```
ע��compose������Ҳ����˵��store.dispatch���ݸ����һ��middleware��next,ִ����֮�󣬰����һ���м�����ظ������ڶ�����next�����һ��...�Դ����ƣ���󷵻ص�һ���м����nextΪ�ڶ����м����

ִ�е�ʱ����ִ�е�һ���м����nextִ�еڶ���...�Դ����ƣ����ִ��store.dispatch��

���õ�һ��������˵����ִ��logger,write,dispatch,write end ,logger end��

�������ٴ�dispatchʱ�򣬻�����ִ��ÿ���м����˳��������˵��

### redux-thunk
�����ʹ��redux�У�������Ҫ�첽���¼���ô�죿�������������̨�����ݺ�̨���صĽ��ˢ�±��

��redux��dispatch�е�actionֻ�ܷ���һ��object����ġ����ǿ�����dispatchԴ���п�������һ�仰
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
Ҳ����˵��dispatch������action����reducer�����ݴ�����ȥ���������������κ��첽����Ļ��ᡣ

�������Ǳ���ʹ���м����������д��Ҳ����ʹ��redux-thunk����redux-promise���м����

�����������������д�����ǵ���δ�����
```
 var middlewareAPI = {
  getState: store.getState,
  // �����м���õ�store �����ٴ� dispatch
  dispatch: (action) => dispatch(action)
}
```
**�м����һ�׺������ﻯ�����Ĳ����У������õ�dispatch���������ǿ����ٴ�dispatch��OK��˼·���ˣ�������ȫ���Ե��첽����ִ������ٴ�dispatch�**

��ô�������֪���첽������ʱִ�����أ��������ܺý�������첽���û�ȥ������dispatch���ݸ��û����û���������ֱ�ӵ���dispatch�ͺ��ˡ��������£�
[Դ��][6]
```
const thunk = ({ dispatch }) => next => action => {
  // action�����Ǹ���������������object����
  if (typeof action === 'function') {
    // ��dispatch���ݸ��û������û��Լ�����
    return action(dispatch);
  }

  return next(action);
}
```

���������ǵ�ActionCreator�еķ��ر����Ǹ�������������֮ǰ��action����Ϊ�м���ж�action�Ǻ����Ż������⴦�����ϣ���

ʹ�õĵط��ͺܼ��ˡ�������˵ActionCreatorֱ�ӷ���һ�������������Ĳ�����dispatch�����������첽����������Ϻ�dispatch���ɡ�

```
export function addTodoAsync(text) {
  return dispatch => {
    // ģ���첽����
    setTimeout(() => {
      dispatch(addTodo(text));
    }, 1000);
  }
}
```

������������redux-thunk��[Դ��][7]�������ǵĴ������һ�ޡ�˭��˭���ҾͲ���ţ�ˣ��������һ����֪������


### redux-promise

��Ȼ ActionCreator���Է��غ�������ȻҲ���Է�������ֵ����һ���첽�����Ľ�������������� ActionCreator����һ�� Promise ����
[Դ��][8]
```
const promise = ({ dispatch }) => next => action => {
  function isPromise(val) {
    return val && typeof val.then === 'function';
  }
  // ���action���첽��������dispatch��ֱ�ӷ������ݣ���Ȼ������Ҫ����ActionCreate��װ����
  return isPromise(action)
    ? action.then(dispatch)
    : next(action);

  return next(action)
}
```
ʹ��ʱ�򣬿�����ôʹ��
```
export function addTodoFetch(dispatch, postTitle) {
  return fetch(`/api/v1/getText.json?text=${text}`).then(response => {
    type: 'ADD_TODO',
    payload: response.json()
  })
}
```
����ǳ�����ȷ�����action��promise��������ôֱ�ӵ���then�����ϴεķ���ֵ���ݸ�dispatchִ�С�Ҳ����˵�����promise�Ļص�Ӧ�÷���һ��action������˵������ص����Ǹ�����response��ActionCreator��

������������redux-promise�����ʵ�ֵġ�
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
�����������Կ�������� ActionCreator ���ص�action��һ�� Promise����resolve �Ժ��ֵӦ����һ�� Action ���󣬻ᱻdispatch�����¼�ִ�У�action.then(dispatch)����ע�⣬reject �Ժ󲻻����κζ���������� action�����payload������һ��Promise������ô���� resolve �� reject��dispatch�������ᷢ��action,ʧ�ܺ���һ��error���ԣ�payloadҲ����ʧ����Ϣ��



  [1]: https://github.com/antgod/redux-doc/tree/master/src
  [2]: https://github.com/antgod/react-redux-doc/tree/master/src
  [3]: https://github.com/zenparsing/es-observable
  [4]: https://github.com/antgod/react-redux-doc/blob/master/src
  [5]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js
  [6]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js
  [7]: https://github.com/gaearon/redux-thunk/blob/master/src/index.js
  [8]: https://github.com/antgod/react-redux-doc/blob/master/test/src/index.js