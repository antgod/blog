### PostCSS简介
- 介绍

PostCSS 是一个翻译样式的js插件。它能帮你对css做静态分析。支持变量和混入.编译尚未被浏览器支持的css预发，内联图片等等。业界被广泛地应用，其中不乏很多有名的行业领导者，如：维基百科，Twitter，阿里巴巴， JetBrains。PostCSS 的 Autoprefixer 插件是最流行的 CSS 处理工具之一。

- 发展

PostCSS 是 Autoprefixer 的开发者 Andrey Sitnik 开发的，最初是一个通过 JavaScript 来处理 CSS 的方法。PostCSS 本身只是一个 API，不过加上庞大的插件生态体系，作用就非常强大了。为了提供有用的调试功能，PostCSS 还生成了源码的 map，而且还提供了抽象语法树(AST)来帮助我们理解代码是如何被转换的。

- 作用

JavaScript 能做到比其他处理方式更快的转换我们的样式。通过Gulp或Webpack这样的task工具，我们可以在 build 过程中对样式进行转换，这与 Sass 和 LESS 的编译过程非常类似。React 和 AngularJS 这样的库和框架还允许我们在 JavaScript 中直接编写 CSS 代码，这为使用 JavaScript 来转换样式打开了一扇大门。

[PostCSS介绍][1]<br/>
[PostCSS API][2]<br/>
[Autoprefixer][3]<br/>

### 插件介绍

到目前为止是PostCSS欣欣向荣的插件生态系统使得PostCSS如此惊艳，我确信你也已经认识到了这一点。这里有很多很好的插件，随着时间的推移，未来会涌现出更多优秀的插件，主要的原因是PostCSS开发插件对于有一些JavaScript开发经验的人来说非常容易。

开发PostCSS插件，不需要特别的许可；如果你想开发一个，那就立马去做吧。通过这种自由的状态，你将有能力使CSS的开发流程逐步演变成你所希望的样子，更不必说快速增长的PostCSS社区，使你有机会与其他成员分享你的工作。

在这个教程里你将学习如何开发一个基本的PostCSS插件。我们不会插件在API上讲太多，也不会使用任何超级的编码。我本身是一个前端开发者，我的JavaScript技能水平属于前端开发人员的基本水平，然而这并没有阻止我，我在仅仅一两个小时里就完成了我的第一个PostCSS插件。

参与其中亲自看看，你才能知道PostCSS插件开发有多么的容易！

### 它可以做什么？

我们将要创建插件，这个插件能插入一些默认样式。编译函数，添加前缀，转换进制等功能。

- 输入
```
a {
	font-family: "Open Sans", family("helloworld");
	font-size: 1rem;
	flex: 1;
}
```

- 输出
```
html, body, ul{
	margin: 0;
	padding: 0;
	/* 用户自定义样式 */
}
a {
	color: black;
	background-color: white;
	font-family: "Open Sans", Arial, Helvetica, sans-serif;
	font-size: 12px;
	-webkit-flex: 1;
	-ms-flex: 1;
	/* 用户自定义样式 */
}
```

### 工程搭建

虽然我们是在创建自己的插件，但是仍然需要先创建一个空的Gulp或Webpack项目。

[PostCSS介绍][4]中有完整的项目搭建说明。如果你不想自己搭建环境，你也可以使用[PostCSS样例][5]，这里有完整的gulp与webpack已搭建好的环境以及运行文档。

### [编写PostCSS插件][6]

在`node_modules`中创建一个文件夹命名为 `postcss-plugin-demo`。常见的命名方式是使用postcss-前缀，明确插件是PostCSS插件。由于某些编辑器node_modules是隐藏文件夹，不易编写代码，我们也可以把`postcss-plugin-demo`移动到与`node_modules`并列文件夹。

在`postcss-plugin-demo`目录下中创建名为`index.js`的文件，并且加载postcss的主模块。
```
const postcss = require('postcss')
```

接下来是基本的包装器，用来包装我们的插件处理代码：
```
const postcss = require('postcss');

module.exports = postcss.plugin('myplugin', function myplugin(options) {

    return function (css) {

        options = options || {};

        // Processing code will be added here

    }

});
```

### 读取插件
现在你可以加载你刚刚创建的插件了。但是插件里面没有任何代码，我们仅仅想得到必要的设置。

#### 通过Gulp加载
如果你使用Gulp,`gulpfile.js`导入刚才的插件：
```
const myplugin = require('../postcss-plugin-demo');
const processors = [ myplugin() ]
```

并且把css封装成task命令：
```
gulp.task('css', function () {
	return gulp.src('./src/*.css')
		.pipe(postcss(processors))
		.pipe(gulp.dest('./dest'));
});
```

然后运行
```
$ gulp css
```
即可在`dest`目录下生成新的编译后文件`style.css`

#### 通过Webpack加载

webpack不能直接编译css文件，必须通过js引入css才能编译。`webpack.config.js`导入刚才的插件：
```
const myplugin = require('../postcss-plugin-demo');
const processors = [ myplugin() ]
```

