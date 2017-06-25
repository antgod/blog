### 对象校验器

*本章所有代码，均在https://github.com/antgod/functional/tree/master/stack/5.%E5%AF%B9%E8%B1%A1%E6%A0%A1%E9%AA%8C%E5%99%A8*

我们来解决一个js的普遍需求。js诞生时，js的作用仅仅一个前端做表单检查的校验器。如今，各种校验框架早已成熟，但是我们仍然有大量的需求需要校验对象。比如后端返回的json我们需要校验，前端提交的json我们需要校验。数据管理中的store我们需要校验，或者说，任意一个函数，我们都需要对入参进行校验。

很多框架或者函数，直接把校验写在写在函数的最顶端。或许有的时候，我们会抽出一个公共函数来校验，比如这样：

```
const grund = (checker, handle, errorCallback = args => args) => (...args) => {
  const result = checker(...args)
  if (result.length) {
    errorCallback(result)
  } else {
    return handle(...args)
  }
}

const handle = (...args) => {
  console.log('正确处理', args)
  return '处理完毕'
}

const checker = (...args) => !args.length ? ['该函数的参数不能为空'] : []

grund(checker, handle, errors => console.log(errors))()
```

grund函数用来检验传入参数是否正确，如果正确，执行正确的处理逻辑，如果错误，执行异常处理逻辑。

由于checker过于简单，这并不能满足我们的需求。有时候，我们经常要根据多组条件校验，这就需要多个校验器。而把checker当做数组传入grund显然不是一个好方法。我们需要在checker函数中就传入多组校验器，而checker的工作就是负责把所有校验器合成运行，返回运行结果即可。

```
const checker = (...validators) => (...args) => {
  return validators.reduce((errors, validator) => {
    return validator(...args) ? errors : [...errors, validator.message]
  }, [])
}
```
注意这里我们使用了每个校验器的message属性，这似乎是`潜规则`，没错，这类似于前后端接口的约定字段`success,message`。几乎所有接口都叫这两个字段（即使不同，也大同小异）。我们调用时候，需要给每个校验器加上message字段。

```
const validator1 = () => false
validator1.message = '校验1不通过'

const validator2 = () => false
validator2.message = '校验2不通过'
checker(validator1, validator2)({})
```

好了，效果达成了。可是每个vdalidator都要设置message让人感到痛苦。如果能够自动添加message岂不是更好？我们可以用一个API创建校验器，让人一目了然。

```
const validator = (handle, message) => {
  const fun = (...args) => handle(...args)
  fun.message = message
  return fun
}
```

API类似于redux的actionCreator。能让我们轻松创建vilidator。使用时也非常简单。

```
const v1 = (object) => {
  return object.a === 1
}

const v2 = (object) => {
  return object.b === 2
}

const v3 = (object) => {
  return object.c === true
}

// test
const c1 = checker(validator(v1, 'error1'), validator(v2, 'error2'), validator(v3, 'error3'))
```
我们有三个校验规则，v1,v2,v3，通过validator创建了三个校验器传入checker，返回了检查器c1。代码非常清晰明了。

这时候我们开始验证。

```
const object = {
  a: 1,
  b: 2,
  c: false,
}

const handle = (...args) => {
  console.log('继续处理', args)
  return '返回正确'
}

grund(c1, handle, errors => console.log(errors))(object)
// => [ 'error3' ]
```
v3要求c属性必须是true,但是测试数据的c属性是false。好，检查器与校验器都能正常工作。可我们如果有这样的需求，需要object里面必须有a,b,c,d四个key，怎么办呢？

添加简单的validator当然没有问题。然而，保持高水平的编码规则需要一些有趣的技巧。高阶函数的本质就是参数可以作为返回函数闭包的行为配置，牢记这一点，可以让你随时随地返回需要函数的地方返回配置过的闭包。

以上面的需求为例。我们再创建一个所需键的简单列表会更加流畅。为了让这个创建列表的函数符合约定，我们让他返回一个闭包和一个错误。

```
const hasKeys = (...keys) => {
  const fun = obj => keys.every(key => obj[key] !== undefined)
  fun.message = `object must have value of keys: ${keys}`
  return fun
}
```
你会发现闭包用来检查给的对象是否有效。hasKeys的目的是为了向fun函数提供执行配置。此外，通过直接返回一个函数名，我们很好的描述了需求。从一个函数返回另一个函数的技术，这个过程中捕获参数-被称为柯里化。

使用示例如下：
```
const c1 = checker(validator(v1, 'error1'), validator(v2, 'error2'), validator(v3, 'error3'), hasKeys('a', 'b', 'c', 'd'))

const object = {
  a: 1,
  b: 2,
  c: true,
}

const handle = (...args) => {
  console.log('继续处理', args)
  return '返回正确'
}

grund(c1, handle, errors => console.log(errors))(object)
// => [ 'object must have value of keys: a,b,c,d' ]
```

当然，我们也可以直接运行c1函数。

```
const c1 = checker(validator(v1, 'error1'), validator(v2, 'error2'), validator(v3, 'error3'), hasKeys('a', 'b', 'c', 'd'))


const object1 = {
  a: 1,
  b: 2,
}

const object2 = {
  a: 1,
  b: 2,
  c: true,
  d: 1,
}

console.log(c1(object1))
// => [ 'error3', 'object must have value of keys: a,b,c,d' ]
console.log(c1(object2))
// => []
```

在任何情况下，使用c1检查器构建`语法一致性`，也就是说，在校验器固定的情况下，检查器会按照校验器所定义的方式校验，我们只需要传入需要校验的参数即可。
