### 以其他函数作为参数的函数

*本章的所有代码，均在https://github.com/antgod/functional/tree/master/stack/4.%E9%AB%98%E9%98%B6%E5%87%BD%E6%95%B0*

#### 关于传递函数的思考

- max
    在很多编程语言的核心库，都包含一个叫做max的函数。包括underscore也有这样的函数。

```
const max = (data) => {
  return data.reduce((maxer, next) => {
    return maxer > next ? maxer : next
  })
}

console.log(max([5, 1, 3, 4, 2])) // 输出5
```

执行结果并没有什么奇怪，但是这样特定的函数存在一个限制，如果我们不是从数字而是从对象中寻找最大值，该怎么办？

```
const max = (data, compare = item => item) => {
  return data.reduce((maxer, next) => {
    return compare(maxer) > compare(next) ? maxer : next
  })
}

console.log(max([{ age: 64 }, { age: 32 }, { age: 50 }], item => item.age))
```

但是，在某些方面，这个函数仍然受限，并不是真正的函数式，读者想想看，为什么呢？

这个函数的大于号，是定死的。

我们可以构建一个新的函数，一个用来生成可比较的值，另一个用来比较两个值返回最佳值。

```
const finder = (data, need, compare) => {
  return data.reduce((last, next) => {
    return compare(last) === need(compare(last), compare(next)) ? last : next
  })
}

const identity = prop => prop

console.log(finder([1, 2, 3, 4, 5], Math.max, identity))
```

当我们要比较对象大小时候，就可以传递第三个参数了。

```
const finder = (data, need, compare) => {
  return data.reduce((last, next) => {
    return compare(last) === need(compare(last), compare(next)) ? last : next
  })
}

const plucker = prop => item => item[prop]

console.log(finder([{ age: 64 }, { age: 32 }, { age: 50 }], Math.max, plucker('age')))
```

当我们要查找以B开头的名字，怎么办呢？

```
const finder = (data, need, compare) => {
  return data.reduce((last, next) => {
    return compare(last) === need(compare(last), compare(next)) ? last : next
  })
}

const plucker = prop => item => item[prop]

console.log(finder([{ name: 'A', age: 64 }, { name: 'B', age: 32 }, { name: 'C', age: 50 }], (x, y) => {
  return x.charAt(0) === 'B' ? x : y
}, plucker('name')))
```

#### 发现问题
我们发现，函数虽然短小精干，并且也按照了我们的预期工作。但是却有一些重复性代码。
```
// in finder
return compare(last) === need(compare(last), compare(next)) ? last : next

// in used
return x.charAt(0) === 'B' ? x : y
```
你会发现，这两段逻辑完全相同，也就是说，这两种算法都是返回最佳值或者当前值。

我们完全可以按照以下思路缩减代码：
- 如果第一个参数比第二个参数更好，返回第一个参数。

```
const bester = (data, need) => {
  return data.reduce((last, next) => {
    return need(last, next) ? last : next
  })
}

console.log(bester([{ name: 'A', age: 64 }, { name: 'B', age: 32 }, { name: 'C', age: 50 }], (x, y) => {
  return x.age < y.age
}))
```

#### 关于传递函数的思考：重复、与条件

上一章中，我们创建了接受两个函数参数的finder，并且简化成一个函数参数的bester。事实上，在大多数js函数设计中，都不需要返回多个函数。

但是某些情况下，我们需要返回多个函数。让我们以repeat开始，介绍为什么要使用多个函数为参数。

```
const range = (times) => {
  const ranges = []
  for (let idx = 0; idx < times; idx++) {
    ranges.push(null)
  }
  return ranges
}

const repeat = (value, time) => {
  return range(time).map(() => value)
}

console.log(repeat(4, 3))
```

range函数对underscore的range做了下删减，返回一个包含n个值为null的数组。

##### 使用函数，而不是值
作为repeat的常规实现方式，我们仍然有提高的空间。如果将重复值运算，那样使用场景更广泛。

比如我们要随机生成10个10以内的数字(range函数与前文相同)。

```
const repeatness = (createValue, time) => {
  return range(time).map((value, index) => createValue(index))
}


console.log(repeatness(() => Math.floor(Math.random() * 10) + 1, 10))
```

##### 一个函数是不够的，需要多参函数

有的时候，我们不知道函数需要调用多少次，我们只有一个条件。比如说，当我们不断重复调用一个函数，当函数超过某个阈值或者条件，我们停止调用。使用repeatness明显达不到我们的需求。

比如，我们想计算1024以下所有的2的整数指数值（2, 4, 8, 16, 32, 64, 128, 256, 512）。

```
const iterate = (createValue, checker, init) => {
  const ret = []
  let result = createValue(init)
  while (checker(result)) {
    ret.push(result)
    result = createValue(result)
  }
  return ret
}

console.log(iterate(n => n + n, n => n < 1024, 1))
```
函数接收两个函数参数，一个用来执行动作，一个用来校验结果。当结果满足时返回true。这算是repeatness的升级版了，连重复次数都是开放的，受到一个函数的执行结果影响。