并且把css封装成rules规则：
```
{
  ...
  module: {
    rules: [
      {
        test: /\.css$/, use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: [{
          loader: 'css-loader'
        }, {
          loader: 'postcss-loader',
          options: {
            plugins() {
              return processors
            }
          }
        }]
      })
      },
    ]
  },
  ...
}
```

然后运行：
```
$ webpack
```
即可在`dest`目录下生成新的编译后文件`style.css`。

### 编写插件功能
#### 添加css
开始编写插件之前，我们先创建一段插件编译的样式测试代码。

在你的`src/style.css`下添加：
```
a {
	font-family: "Open Sans", family("helloworld");
	font-size: 1rem;
	flex: 1;
}
```

现在，因为你的插件并没有做任何事情，如果你编译你的css文件你会在`dest`文件夹下面看到完全一样的复制代码`dest/style.css`。

#### 开始编写插件
在你的插件`postcss-plugin-demo/index.js`里`options = options || {}`下添加：
```
/* 插入初始化html, body属性 */
const base = postcss.parse(`html, body, ul{
	margin: 0;
	padding: 0;
}`)
css.prepend(base)
```
返回到gulp(或webpack)运行编译命令：
```
$ gulp css
```
查看你的编译后文件，插入了一段语句：
```
html, body, ul{
	margin: 0;
	padding: 0;
	/* 用户自定义样式 */
}
```
你已经成功的编写了一段插件代码。
更多API请查看：[PostCSS API][2]

#### 遍历你的css样式表
在css中，每个选择器以及后面的样式叫做`rule`规则，每行样式叫做`decl`声明,例如：
```
a {
    color: red;
}
```
那么这个css就一条规则`a{ color: red; }`，这个规则有一个声明`color: red;`。

如果我们想遍历查询我们的样式文件，我们可以在`options = options || {}`下面添加以下代码：

```
css.walkRules(function (rule) {

    rule.walkDecls(function (decl, i) {

    });

});
```
使用`walkRules`来遍历css文件每一条规则，接着，在每条规则里面，使用`walkDecls`遍历你的每一条声明。

### 给某些选择器增加样式
`walkRules`的回调函数里有两个参数，第一个参数就是规则，第二个参数是规则的索引。如果感兴趣，可以手动把规则全部打印出来看一下。

`rule.selector`用来获取规则的选择器名称。我们把所有的文字选择器增加两条css声明，黑色文字，白色背景。在`walkRules`回调函数下面添加这段代码：
```
const texts = ['label', 'a', 'span']
if(texts.includes(rule.selector)) {
	// 插入样式属性: color, background-color
	const color = postcss.decl({ prop: 'color', value: 'black' })
	const bgColor = postcss.decl({ prop: 'background-color', value: 'white' })
	rule.prepend(color, bgColor)
}
console.log(`${rowIndex + 1 }.处理选择器：`, rule.selector)
```
返回到gulp(或webpack)运行编译命令：
```
$ gulp css
```
查看你的编译后文件：
```
html, body, ul{
	margin: 0;
	padding: 0;
	/* 用户自定义样式 */
}
a {
	color: black;
	background-color: white;
	font-family: "Open Sans", family("helloworld");
	font-size: 1rem;
	flex: 1;
}
```
`a`选择器的规则里添加了`color,background-color`两个样式。

同时，控制台打印出来：
```
$ 1.处理选择器： html, body, ul
$ 2.处理选择器： a
```

### 处理具体样式声明
`walkDecls`的回调函数里同样有有两个参数。

- 第一个参数是样式声明，例如`font-family: "Open Sans", family("helloworld");`
- 第二个参数是声明的索引。声明里有两个重要的属性`prop, value`。
    - pros: 样式名称，例如`font-family`
    - value: 样式值，例如`"Open Sans", family("helloworld")`。

利用这两个值，我们就可以随意处理样式声明。在`walkDecls`回调函数之内添加以下代码：
```
// 转换rem为px
if(value.includes('rem')) {
	decl.value = value.replace(/(.)rem/, (matched, catched) => {
		return Number(catched) * 12 + 'px'
	})
}

// 增加前缀
if(prefixs.includes(prop)) {
	decl.prop = decl.clone({ prop: '-webkit-' + prop }).prop
rule.append(decl.clone({ prop: '-ms-' + prop }))
}

// 转换关键字
if (value.includes('family')) {
  decl.value = replaceValues(value);
}
```

这里的`reaplaceValues`函数可以随意实现，我们暂时用以下代码（看不懂可以慢慢看，正则写法比难懂）
```
function replaceValues(str) {
  const mapper = {
    helloworld: 'Arial, Helvetica, sans-serif'
  }

  return str.replace(/(.*)family\(\"(.*)\"\)/, (all, prefix, matched, index, input) => {
    const mapped = mapper[matched]
    return mapped ? `${prefix}${mapped}` : input
  })
}
```

