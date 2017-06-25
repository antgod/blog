#### 动态作用域
在任何JS核心引擎中，都有一张全局表来存储全局变量
```
const _ = require('../util/understore')

// 动态作用域，任何JS核心引擎中，有个全局查找表
const globals = {}

const makeBind = resolver => (name, val) => {
  const stack = globals[name] || []
  globals[name] = resolver(stack, val)
  return globals
}

const stackBinder = makeBind((stack, val) => {
  stack.push(val)
  return stack
})

const stackUnBinder = makeBind((stack) => {
  stack.pop()
  return stack
})

const dynmicLookup = (name) => {
  const slot = globals[name] || []
  return _.last(slot)
}

stackBinder('a', 1)
stackBinder('a', 2)
stackBinder('b', 100)
console.log(dynmicLookup('a'))
stackUnBinder('a')
console.log(dynmicLookup('a'))

const f = () => {
  return dynmicLookup('a')
}

const g = () => {
  stackBinder('a', 'g')
  return f()
}

console.log(f())
// 动态作用域的缺点，任何绑定值，在确定调用函数之前，都是不可知的。
console.log(g())

```

#### 绑定
我们无法精确控制函数中的this是什么，因为函数的this由调用者决定。
所以，我们需要在调用函数前进行绑定。
```
const bindAll = (obj, ...funs) => {
  return funs.map(fun => obj[fun] = obj[fun].bind(obj))
}

const target = {
  name: 'name',
  a: function () {
    return this.name
  },
  b: function () {
    return this.a()
  },
}
console.log(target.b())

// 以下方式会报错
// console.log(target.b.call('lhj'))

// 使用bindAll解决这个问题，预绑定
bindAll(target, 'a', 'b')

console.log(target.b.call('lhj'))
```

#### 闭包
闭包的用途非常广泛，任何函数内部能读取外部变量（包括参数，全局变量，私有变量），这就形成了一个闭包。
```
// 求平均数
const average = array => array.reduce((prev, next) => prev + next) / array.length

// 求指定数字与通过函数生成另外一个数字
const averageDynmic = fun => n => average([n].concat(fun(n)))

console.log(averageDynmic(n => ([n * n]))(10))

// 求反义函数
const complement = fun => (...args) => !fun(...args)

const isOdd = n => n % 2 === 0

const isEven = complement(isOdd)

console.log(isOdd(1), isOdd(2))
console.log(isEven(1), isEven(2))

// 封装数据
const Team = () => {
  let num = 1
  const people = {
    lhj: {
      age: 30,
    },
  }
  return {
    add: n => num += n,
    del: n => num -= n,
    update: (name, value) => people[name] = value,
  }
}

const t1 = Team()
console.log(t1.add(3))
console.log(t1.del(2))

console.log(t1.update('lhj', {
  age: 31,
}))
```