### 返回其他函数的函数
回忆下之前repeatness返回三个常量的情况
```
repeatness(() => 'Odelay', 3)
```
这种返回常量的函数非常有用，是函数式编程的一种设计模式，通过函数来返回值。我们经常称之为k，为了清晰起见，我们称之为alwasy。
```
const always = value => () => value
console.log(repeatness(always('Odelay'), 3))
```

always的行为可以用来解释闭包。闭包用来捕获一个值，并多次返回相同的值。每一个新的闭包都会返回不一样的值

```
const f = always(() => {})

console.log(f() === f())
// => true
const g = always(() => {})

console.log(g() === f())
// => false
```

像always这样的函数被称为组合子。

#### 高阶函数捕获参数
高阶函数的参数用来配置返回函数的行为。
注意观察以下代码：
```
const makeAdder = init => rest => init + rest
const add100 = makeAdder(100)
console.log(add100(38))
// => 138
```
你会经常看到一个函数返回了一个捕获变量的函数。

##### 捕获变量的好处
比如你要生成一个特定前缀的随机字符串。
```
const uniqueString = prefix => [prefix, new Date().getTime()].join('')

console.log(uniqueString('ghosts'))
console.log(uniqueString('turkey'))
```

看起来不错，但是如果我们需要自增的索引，而不是时间戳作为后缀，怎么办？

可以使用闭包来实现：

```
const generator = (init, prefix) => {
  let counter = init
  return (pre = prefix) => {
    return [pre, counter++].join('')
  }
}

const g1 = generator(0, 'prefix')

console.log(g1())
console.log(g1())
console.log(g1('new'))
/*
=>
prefix0
prefix1
new2
*/
```

我们也可以用对象来实现：
```
const generator2 =  (init, prefix) => {
  return {
    count: init,
    uniqueString: function(pre = prefix) {
      return [pre, this.count++].join('')
    },
  }
}

const g2 = generator2(0, 'prefix')

console.log(g2.uniqueString.call(g2))
console.log(g2.uniqueString.call(g2))
console.log(g2.uniqueString('new'))
/*
=>
prefix0
prefix1
new2
*/
```
注意这里使用了this访问数据，那么函数不能再使用箭头函数。对象的缺点是不安全，因为可以随意访问 count的值。很多时候隐藏实现细节是很重要的。事实上，我们可以把count像闭包一样隐藏在函数内部。

```
const generator3 = (init, prefix) => {
  let counter = init
  return {
    uniqueString: (pre = prefix) => {
      return [pre, counter++].join('')
    },
  }
}

const g3 = generator3(0, 'prefix')

console.log(g3.uniqueString())
console.log(g3.uniqueString())
console.log(g3.uniqueString('new'))
/*
=>
prefix0
prefix1
new2
*/
```
闭包的方式干净、简单，但是也充满了陷阱。

##### 改值时候要小心
虽然对于外界操作来说，该变量是安全的。但是它会增加复杂度，当一个函数的返回值只依赖参数时，被称为引用透明。

这个词看起来很花哨，意味着不破坏代码结构的情况下，用预期的值替换函数的任意调用。当你使用会改变内部代码变量的闭包时，你不一定能做到这一点。因为很多闭包的返回值是依赖于调用次数的。也就是说，调用uniqueString10次与10000次，返回值是不同的。

所以我们在任何地方调用闭包的函数时，都需要格外小心，有必要时，需要增加监控或者日志。否则在闭包返回值值任意变化时，我们往往找不到变化原因。

#### 防止不存在的函数: fnull(grund)
我们创建几个高阶函数的例子，第一个叫做fnull，我们先来举例说明下它的目的。

假设我们有一组需要乘法的数组：
```
const nums = [1, 2, 3, null, 5]

console.log(nums.reduce((total, n) => (total * n)))
```

很显然null不会给我们任何有用的答案。这时候fnull函数很有用。

```
const nums = [1, 2, 3, null, 5]
const fillnull = (handle, ...args) => (...argvs) => handle(...argvs.map((argv, i) => argv || args[i]))

console.log(nums.reduce(fillnull((total, n) => { return total * n }, 1, 1)))
```

函数检查每个传入的参数是否是null或者undefined。如果是，则用默认值替换掉，然后再调用函数。

如果要查找的目标是对象，可以用以下方式使用：

```
const defaults = d => (o, k) => {
  const val = fillnull(identity, d[k])
  return o && val(o[k])
}

const ages = [{ age: 100 }, { age: 120 }, { age: 150 }, { }, { age: 30 }]

const lookup = defaults({ age: 0 })

console.log(ages.reduce((total, age) => {
  return total + lookup(age, 'age')
}, 0))
```

其中defaults函数用来配置默认值，返回一个函数lookup，之后每次执行lookup函数，如果遇到空值，都会返回默认值代替。