返回到gulp(或webpack)运行编译命令：
```
$ gulp css
```
查看你的编译后文件：
```
html, body, ul{
	margin: 0;
	padding: 0;
}
a {
	color: black;
	background-color: white;
	font-family: "Open Sans", Arial, Helvetica, sans-serif;
	font-size: 12px;
	-webkit-flex: 1;
	-ms-flex: 1;
}
```

可以看到,`flex`属性增加了前缀，`1rem`编译成了`12px`，`family("helloworld")`编译成`Arial, Helvetica, sans-serif`。

同时控制台准确的打印出每条规则与每个声明：
```
1.处理选择器： html, body, ul
1.1.处理选择器属性： margin
1.2.处理选择器属性： padding
2.处理选择器： a
2.1.处理选择器属性： color
2.2.处理选择器属性： background-color
2.3.处理选择器属性： font-family
2.4.处理选择器属性： font-size
2.5.处理选择器属性： flex
2.6.处理选择器属性： -ms-flex
3.处理选择器： label
3.1.处理选择器属性： color
3.2.处理选择器属性： background-color
3.3.处理选择器属性： font-family
```

#### 根据外界参数处理样式
有时候，我们需要根据参数来做判断或者编译。比如刚才`family("helloworld")`是定死在插件内的。如果用户需要编译其他样式，肯定不能取修改插件。

这种情况我们可以让用户传入要编译的内容。然后在插件内与`helloworld`合并。

修改`gulp/package.json`，添加用户自定义编译内容到最外层json：
```
"myConfig": {
  "myHelloworld": "Arial, Helvetica Neue, Helvetica, sans-serif"
}
```

把用户定义的编译内容传入插件内：
```
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const config = require('./package.json')
const myplugin = require('../postcss-plugin-demo')

const processors = [ myplugin(config.myConfig) ]

gulp.task('css', function () {
	return gulp.src('./src/*.css')
		.pipe(postcss(processors))
		.pipe(gulp.dest('./dest'));
});
```

插件的包装器回调传入的`options`就是刚才我们传入的`myConfig`：
```
module.exports = postcss.plugin('myplugin', function (options) {
	return function (css) {
		options = options || {}
```
我们把这个属性传入`replaceValues`函数中，与helloworld合并：
```
function replaceValues(str, options) {
  const mapper = Object.assign({
		helloworld: 'Arial, Helvetica, sans-serif',
  }, options)

  return str.replace(/(.*)family\(\"(.*)\"\)/, (all, prefix, matched, index, input) => {
    const mapped = mapper[matched]
    return mapped ? `${prefix}${mapped}` : input
  })
}
```

然后我们修改`src/style.css`，添加一个新规则`label`,引用刚才定义的`myHelloworld`：
```
a {
	font-family: "Open Sans", family("helloworld");
	font-size: 1rem;
	flex: 1;
}

label {
	font-family: "Open Sans", family("myHelloworld");
}

```
返回到gulp(或webpack)运行编译命令：
```
$ gulp css
```
查看你的编译后文件，这就是我们最终的代码了：
```
html, body, ul{
	margin: 0;
	padding: 0;
}

a {
	color: black;
	background-color: white;
	font-family: "Open Sans", Arial, Helvetica, sans-serif;
	font-size: 12px;
	-webkit-flex: 1;
	-ms-flex: 1;
}

label {
	color: black;
	background-color: white;
	font-family: "Open Sans", Arial, Helvetica Neue, Helvetica, sans-serif;
}
```
`family('myHelloworld')`被编译成了`Arial, Helvetica Neue, Helvetica, sans-serif`。

### 大功告成

你完成了所有想实现的功能。

如果有什么不理想的地方，请参考这份代码：[PostCSS Demo][5]

### 让我们回顾一下

你刚刚创建了PostCSS插件，我希望你已经迸发出一些其他插件的想法，并且你很愿意去实现他们。或许写css时候，总被各种重复的小问题困扰，现在你可以尝试用自己的解决方案去解决它。另外，你也许想到css除了盒子模型，还可以做一些其他的事情，你都可以慢慢实现。

### 总结下我们的功能点：

- Start developing a new plugin by setting up a Gulp or Grunt project to work in.
- Create a new node module inside your project, which will become your plugin.
- Load your new plugin into your project.
- Add some test CSS in the syntax you want your plugin to use.
- Use methods from the PostCSS API to scan through a stylesheet.
- Locate instances of your plugin's syntax being used.
- Write JavaScript and use the PostCSS API to make the appropriate transformations (and/or additions) to the original code and send it into the processed CSS.

  [1]: https://github.com/postcss/postcss
  [2]: http://api.postcss.org/postcss.html
  [3]: https://github.com/postcss/autoprefixer
  [4]: https://github.com/postcss/postcss
  [5]: https://github.com/antgod/postcss-demo
  [6]: https://github.com/postcss/postcss/blob/master/docs/writing-a-plugin.md